package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.InterviewType;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.InterviewRecommendation;
import com.arthmatic.shumelahire.repository.InterviewRepository;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.service.integration.OutlookCalendarService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class InterviewSchedulingService {

    private static final Logger logger = LoggerFactory.getLogger(InterviewSchedulingService.class);

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private OutlookCalendarService outlookCalendarService;

    /**
     * Schedule a new interview
     */
    public Interview scheduleInterview(Interview interview) {
        // Validate application exists
        if (interview.getApplication() == null || interview.getApplication().getId() == null) {
            throw new IllegalArgumentException("Application is required for interview scheduling");
        }

        Application application = applicationRepository.findById(interview.getApplication().getId())
            .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        interview.setApplication(application);
        
        // Validate required fields
        if (interview.getScheduledDate() == null) {
            throw new IllegalArgumentException("Scheduled date is required");
        }
        
        if (interview.getScheduledDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot schedule interview in the past");
        }

        if (interview.getInterviewerName() == null || interview.getInterviewerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Interviewer name is required");
        }

        if (interview.getInterviewerEmail() == null || interview.getInterviewerEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Interviewer email is required");
        }

        // Set defaults
        if (interview.getDurationMinutes() == null) {
            interview.setDurationMinutes(60);
        }

        Interview savedInterview = interviewRepository.save(interview);

        // Update application status if needed
        if (application.getStatus() != ApplicationStatus.INTERVIEW_SCHEDULED) {
            application.setStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
            applicationRepository.save(application);
        }

        // Send notifications
        notificationService.notifyInterviewScheduled(application, formatInterviewDetails(savedInterview));

        // Create Outlook calendar event (non-fatal on failure)
        if (outlookCalendarService != null) {
            try {
                outlookCalendarService.createInterviewEvent(
                    "Interview: " + application.getApplicant().getFullName() + " - " + application.getJobTitle(),
                    formatInterviewDetails(savedInterview),
                    savedInterview.getScheduledDate(),
                    savedInterview.getDurationMinutes(),
                    savedInterview.getLocation(),
                    savedInterview.getInterviewerEmail(),
                    application.getApplicant().getEmail()
                );
            } catch (Exception e) {
                logger.warn("Failed to create Outlook calendar event: {}", e.getMessage());
            }
        }

        // Log audit
        auditLogService.saveLog(
            "system",
            "INTERVIEW_SCHEDULED",
            "INTERVIEW",
            savedInterview.getId().toString(),
            "Interview scheduled for " + application.getApplicant().getFullName() + 
            " on " + savedInterview.getScheduledDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );

        return savedInterview;
    }

    /**
     * Reschedule an existing interview
     */
    public Interview rescheduleInterview(Long interviewId, LocalDateTime newDate, String reason) {
        Interview interview = interviewRepository.findById(interviewId)
            .orElseThrow(() -> new IllegalArgumentException("Interview not found"));

        if (newDate.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot reschedule interview to the past");
        }

        LocalDateTime oldDate = interview.getScheduledDate();
        interview.setScheduledDate(newDate);
        interview.setStatus(InterviewStatus.RESCHEDULED);
        interview.setReminderSent(false);
        interview.setConfirmationReceived(false);

        Interview savedInterview = interviewRepository.save(interview);

        // Send notifications
        notificationService.notifyInterviewScheduled(
            interview.getApplication(), 
            "Interview rescheduled from " + oldDate + " to " + newDate + 
            (reason != null ? ". Reason: " + reason : "")
        );

        // Log audit
        auditLogService.saveLog(
            "system",
            "INTERVIEW_RESCHEDULED",
            "INTERVIEW",
            savedInterview.getId().toString(),
            "Interview rescheduled from " + oldDate + " to " + newDate + 
            (reason != null ? ". Reason: " + reason : "")
        );

        return savedInterview;
    }

    /**
     * Cancel an interview
     */
    public void cancelInterview(Long interviewId, String reason) {
        Interview interview = interviewRepository.findById(interviewId)
            .orElseThrow(() -> new IllegalArgumentException("Interview not found"));

        interview.setStatus(InterviewStatus.CANCELLED);
        interview.setNotes((interview.getNotes() != null ? interview.getNotes() + "\n" : "") + 
                          "Cancelled: " + (reason != null ? reason : "No reason provided"));

        interviewRepository.save(interview);

        // Send notifications
        notificationService.notifyInterviewScheduled(
            interview.getApplication(),
            "Interview cancelled for " + interview.getScheduledDate() +
            "." + (reason != null ? " Reason: " + reason : "")
        );

        // Log audit
        auditLogService.saveLog(
            "system",
            "INTERVIEW_CANCELLED",
            "INTERVIEW",
            interview.getId().toString(),
            "Interview cancelled" + (reason != null ? ". Reason: " + reason : "")
        );
    }

    /**
     * Complete an interview with feedback
     */
    public Interview completeInterview(Long interviewId, String feedback, Integer rating,
                                     Integer technicalScore, Integer communicationScore, 
                                     Integer culturalFitScore, String recommendation) {
        Interview interview = interviewRepository.findById(interviewId)
            .orElseThrow(() -> new IllegalArgumentException("Interview not found"));

        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());
        interview.setFeedback(feedback);
        interview.setRating(rating);
        interview.setTechnicalScore(technicalScore);
        interview.setCommunicationScore(communicationScore);
        interview.setCulturalFitScore(culturalFitScore);
        if (recommendation != null) {
            interview.setRecommendation(recommendation);
        }

        Interview savedInterview = interviewRepository.save(interview);

        // Update application with interview feedback
        Application application = interview.getApplication();
        String existingFeedback = application.getInterviewFeedback();
        String newFeedback = "Interview " + interview.getInterviewType() + " on " + 
                           interview.getScheduledDate().format(DateTimeFormatter.ISO_LOCAL_DATE) + 
                           ": " + feedback;
        
        application.setInterviewFeedback(
            existingFeedback != null ? existingFeedback + "\n\n" + newFeedback : newFeedback
        );
        
        // Update application rating if this interview has a rating
        if (rating != null && (application.getRating() == null || rating > application.getRating())) {
            application.setRating(rating);
        }

        applicationRepository.save(application);

        // Log audit
        auditLogService.saveLog(
            "system",
            "INTERVIEW_COMPLETED",
            "INTERVIEW",
            savedInterview.getId().toString(),
            "Interview completed with rating: " + rating + ", recommendation: " + recommendation
        );

        return savedInterview;
    }

    /**
     * Get upcoming interviews
     */
    public List<Interview> getUpcomingInterviews() {
        return interviewRepository.findUpcomingInterviews(LocalDateTime.now(), LocalDateTime.now().plusDays(7));
    }

    /**
     * Get interviews for a specific date
     */
    public List<Interview> getInterviewsForDate(LocalDate date) {
        return interviewRepository.findByDate(date.atStartOfDay());
    }

    /**
     * Get interviews for date range (calendar view)
     */
    public List<Interview> getInterviewsInDateRange(LocalDate startDate, LocalDate endDate) {
        return interviewRepository.findByScheduledAtBetween(
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );
    }

    /**
     * Get interviews by criteria
     */
    public List<Interview> searchInterviews(String interviewerEmail, String status, String interviewType,
                                          LocalDateTime fromDate, LocalDateTime toDate, String recommendation) {
        List<Interview> interviews = interviewRepository.findByScheduledAtBetween(
            fromDate != null ? fromDate : LocalDateTime.now().minusYears(1),
            toDate != null ? toDate : LocalDateTime.now().plusYears(1)
        );
        return interviews.stream()
            .filter(i -> interviewerEmail == null || interviewerEmail.equals(i.getInterviewerEmail()))
            .filter(i -> status == null || status.equals(i.getStatus().name()))
            .filter(i -> interviewType == null || interviewType.equals(i.getInterviewType()))
            .filter(i -> recommendation == null || (i.getRecommendation() != null && recommendation.equals(i.getRecommendation().name())))
            .collect(Collectors.toList());
    }

    /**
     * Get interview statistics
     */
    public Map<String, Object> getInterviewStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Total counts
        stats.put("totalInterviews", interviewRepository.count());

        // Status counts using existing getInterviewStatusStatistics with wide date range
        LocalDateTime yearAgo = LocalDateTime.now().minusYears(1);
        LocalDateTime yearFromNow = LocalDateTime.now().plusYears(1);

        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = interviewRepository.getInterviewStatusStatistics(yearAgo, yearFromNow);
        for (Object[] row : statusData) {
            statusCounts.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("statusCounts", statusCounts);

        // Type counts using existing getInterviewRoundStatistics as proxy
        Map<String, Long> roundCounts = new HashMap<>();
        List<Object[]> roundData = interviewRepository.getInterviewRoundStatistics(yearAgo, yearFromNow);
        for (Object[] row : roundData) {
            roundCounts.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("typeCounts", roundCounts);

        // Averages using existing getAverageInterviewRating
        stats.put("averageRating", interviewRepository.getAverageInterviewRating(yearAgo, yearFromNow).orElse(0.0));

        // Recent activity
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        stats.put("interviewsThisWeek", interviewRepository.countByScheduledAtBetween(oneWeekAgo, LocalDateTime.now()));

        // Upcoming interviews
        stats.put("upcomingInterviews", interviewRepository.findUpcomingInterviews(LocalDateTime.now(), LocalDateTime.now().plusDays(7)).size());

        // Interviews needing feedback
        stats.put("interviewsNeedingFeedback", interviewRepository.findInterviewsRequiringFeedback().size());

        return stats;
    }

    /**
     * Get interviewer performance metrics
     */
    public List<Map<String, Object>> getInterviewerPerformance() {
        // Calculate interviewer performance from all interviews
        List<Interview> allInterviews = interviewRepository.findAll();
        Map<String, List<Interview>> byInterviewer = allInterviews.stream()
            .filter(i -> i.getInterviewerEmail() != null)
            .collect(Collectors.groupingBy(Interview::getInterviewerEmail));

        return byInterviewer.entrySet().stream()
            .map(entry -> {
                Map<String, Object> performance = new HashMap<>();
                performance.put("interviewerEmail", entry.getKey());
                performance.put("totalInterviews", (long) entry.getValue().size());
                double avgRating = entry.getValue().stream()
                    .filter(i -> i.getRating() != null)
                    .mapToInt(Interview::getRating)
                    .average()
                    .orElse(0.0);
                performance.put("averageRating", Math.round(avgRating * 100.0) / 100.0);
                return performance;
            })
            .collect(Collectors.toList());
    }

    /**
     * Send interview reminders
     */
    public void sendInterviewReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderTime = now.plusHours(24); // 24 hours ahead
        
        List<Interview> interviewsNeedingReminders = interviewRepository
            .findInterviewsNeedingReminders(now, reminderTime);
        
        for (Interview interview : interviewsNeedingReminders) {
            // Send reminder to applicant via the interview notification method
            notificationService.notifyInterviewScheduled(
                interview.getApplication(),
                "Reminder: You have an interview scheduled for " +
                interview.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")) +
                " with " + interview.getInterviewerName() + "."
            );

            // Mark reminder as sent
            interview.setReminderSent(true);
            interviewRepository.save(interview);
        }
    }

    /**
     * Get dashboard data for interviews
     */
    public Map<String, Object> getInterviewDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Today's interviews
        dashboard.put("todayInterviews", getInterviewsForDate(LocalDate.now()));
        
        // This week's interviews
        LocalDate startOfWeek = LocalDate.now().minusDays(LocalDate.now().getDayOfWeek().getValue() - 1);
        LocalDate endOfWeek = startOfWeek.plusDays(6);
        dashboard.put("weekInterviews", getInterviewsInDateRange(startOfWeek, endOfWeek));
        
        // Upcoming interviews
        dashboard.put("upcomingInterviews", getUpcomingInterviews().stream().limit(10).collect(Collectors.toList()));
        
        // Interviews needing feedback
        dashboard.put("needingFeedback", interviewRepository.findInterviewsRequiringFeedback());
        
        // Basic statistics
        dashboard.put("statistics", getInterviewStatistics());
        
        return dashboard;
    }

    /**
     * Format interview details for notifications
     */
    private String formatInterviewDetails(Interview interview) {
        StringBuilder details = new StringBuilder();
        details.append("Date: ").append(interview.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")));
        details.append("\nType: ").append(interview.getInterviewType());
        details.append("\nDuration: ").append(interview.getDurationMinutes()).append(" minutes");
        details.append("\nInterviewer: ").append(interview.getInterviewerName());
        
        if (interview.getLocation() != null) {
            details.append("\nLocation: ").append(interview.getLocation());
        }
        
        if (interview.getMeetingUrl() != null) {
            details.append("\nMeeting URL: ").append(interview.getMeetingUrl());
        }
        
        if (interview.getPreparationNotes() != null) {
            details.append("\nPreparation Notes: ").append(interview.getPreparationNotes());
        }
        
        return details.toString();
    }
}
