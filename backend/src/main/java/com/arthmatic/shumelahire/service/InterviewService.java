package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.InterviewDataRepository;
import com.arthmatic.shumelahire.repository.InterviewFeedbackDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class InterviewService {

    @Autowired
    private InterviewDataRepository interviewRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private InterviewFeedbackDataRepository interviewFeedbackRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Core CRUD operations
    public Interview createInterview(Interview interview, String createdBy) {
        // Validate application exists and is in valid state
        Application application = applicationRepository.findById(interview.getApplication().getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (!canScheduleInterviewForApplication(application)) {
            throw new IllegalStateException("Cannot schedule interview for application in current status: " + application.getStatus());
        }

        // Set defaults
        interview.setCreatedBy(createdBy);
        interview.setCreatedAt(LocalDateTime.now());
        
        if (interview.getTitle() == null || interview.getTitle().trim().isEmpty()) {
            interview.setTitle(generateDefaultTitle(interview));
        }

        // Validate scheduling constraints
        validateInterviewScheduling(interview);

        Interview savedInterview = interviewRepository.save(interview);
        
        auditLogService.logUserAction(
            createdBy,
            "INTERVIEW_CREATED",
            "Interview",
            String.format("Interview '%s' scheduled for %s", 
                savedInterview.getTitle(), 
                savedInterview.getScheduledAt())
        );

        return savedInterview;
    }

    public Interview updateInterview(String id, Interview updatedInterview, String updatedBy) {
        Interview existingInterview = getInterviewById(id);
        
        // Store original values for audit
        String originalSchedule = existingInterview.getScheduledAt().toString();
        
        // Update fields
        existingInterview.setTitle(updatedInterview.getTitle());
        existingInterview.setType(updatedInterview.getType());
        existingInterview.setRound(updatedInterview.getRound());
        existingInterview.setScheduledAt(updatedInterview.getScheduledAt());
        existingInterview.setDurationMinutes(updatedInterview.getDurationMinutes());
        existingInterview.setLocation(updatedInterview.getLocation());
        existingInterview.setMeetingLink(updatedInterview.getMeetingLink());
        existingInterview.setPhoneNumber(updatedInterview.getPhoneNumber());
        existingInterview.setMeetingRoom(updatedInterview.getMeetingRoom());
        existingInterview.setInstructions(updatedInterview.getInstructions());
        existingInterview.setAgenda(updatedInterview.getAgenda());
        existingInterview.setInterviewerId(updatedInterview.getInterviewerId());
        existingInterview.setAdditionalInterviewers(updatedInterview.getAdditionalInterviewers());
        existingInterview.setUpdatedAt(LocalDateTime.now());

        // Validate if schedule changed
        if (!originalSchedule.equals(updatedInterview.getScheduledAt().toString())) {
            validateInterviewScheduling(existingInterview);
        }

        Interview savedInterview = interviewRepository.save(existingInterview);
        
        auditLogService.logUserAction(
            updatedBy,
            "INTERVIEW_UPDATED",
            "Interview",
            String.format("Interview '%s' updated", savedInterview.getTitle())
        );

        return savedInterview;
    }

    public Interview getInterviewById(String id) {
        return interviewRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found with id: " + id));
    }

    public void deleteInterview(String id, String deletedBy) {
        Interview interview = getInterviewById(id);
        
        if (!interview.canBeCancelled()) {
            throw new IllegalStateException("Interview cannot be deleted in current status: " + interview.getStatus());
        }
        
        auditLogService.logUserAction(
            deletedBy,
            "INTERVIEW_DELETED",
            "Interview",
            String.format("Interview '%s' deleted", interview.getTitle())
        );
        
        interviewRepository.deleteById(id);
    }

    // Scheduling operations
    public Interview scheduleInterview(String applicationId, LocalDateTime scheduledAt,
                                     String interviewerId, InterviewType type,
                                     InterviewRound round, String scheduledBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        Interview interview = new Interview(application, scheduledAt, interviewerId, type);
        interview.setRound(round);
        
        return createInterview(interview, scheduledBy);
    }

    public Interview rescheduleInterview(String id, LocalDateTime newScheduledAt, 
                                       String reason, String rescheduledBy) {
        Interview interview = getInterviewById(id);
        
        if (!interview.canBeRescheduled()) {
            throw new IllegalStateException("Interview cannot be rescheduled in current status: " + interview.getStatus());
        }

        // Store original schedule
        LocalDateTime originalSchedule = interview.getScheduledAt();
        
        // Update schedule
        interview.setRescheduledFrom(originalSchedule);
        interview.setScheduledAt(newScheduledAt);
        interview.setRescheduleReason(reason);
        interview.setRescheduleCount(interview.getRescheduleCount() + 1);
        interview.setStatus(InterviewStatus.RESCHEDULED);
        interview.setUpdatedAt(LocalDateTime.now());

        // Validate new schedule
        validateInterviewScheduling(interview);

        Interview savedInterview = interviewRepository.save(interview);
        
        auditLogService.logUserAction(
            rescheduledBy,
            "INTERVIEW_RESCHEDULED",
            "Interview",
            String.format("Interview rescheduled from %s to %s. Reason: %s",
                originalSchedule, newScheduledAt, reason)
        );

        notificationService.notifyInterviewRescheduled(savedInterview);

        return savedInterview;
    }

    public Interview cancelInterview(String id, String reason, String cancelledBy) {
        Interview interview = getInterviewById(id);
        
        if (!interview.canBeCancelled()) {
            throw new IllegalStateException("Interview cannot be cancelled in current status: " + interview.getStatus());
        }

        interview.setStatus(InterviewStatus.CANCELLED);
        interview.setCancelledAt(LocalDateTime.now());
        interview.setCancellationReason(reason);
        interview.setUpdatedAt(LocalDateTime.now());

        Interview savedInterview = interviewRepository.save(interview);
        
        auditLogService.logUserAction(
            cancelledBy,
            "INTERVIEW_CANCELLED",
            "Interview",
            String.format("Interview cancelled. Reason: %s", reason)
        );

        notificationService.notifyInterviewCancelled(savedInterview);

        return savedInterview;
    }

    public Interview postponeInterview(String id, String reason, String postponedBy) {
        Interview interview = getInterviewById(id);

        if (!interview.getStatus().canBePostponed()) {
            throw new IllegalStateException("Interview cannot be postponed in current status: " + interview.getStatus());
        }

        interview.setStatus(InterviewStatus.POSTPONED);
        interview.setUpdatedAt(LocalDateTime.now());

        Interview savedInterview = interviewRepository.save(interview);

        auditLogService.logUserAction(
            postponedBy,
            "INTERVIEW_POSTPONED",
            "Interview",
            String.format("Interview postponed. Reason: %s", reason)
        );

        return savedInterview;
    }

    public Interview startInterview(String id, String startedBy) {
        Interview interview = getInterviewById(id);
        
        if (!interview.canBeStarted()) {
            throw new IllegalStateException("Interview cannot be started at this time");
        }

        interview.setStatus(InterviewStatus.IN_PROGRESS);
        interview.setStartedAt(LocalDateTime.now());
        interview.setUpdatedAt(LocalDateTime.now());

        Interview savedInterview = interviewRepository.save(interview);
        
        auditLogService.logUserAction(
            startedBy,
            "INTERVIEW_STARTED",
            "Interview",
            "Interview started"
        );

        return savedInterview;
    }

    public Interview completeInterview(String id, String completedBy) {
        Interview interview = getInterviewById(id);
        
        if (!interview.canBeCompleted()) {
            throw new IllegalStateException("Interview cannot be completed in current status: " + interview.getStatus());
        }

        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());
        interview.setUpdatedAt(LocalDateTime.now());

        Interview savedInterview = interviewRepository.save(interview);
        
        auditLogService.logUserAction(
            completedBy,
            "INTERVIEW_COMPLETED",
            "Interview",
            "Interview completed"
        );

        notificationService.notifyInterviewCompleted(savedInterview);

        return savedInterview;
    }

    // Feedback operations
    public InterviewFeedback submitFeedback(String interviewId, String feedback, Integer rating,
                                           Integer communicationSkills, Integer technicalSkills,
                                           Integer culturalFit, String overallImpression,
                                           InterviewRecommendation recommendation, String nextSteps,
                                           String technicalAssessment, String candidateQuestions,
                                           String interviewerNotes, String submittedBy,
                                           String interviewerName) {
        Interview interview = getInterviewById(interviewId);

        if (interview.getStatus() != InterviewStatus.COMPLETED) {
            throw new IllegalStateException("Feedback can only be submitted for completed interviews");
        }

        // Check if this user already submitted feedback — update if so
        InterviewFeedback feedbackEntity = interviewFeedbackRepository
            .findByInterviewIdAndSubmittedBy(interviewId, String.valueOf(submittedBy))
            .orElse(new InterviewFeedback());

        boolean isUpdate = feedbackEntity.getId() != null;

        feedbackEntity.setInterview(interview);
        feedbackEntity.setSubmittedBy(submittedBy);
        feedbackEntity.setInterviewerName(interviewerName);
        feedbackEntity.setFeedback(feedback);
        feedbackEntity.setRating(rating);
        feedbackEntity.setCommunicationSkills(communicationSkills);
        feedbackEntity.setTechnicalSkills(technicalSkills);
        feedbackEntity.setCulturalFit(culturalFit);
        feedbackEntity.setOverallImpression(overallImpression);
        feedbackEntity.setRecommendation(recommendation);
        feedbackEntity.setNextSteps(nextSteps);
        feedbackEntity.setTechnicalAssessment(technicalAssessment);
        feedbackEntity.setCandidateQuestions(candidateQuestions);
        feedbackEntity.setInterviewerNotes(interviewerNotes);

        InterviewFeedback saved = interviewFeedbackRepository.save(feedbackEntity);

        // Also update the legacy feedback field on Interview for backwards compatibility
        interview.setFeedback(feedback);
        interview.setRating(rating);
        interview.setRecommendation(recommendation);
        interview.setFeedbackSubmittedAt(LocalDateTime.now());
        interview.setUpdatedAt(LocalDateTime.now());
        interviewRepository.save(interview);

        auditLogService.logUserAction(
            submittedBy,
            isUpdate ? "INTERVIEW_FEEDBACK_UPDATED" : "INTERVIEW_FEEDBACK_SUBMITTED",
            "InterviewFeedback",
            String.format("Interview feedback %s with recommendation: %s",
                isUpdate ? "updated" : "submitted", recommendation.getDisplayName())
        );

        return saved;
    }

    public List<InterviewFeedback> getFeedbacksForInterview(String interviewId) {
        return interviewFeedbackRepository.findByInterviewIdOrderBySubmittedAtDesc(interviewId);
    }

    public Optional<InterviewFeedback> getFeedbackByInterviewAndUser(String interviewId, String userId) {
        return interviewFeedbackRepository.findByInterviewIdAndSubmittedBy(interviewId, userId);
    }

    public void deleteFeedback(String feedbackId, String deletedBy) {
        InterviewFeedback feedback = interviewFeedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new IllegalArgumentException("Feedback not found: " + feedbackId));

        if (!feedback.getSubmittedBy().equals(deletedBy)) {
            throw new IllegalStateException("Only the feedback author can delete their feedback");
        }

        interviewFeedbackRepository.deleteById(feedback.getId());

        auditLogService.logUserAction(
            deletedBy,
            "INTERVIEW_FEEDBACK_DELETED",
            "InterviewFeedback",
            String.format("Deleted feedback %d for interview %d", feedbackId, feedback.getInterview().getId())
        );
    }

    // Search and retrieval
    public Page<Interview> searchInterviews(String searchTerm, InterviewStatus status, 
                                          InterviewType type, InterviewRound round,
                                          Long interviewerId, LocalDateTime startDate, 
                                          LocalDateTime endDate, Pageable pageable) {
        return interviewRepository.searchInterviews(searchTerm, status, type, round, 
                                                   interviewerId, startDate, endDate, pageable);
    }

    public List<Interview> getInterviewsByApplication(String applicationId) {
        return interviewRepository.findByApplicationIdOrderByScheduledAtDesc(applicationId);
    }

    public List<Interview> getInterviewerSchedule(String interviewerId, LocalDateTime startDate, LocalDateTime endDate) {
        return interviewRepository.findInterviewerSchedule(interviewerId, startDate, endDate);
    }

    public List<Interview> getUpcomingInterviews(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime futureTime = now.plusDays(days);
        return interviewRepository.findUpcomingInterviews(now, futureTime);
    }

    public List<Interview> getOverdueInterviews() {
        return interviewRepository.findOverdueInterviews(LocalDateTime.now());
    }

    // Availability and conflict checking (uses JPQL + Java filtering for DB portability)
    public boolean isInterviewerAvailable(String interviewerId, LocalDateTime startTime, int durationMinutes) {
        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        List<Interview> potentialConflicts = interviewRepository.findPotentialInterviewerConflicts(interviewerId, endTime);
        return potentialConflicts.stream()
                .noneMatch(i -> i.hasConflictWith(startTime, endTime));
    }

    public boolean isMeetingRoomAvailable(String meetingRoom, LocalDateTime startTime, int durationMinutes) {
        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        List<Interview> potentialConflicts = interviewRepository.findPotentialMeetingRoomConflicts(meetingRoom, endTime);
        return potentialConflicts.stream()
                .noneMatch(i -> i.hasConflictWith(startTime, endTime));
    }

    public List<LocalDateTime> getSuggestedTimeSlots(String interviewerId, LocalDateTime preferredDate, 
                                                   int durationMinutes, int numberOfSuggestions) {
        List<LocalDateTime> suggestions = new ArrayList<>();
        LocalDateTime currentSlot = getNextBusinessHour(preferredDate);
        
        int suggestionCount = 0;
        int maxAttempts = 100; // Prevent infinite loop
        int attempts = 0;
        
        while (suggestionCount < numberOfSuggestions && attempts < maxAttempts) {
            if (isBusinessHour(currentSlot) && 
                isInterviewerAvailable(interviewerId, currentSlot, durationMinutes)) {
                suggestions.add(currentSlot);
                suggestionCount++;
            }
            
            currentSlot = currentSlot.plusMinutes(30); // 30-minute intervals
            attempts++;
        }
        
        return suggestions;
    }

    // Analytics and reporting
    public Map<String, Object> getInterviewAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();
        
        // Status statistics
        List<Object[]> statusStats = interviewRepository.getInterviewStatusStatistics(startDate, endDate);
        Map<String, Long> statusCounts = statusStats.stream()
                .collect(Collectors.toMap(
                    row -> row[0].toString(),
                    row -> (Long) row[1]
                ));
        analytics.put("statusStatistics", statusCounts);
        
        // Round statistics
        List<Object[]> roundStats = interviewRepository.getInterviewRoundStatistics(startDate, endDate);
        Map<String, Long> roundCounts = roundStats.stream()
                .collect(Collectors.toMap(
                    row -> row[0].toString(),
                    row -> (Long) row[1]
                ));
        analytics.put("roundStatistics", roundCounts);
        
        // Average rating
        Optional<Double> avgRating = interviewRepository.getAverageInterviewRating(startDate, endDate);
        analytics.put("averageRating", avgRating.orElse(0.0));
        
        // Other metrics
        analytics.put("totalInterviews", interviewRepository.count());
        analytics.put("upcomingInterviews", getUpcomingInterviews(7).size());
        analytics.put("overdueInterviews", getOverdueInterviews().size());
        analytics.put("awaitingFeedback", interviewRepository.findInterviewsRequiringFeedback().size());
        
        return analytics;
    }

    // Utility methods
    private void validateInterviewScheduling(Interview interview) {
        // Check if interviewer is available
        if (!isInterviewerAvailable(interview.getInterviewerId(), 
                                   interview.getScheduledAt(), 
                                   interview.getDurationMinutes())) {
            throw new IllegalStateException("Interviewer is not available at the scheduled time");
        }
        
        // Check meeting room availability if specified
        if (interview.getMeetingRoom() != null && !interview.getMeetingRoom().trim().isEmpty()) {
            if (!isMeetingRoomAvailable(interview.getMeetingRoom(), 
                                      interview.getScheduledAt(), 
                                      interview.getDurationMinutes())) {
                throw new IllegalStateException("Meeting room is not available at the scheduled time");
            }
        }
        
        // Validate business hours
        if (!isBusinessHour(interview.getScheduledAt())) {
            throw new IllegalArgumentException("Interview must be scheduled during business hours");
        }
        
        // Validate minimum advance notice (2 hours)
        if (interview.getScheduledAt().isBefore(LocalDateTime.now().plusHours(2))) {
            throw new IllegalArgumentException("Interview must be scheduled at least 2 hours in advance");
        }
    }

    private boolean canScheduleInterviewForApplication(Application application) {
        return application.getStatus() != ApplicationStatus.WITHDRAWN &&
               application.getStatus() != ApplicationStatus.REJECTED &&
               application.getStatus() != ApplicationStatus.OFFER_DECLINED &&
               application.getStatus() != ApplicationStatus.HIRED;
    }

    private String generateDefaultTitle(Interview interview) {
        if (interview.getApplication() != null && 
            interview.getApplication().getJobPosting() != null) {
            return interview.getRound().getDisplayName() + " - " + 
                   interview.getApplication().getJobPosting().getTitle();
        }
        return interview.getRound().getDisplayName() + " Interview";
    }

    private boolean isBusinessHour(LocalDateTime dateTime) {
        DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        int hour = dateTime.getHour();
        
        // Monday to Friday, 8 AM to 6 PM
        return dayOfWeek != DayOfWeek.SATURDAY && 
               dayOfWeek != DayOfWeek.SUNDAY && 
               hour >= 8 && hour < 18;
    }

    private LocalDateTime getNextBusinessHour(LocalDateTime dateTime) {
        LocalDateTime next = dateTime;
        
        while (!isBusinessHour(next)) {
            if (next.getHour() < 8) {
                next = next.withHour(8).withMinute(0).withSecond(0);
            } else if (next.getHour() >= 18) {
                next = next.plusDays(1).withHour(8).withMinute(0).withSecond(0);
            } else if (next.getDayOfWeek() == DayOfWeek.SATURDAY) {
                next = next.plusDays(2).withHour(8).withMinute(0).withSecond(0);
            } else if (next.getDayOfWeek() == DayOfWeek.SUNDAY) {
                next = next.plusDays(1).withHour(8).withMinute(0).withSecond(0);
            }
        }
        
        return next;
    }

    // Additional interviewer management
    public List<Long> getAdditionalInterviewers(Interview interview) {
        if (interview.getAdditionalInterviewers() == null || 
            interview.getAdditionalInterviewers().trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            return objectMapper.readValue(interview.getAdditionalInterviewers(), 
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    public void setAdditionalInterviewers(Interview interview, List<Long> interviewerIds) {
        try {
            interview.setAdditionalInterviewers(objectMapper.writeValueAsString(interviewerIds));
        } catch (JsonProcessingException e) {
            interview.setAdditionalInterviewers("[]");
        }
    }

    // Reminder and notification methods
    public List<Interview> getInterviewsNeedingReminders(int hoursAhead) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderTime = now.plusHours(hoursAhead);
        return interviewRepository.findInterviewsNeedingReminders(now, reminderTime);
    }

    public void markReminderSent(String interviewId) {
        Interview interview = getInterviewById(interviewId);
        interview.setReminderSentAt(LocalDateTime.now());
        interviewRepository.save(interview);
    }

    public List<Interview> getInterviewsRequiringFeedback() {
        return interviewRepository.findInterviewsRequiringFeedback();
    }

    public void requestFeedback(String interviewId) {
        Interview interview = getInterviewById(interviewId);
        interview.setFeedbackRequestedAt(LocalDateTime.now());
        interviewRepository.save(interview);
        notificationService.notifyInterviewFeedbackRequested(interview);
    }
}