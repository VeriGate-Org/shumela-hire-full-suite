package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.BoardCardResponse;
import com.arthmatic.shumelahire.dto.PipelineAnalyticsResponse;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;
import com.arthmatic.shumelahire.repository.PipelineTransitionDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.InterviewDataRepository;
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

    @Autowired
    private OfferDataRepository offerRepository;

    @Autowired
    private InterviewDataRepository interviewRepository;

    @Autowired
    private ApplicationJobPostingResolver jobPostingResolver;

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

        if (PipelineStage.requiresCompletedChecks(currentStage, targetStage)) {
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
            "Application", application.getId(),
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
    /**
     * The largest window of transitions any analytics call will read at once.
     *
     * <p>The board and the dashboard both look at a quarter. A cap is here because this is a single
     * indexed read rather than a paged one, and an unbounded range on a busy tenant is a slow query
     * dressed as an analytics feature.
     */
    public static final int MAX_ANALYTICS_TRANSITIONS = 20_000;

    /**
     * What the pipeline is doing, over a window.
     *
     * <p><b>Rewritten because none of this ran.</b> The previous implementation called eight
     * repository methods returning {@code List<Object[]>}, and the only implementation of every one
     * of them throws {@code UnsupportedOperationException("Analytics queries will be migrated to
     * Athena")}. There is no JPA implementation — the interface names one in a comment, and no such
     * class exists anywhere in the backend. So {@code GET /api/pipeline/analytics} returned a 500
     * on every call, which is why the recruiter dashboard has been rendering a page of zeroes: it
     * reads the result inside an {@code if (ok)} with no else branch.
     *
     * <p>Now: one indexed read of the transitions in the window, and the aggregates computed in
     * Java by {@link PipelineAnalyticsResponse}. Slower than a database aggregate and enormously
     * faster than a query that throws.
     */
    public PipelineAnalyticsResponse getPipelineAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        List<PipelineTransition> transitions = pipelineTransitionRepository
                .findTransitionsByDateRange(startDate, endDate, MAX_ANALYTICS_TRANSITIONS);
        return PipelineAnalyticsResponse.from(transitions);
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
    /**
     * The largest batch {@link #getBoardCards} will accept.
     *
     * <p>A pipeline column holds tens, not thousands. Rejecting an over-long request rather than
     * truncating it, because a partial board that looks complete is worse than an error.
     */
    public static final int MAX_BOARD_CARDS = 200;

    /**
     * Card decoration for several applications at once, keyed by application id.
     *
     * <p><b>Replaces one HTTP request per card, twice over.</b> The board looped
     * {@code apiFetch('/api/offers/applications/' + id)} and the same for interviews, so a
     * hundred-candidate board issued two hundred requests on load. This is one.
     *
     * <p>It carries the legal moves as well, which the board had been computing in the browser by
     * walking its own stage array by index.
     *
     * @throws IllegalArgumentException if more than {@link #MAX_BOARD_CARDS} ids are requested
     */
    public Map<String, BoardCardResponse> getBoardCards(List<String> applicationIds) {
        if (applicationIds == null || applicationIds.isEmpty()) {
            return Map.of();
        }

        List<String> distinctIds = applicationIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        if (distinctIds.size() > MAX_BOARD_CARDS) {
            throw new IllegalArgumentException(
                    "Too many application ids: " + distinctIds.size() + ", maximum is " + MAX_BOARD_CARDS);
        }

        LocalDateTime now = LocalDateTime.now();
        Map<String, BoardCardResponse> cards = new LinkedHashMap<>();

        for (String applicationId : distinctIds) {
            List<PipelineStage> transitions;
            try {
                transitions = getAvailableTransitions(applicationId);
            } catch (IllegalArgumentException e) {
                // The application does not exist. Dropped rather than returned with an empty move
                // list, so the caller can tell "nowhere to go" from "no such application".
                continue;
            }

            cards.put(applicationId, BoardCardResponse.from(
                    transitions,
                    offerRepository.findByApplicationId(applicationId),
                    interviewRepository.findByApplicationId(applicationId),
                    now));
        }

        return cards;
    }

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

    /**
     * Moves to an earlier stage in the window.
     *
     * <p>Derived from the transitions rather than asked of {@code findRegressions}, which throws.
     * A candidate returned from Checks to Interviews is a different situation from one who arrived
     * there normally, and the board showed them identically.
     */
    public List<PipelineAnalyticsResponse.Regression> getRegressionAnalysis(LocalDateTime startDate,
                                                                            LocalDateTime endDate) {
        return getPipelineAnalytics(startDate, endDate).getRegressions();
    }


    private void enforceBackgroundCheckCompletion(Application application) {
        // Resolve rather than read the relation directly: on DynamoDB (the serverless/production
        // backend) toEntity() never hydrates jobPosting, so this method used to return early every
        // time and the gate never fired on any candidate. See ApplicationJobPostingResolver.
        JobPosting jobPosting = jobPostingResolver.resolve(application).orElse(null);
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
        
        // createdBy is a String on PipelineTransition — every id in this codebase is. This cast
        // was to Long, so the endpoint would have thrown ClassCastException the moment the
        // repository returned real data instead of UnsupportedOperationException.
        Map<String, Long> userActivity = new HashMap<>();
        for (Object[] row : userData) {
            String userId = (String) row[0];
            Long count = (Long) row[1];
            userActivity.put(userId, count);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("userActivity", userActivity);
        
        return stats;
    }
}