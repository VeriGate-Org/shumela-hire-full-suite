package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.repository.InterviewRepository;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
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

    @Autowired
    @Qualifier("shumelahireInterviewRepository")
    private InterviewRepository interviewRepository;

    @Autowired
    @Qualifier("shumelahireApplicationRepository")
    private ApplicationRepository applicationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

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
        if (!"INTERVIEWING".equals(application.getStatus())) {
            application.setStatus("INTERVIEWING");
            applicationRepository.save(application);
        }

        // Send notifications
        notificationService.notifyInterviewScheduled(application, formatInterviewDetails(savedInterview));
        
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
        interview.setStatus(Interview.STATUS_RESCHEDULED);
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

        interview.setStatus(Interview.STATUS_CANCELLED);
        interview.setNotes((interview.getNotes() != null ? interview.getNotes() + "\n" : "") + 
                          "Cancelled: " + (reason != null ? reason : "No reason provided"));

        interviewRepository.save(interview);

        // Send notifications
        notificationService.sendNotification(
            interview.getApplication().getApplicant().getEmail(),
            "Interview Cancelled",
            "Your interview scheduled for " + interview.getScheduledDate() + 
            " has been cancelled." + (reason != null ? " Reason: " + reason : "")
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

        interview.setStatus(Interview.STATUS_COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());
        interview.setFeedback(feedback);
        interview.setRating(rating);
        interview.setTechnicalScore(technicalScore);
        interview.setCommunicationScore(communicationScore);
        interview.setCulturalFitScore(culturalFitScore);
        interview.setRecommendation(recommendation != null ? recommendation : Interview.RECOMMENDATION_PENDING);

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
        return interviewRepository.findUpcomingInterviews(LocalDateTime.now());
    }

    /**
     * Get interviews for a specific date
     */
    public List<Interview> getInterviewsForDate(LocalDate date) {
        return interviewRepository.findInterviewsForDate(date.atStartOfDay());
    }

    /**
     * Get interviews for date range (calendar view)
     */
    public List<Interview> getInterviewsInDateRange(LocalDate startDate, LocalDate endDate) {
        return interviewRepository.findInterviewsInDateRange(
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );
    }

    /**
     * Get interviews by criteria
     */
    public List<Interview> searchInterviews(String interviewerEmail, String status, String interviewType,
                                          LocalDateTime fromDate, LocalDateTime toDate, String recommendation) {
        return interviewRepository.findByCriteria(
            interviewerEmail, status, interviewType, fromDate, toDate, recommendation
        );
    }

    /**
     * Get interview statistics
     */
    public Map<String, Object> getInterviewStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Total counts
        stats.put("totalInterviews", interviewRepository.count());
        
        // Status counts
        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = interviewRepository.findInterviewCountByStatus();
        for (Object[] row : statusData) {
            statusCounts.put((String) row[0], (Long) row[1]);
        }
        stats.put("statusCounts", statusCounts);
        
        // Type counts
        Map<String, Long> typeCounts = new HashMap<>();
        List<Object[]> typeData = interviewRepository.findInterviewCountByType();
        for (Object[] row : typeData) {
            typeCounts.put((String) row[0], (Long) row[1]);
        }
        stats.put("typeCounts", typeCounts);
        
        // Recommendation counts
        Map<String, Long> recommendationCounts = new HashMap<>();
        List<Object[]> recommendationData = interviewRepository.findInterviewCountByRecommendation();
        for (Object[] row : recommendationData) {
            recommendationCounts.put((String) row[0], (Long) row[1]);
        }
        stats.put("recommendationCounts", recommendationCounts);
        
        // Averages
        stats.put("averageRating", interviewRepository.findAverageRating());
        stats.put("averageTechnicalScore", interviewRepository.findAverageTechnicalScore());
        stats.put("averageCommunicationScore", interviewRepository.findAverageCommunicationScore());
        stats.put("averageCulturalFitScore", interviewRepository.findAverageCulturalFitScore());
        
        // Recent activity
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        stats.put("interviewsThisWeek", interviewRepository.countByScheduledDateBetween(oneWeekAgo, LocalDateTime.now()));
        
        // Upcoming interviews
        stats.put("upcomingInterviews", interviewRepository.findUpcomingInterviews(LocalDateTime.now()).size());
        
        // Interviews needing feedback
        stats.put("interviewsNeedingFeedback", interviewRepository.findCompletedInterviewsWithoutFeedback().size());
        
        return stats;
    }

    /**
     * Get interviewer performance metrics
     */
    public List<Map<String, Object>> getInterviewerPerformance() {
        List<Object[]> performanceData = interviewRepository.findInterviewerPerformance();
        
        return performanceData.stream()
            .map(row -> {
                Map<String, Object> performance = new HashMap<>();
                performance.put("interviewerEmail", row[0]);
                performance.put("totalInterviews", row[1]);
                performance.put("averageRating", row[2]);
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
            // Send reminder to applicant
            notificationService.sendNotification(
                interview.getApplication().getApplicant().getEmail(),
                "Interview Reminder",
                "This is a reminder that you have an interview scheduled for " +
                interview.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")) +
                " with " + interview.getInterviewerName() + "."
            );
            
            // Send reminder to interviewer
            notificationService.sendNotification(
                interview.getInterviewerEmail(),
                "Interview Reminder",
                "This is a reminder that you have an interview scheduled for " +
                interview.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")) +
                " with " + interview.getApplication().getApplicant().getFullName() + "."
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
        dashboard.put("needingFeedback", interviewRepository.findCompletedInterviewsWithoutFeedback());
        
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
