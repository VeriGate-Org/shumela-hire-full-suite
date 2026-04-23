package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;
import com.arthmatic.shumelahire.repository.PipelineTransitionDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class PipelineService {

    @Autowired
    private PipelineTransitionDataRepository pipelineTransitionRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private BackgroundCheckDataRepository backgroundCheckRepository;

    @Autowired(required = false)
    private BackgroundCheckService backgroundCheckService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Core transition operations
    public PipelineTransition moveApplicationToStage(String applicationId, PipelineStage targetStage, 
                                                    String reason, String notes, String performedBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        return moveApplicationToStage(application, targetStage, TransitionType.PROGRESSION, 
                                    reason, notes, performedBy, false, null);
    }

    public PipelineTransition moveApplicationToStage(Application application, PipelineStage targetStage, 
                                                    TransitionType transitionType, String reason, 
                                                    String notes, String performedBy, boolean automated,
                                                    Map<String, Object> metadata) {
        // Validate transition
        if (!application.canProgressToStage(targetStage)) {
            throw new IllegalStateException(
                String.format("Cannot move application from %s to %s",
                    application.getPipelineStage(), targetStage));
        }

        PipelineStage currentStage = application.getPipelineStage();

        // Enforce required background check completion when moving from BACKGROUND_CHECK
        if (currentStage == PipelineStage.BACKGROUND_CHECK && targetStage.getOrder() > currentStage.getOrder()) {
            if (backgroundCheckService != null) {
                backgroundCheckService.enforceBackgroundCheckCompletion(application);
            } else {
                enforceBackgroundCheckCompletion(application);
            }
        }
        
        // Calculate duration in previous stage
        Long durationHours = null;
        if (application.getPipelineStageEnteredAt() != null) {
            durationHours = ChronoUnit.HOURS.between(
                application.getPipelineStageEnteredAt(), LocalDateTime.now());
        }

        // Create transition record
        PipelineTransition transition = new PipelineTransition(
            application, currentStage, targetStage, transitionType, performedBy);
        transition.setReason(reason);
        transition.setNotes(notes);
        transition.setAutomated(automated);
        transition.setDurationInPreviousStageHours(durationHours);
        
        if (metadata != null) {
            try {
                transition.setMetadata(objectMapper.writeValueAsString(metadata));
            } catch (JsonProcessingException e) {
                // Log error but don't fail the transition
                transition.setMetadata("{}");
            }
        }

        // Update application stage
        application.setPipelineStage(targetStage);
        application.setPipelineStageEnteredAt(LocalDateTime.now());
        
        // Save transition and application
        PipelineTransition savedTransition = pipelineTransitionRepository.save(transition);
        applicationRepository.save(application);

        // Log audit
        auditLogService.logUserAction(
            performedBy,
            "PIPELINE_TRANSITION",
            "Application",
            String.format("Moved application %s from %s to %s",
                application.getId(),
                currentStage != null ? currentStage.getDisplayName() : "Start",
                targetStage.getDisplayName())
        );

        // Send notifications based on transition type
        if (transitionType == TransitionType.REJECTION) {
            notificationService.notifyApplicationRejected(application);
        } else {
            notificationService.notifyPipelineStageChanged(application,
                currentStage != null ? currentStage.getDisplayName() : "Start",
                targetStage.getDisplayName());
        }

        return savedTransition;
    }

    public PipelineTransition rejectApplication(String applicationId, PipelineStage rejectionStage, 
                                              String reason, String notes, String rejectedBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        return moveApplicationToStage(application, rejectionStage, TransitionType.REJECTION, 
                                    reason, notes, rejectedBy, false, null);
    }

    public PipelineTransition withdrawApplication(String applicationId, String reason, 
                                                String notes, String withdrawnBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        return moveApplicationToStage(application, PipelineStage.WITHDRAWN, TransitionType.WITHDRAWAL, 
                                    reason, notes, withdrawnBy, false, null);
    }

    public PipelineTransition progressToNextStage(String applicationId, String reason, 
                                                String notes, String performedBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        PipelineStage nextStage = application.getPipelineStage().getNextStage();
        if (nextStage == null) {
            throw new IllegalStateException("Application is already at the final stage");
        }

        return moveApplicationToStage(application, nextStage, TransitionType.PROGRESSION, 
                                    reason, notes, performedBy, false, null);
    }

    // Automated transitions
    public PipelineTransition automateTransitionFromInterview(String applicationId, String interviewId, 
                                                            PipelineStage targetStage, 
                                                            InterviewRecommendation recommendation) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("interviewId", interviewId);
        metadata.put("recommendation", recommendation.name());

        PipelineTransition transition = moveApplicationToStage(
            application, targetStage, TransitionType.PROGRESSION,
            "Automated progression based on interview recommendation: " + recommendation.getDisplayName(),
            null, "SYSTEM", true, metadata);

        transition.setTriggeredByInterviewId(interviewId);
        return pipelineTransitionRepository.save(transition);
    }

    // Query operations
    public List<PipelineTransition> getApplicationTimeline(String applicationId) {
        return pipelineTransitionRepository.findTransitionTimelineByApplicationId(applicationId);
    }

    public Optional<PipelineTransition> getLatestTransition(String applicationId) {
        return pipelineTransitionRepository.findLatestTransitionByApplicationId(applicationId);
    }

    public List<PipelineTransition> getRecentActivity(int hours, int limit) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return pipelineTransitionRepository.findRecentActivity(since, limit);
    }

    // Analytics and reporting
    public Map<String, Object> getPipelineAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();

        // Funnel data
        List<Object[]> funnelData = pipelineTransitionRepository.getPipelineFunnelData(startDate, endDate);
        Map<String, Long> funnel = new LinkedHashMap<>();
        for (Object[] row : funnelData) {
            PipelineStage stage = (PipelineStage) row[0];
            Long count = (Long) row[1];
            funnel.put(stage.getDisplayName(), count);
        }
        analytics.put("funnel", funnel);

        // Stage durations
        List<Object[]> durationData = pipelineTransitionRepository.getAverageStageDurations(startDate, endDate);
        Map<String, Double> averageDurations = new HashMap<>();
        for (Object[] row : durationData) {
            PipelineStage stage = (PipelineStage) row[0];
            Double avgHours = (Double) row[1];
            averageDurations.put(stage.getDisplayName(), avgHours);
        }
        analytics.put("averageStageDurations", averageDurations);

        // Conversion rates
        List<Object[]> conversionData = pipelineTransitionRepository.getStageConversionRates(startDate, endDate);
        Map<String, Map<String, Long>> conversions = new HashMap<>();
        for (Object[] row : conversionData) {
            PipelineStage fromStage = (PipelineStage) row[0];
            PipelineStage toStage = (PipelineStage) row[1];
            Long count = (Long) row[2];
            
            conversions.computeIfAbsent(fromStage.getDisplayName(), k -> new HashMap<>())
                      .put(toStage.getDisplayName(), count);
        }
        analytics.put("conversions", conversions);

        // Success rates
        List<Object[]> successData = pipelineTransitionRepository.getSuccessRatesByStage(startDate, endDate);
        Map<String, Double> successRates = new HashMap<>();
        for (Object[] row : successData) {
            PipelineStage stage = (PipelineStage) row[0];
            Long successful = (Long) row[1];
            Long total = (Long) row[2];
            double rate = total > 0 ? (successful.doubleValue() / total.doubleValue()) * 100 : 0.0;
            successRates.put(stage.getDisplayName(), rate);
        }
        analytics.put("successRates", successRates);

        // Transition velocity
        List<Object[]> velocityData = pipelineTransitionRepository.getTransitionVelocity(startDate, endDate);
        Map<String, Long> velocity = new LinkedHashMap<>();
        for (Object[] row : velocityData) {
            String date = row[0].toString();
            Long count = (Long) row[1];
            velocity.put(date, count);
        }
        analytics.put("velocity", velocity);

        // Automation statistics
        List<Object[]> automationData = pipelineTransitionRepository.getAutomationStatistics(startDate, endDate);
        Map<String, Long> automation = new HashMap<>();
        for (Object[] row : automationData) {
            Boolean automated = (Boolean) row[0];
            Long count = (Long) row[1];
            automation.put(automated ? "Automated" : "Manual", count);
        }
        analytics.put("automation", automation);

        return analytics;
    }

    public Map<String, Object> getBottleneckAnalysis(int thresholdDays, LocalDateTime startDate, 
                                                   LocalDateTime endDate) {
        long thresholdHours = thresholdDays * 24L;
        List<Object[]> bottlenecks = pipelineTransitionRepository.identifyBottlenecks(
            thresholdHours, startDate, endDate);

        Map<String, Object> analysis = new HashMap<>();
        Map<String, Map<String, Object>> bottleneckData = new LinkedHashMap<>();
        
        for (Object[] row : bottlenecks) {
            PipelineStage stage = (PipelineStage) row[0];
            Double avgHours = (Double) row[1];
            Long count = (Long) row[2];
            
            Map<String, Object> stageData = new HashMap<>();
            stageData.put("averageHours", avgHours);
            stageData.put("averageDays", avgHours / 24.0);
            stageData.put("affectedApplications", count);
            
            bottleneckData.put(stage.getDisplayName(), stageData);
        }
        
        analysis.put("bottlenecks", bottleneckData);
        analysis.put("thresholdDays", thresholdDays);
        
        return analysis;
    }

    public Map<String, Object> getRejectionAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> rejectionData = pipelineTransitionRepository.getRejectionAnalysis(startDate, endDate);
        
        Map<String, Map<String, Long>> rejections = new HashMap<>();
        for (Object[] row : rejectionData) {
            PipelineStage stage = (PipelineStage) row[0];
            String reason = (String) row[1];
            Long count = (Long) row[2];
            
            rejections.computeIfAbsent(stage.getDisplayName(), k -> new HashMap<>())
                     .put(reason != null ? reason : "No reason provided", count);
        }
        
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("rejectionsByStage", rejections);
        
        return analysis;
    }

    public Map<String, Object> getWithdrawalAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> withdrawalData = pipelineTransitionRepository.getWithdrawalAnalysis(startDate, endDate);
        
        Map<String, Map<String, Long>> withdrawals = new HashMap<>();
        for (Object[] row : withdrawalData) {
            PipelineStage stage = (PipelineStage) row[0];
            String reason = (String) row[1];
            Long count = (Long) row[2];
            
            withdrawals.computeIfAbsent(stage.getDisplayName(), k -> new HashMap<>())
                      .put(reason != null ? reason : "No reason provided", count);
        }
        
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("withdrawalsByStage", withdrawals);
        
        return analysis;
    }

    public List<Application> getApplicationsStuckInStage(PipelineStage stage, int days) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        return pipelineTransitionRepository.findApplicationsStuckInStage(stage, cutoffDate);
    }

    public Map<String, Object> getDepartmentPipelineStats(LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> deptData = pipelineTransitionRepository.getDepartmentPipelineStats(startDate, endDate);
        
        Map<String, Map<String, Long>> departments = new HashMap<>();
        for (Object[] row : deptData) {
            String department = (String) row[0];
            PipelineStage stage = (PipelineStage) row[1];
            Long count = (Long) row[2];
            
            departments.computeIfAbsent(department, k -> new HashMap<>())
                      .put(stage.getDisplayName(), count);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("departmentPipelines", departments);
        
        return stats;
    }

    public Map<String, Object> getJobPostingPipelineStats(String jobPostingId, LocalDateTime startDate, 
                                                         LocalDateTime endDate) {
        List<Object[]> jobData = pipelineTransitionRepository.getJobPostingPipelineStats(
            jobPostingId, startDate, endDate);
        
        Map<String, Long> pipeline = new LinkedHashMap<>();
        for (Object[] row : jobData) {
            PipelineStage stage = (PipelineStage) row[1];
            Long count = (Long) row[2];
            pipeline.put(stage.getDisplayName(), count);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("pipeline", pipeline);
        stats.put("jobPostingId", jobPostingId);
        
        return stats;
    }

    // Utility methods
    public List<PipelineStage> getAvailableTransitions(String applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        PipelineStage currentStage = application.getPipelineStage();
        List<PipelineStage> availableStages = new ArrayList<>();
        
        // Add next stage
        PipelineStage nextStage = currentStage.getNextStage();
        if (nextStage != null) {
            availableStages.add(nextStage);
        }
        
        // Add terminal stages (can always reject/withdraw)
        for (PipelineStage stage : PipelineStage.getTerminalStages()) {
            if (currentStage.canProgressTo(stage)) {
                availableStages.add(stage);
            }
        }
        
        // Add stages that can be skipped to
        for (PipelineStage stage : PipelineStage.getActiveStages()) {
            if (currentStage.canProgressTo(stage) && !availableStages.contains(stage)) {
                availableStages.add(stage);
            }
        }
        
        return availableStages;
    }

    public boolean canAutoProgress(Application application, InterviewRecommendation recommendation) {
        PipelineStage currentStage = application.getPipelineStage();
        
        switch (recommendation) {
            case HIRE:
                return currentStage.getNextStage() != null;
            case ANOTHER_ROUND:
                // Can progress to next interview stage
                PipelineStage nextStage = currentStage.getNextStage();
                return nextStage != null && 
                       (nextStage.getDisplayName().toLowerCase().contains("interview") ||
                        nextStage.getDisplayName().toLowerCase().contains("assessment"));
            case REJECT:
                return true; // Can always reject
            default:
                return false; // Manual review required
        }
    }

    public Map<String, Object> getTransitionTypeStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> typeData = pipelineTransitionRepository.getTransitionTypeStatistics(startDate, endDate);
        
        Map<String, Long> statistics = new HashMap<>();
        for (Object[] row : typeData) {
            TransitionType type = (TransitionType) row[0];
            Long count = (Long) row[1];
            statistics.put(type.getDisplayName(), count);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("transitionTypes", statistics);
        
        return result;
    }

    public List<PipelineTransition> getRegressionAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        return pipelineTransitionRepository.findRegressions(startDate, endDate);
    }

    private void enforceBackgroundCheckCompletion(Application application) {
        JobPosting jobPosting = application.getJobPosting();
        if (jobPosting == null || !Boolean.TRUE.equals(jobPosting.getEnforceCheckCompletion())) {
            return;
        }

        String requiredCheckTypesJson = jobPosting.getRequiredCheckTypes();
        if (requiredCheckTypesJson == null || requiredCheckTypesJson.isBlank()) {
            return;
        }

        List<String> requiredTypes;
        try {
            requiredTypes = objectMapper.readValue(requiredCheckTypesJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return;
        }

        if (requiredTypes.isEmpty()) {
            return;
        }

        List<BackgroundCheck> checks = backgroundCheckRepository
                .findByApplicationIdOrderByCreatedAtDesc(application.getId());

        Set<String> completedClearTypes = new HashSet<>();
        for (BackgroundCheck check : checks) {
            if (check.getStatus() == BackgroundCheckStatus.COMPLETED
                    && check.getOverallResult() == BackgroundCheckResult.CLEAR) {
                try {
                    List<String> checkTypes = objectMapper.readValue(
                            check.getCheckTypes() != null ? check.getCheckTypes() : "[]",
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                    completedClearTypes.addAll(checkTypes);
                } catch (JsonProcessingException e) {
                    // skip malformed entries
                }
            }
        }

        List<String> missing = requiredTypes.stream()
                .filter(t -> !completedClearTypes.contains(t))
                .toList();

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot progress past Background Check stage. The following required verification checks " +
                    "are not completed with CLEAR result: " + String.join(", ", missing));
        }
    }

    public Map<String, Object> getUserActivityStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> userData = pipelineTransitionRepository.getUserActivityStatistics(startDate, endDate);
        
        Map<Long, Long> userActivity = new HashMap<>();
        for (Object[] row : userData) {
            Long userId = (Long) row[0];
            Long count = (Long) row[1];
            userActivity.put(userId, count);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("userActivity", userActivity);
        
        return stats;
    }
}