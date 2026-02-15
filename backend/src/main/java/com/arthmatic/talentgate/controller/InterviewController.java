package com.arthmatic.talentgate.controller;

import com.arthmatic.talentgate.entity.Interview;
import com.arthmatic.talentgate.service.InterviewSchedulingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER')")
public class InterviewController {

    @Autowired
    private InterviewSchedulingService interviewSchedulingService;

    /**
     * Schedule a new interview
     */
    @PostMapping("/schedule")
    public ResponseEntity<?> scheduleInterview(@RequestBody Interview interview) {
        try {
            Interview scheduledInterview = interviewSchedulingService.scheduleInterview(interview);
            return ResponseEntity.ok(scheduledInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to schedule interview: " + e.getMessage()));
        }
    }

    /**
     * Reschedule an existing interview
     */
    @PutMapping("/{interviewId}/reschedule")
    public ResponseEntity<?> rescheduleInterview(
            @PathVariable Long interviewId,
            @RequestBody Map<String, Object> request) {
        try {
            String newDateStr = (String) request.get("newDate");
            String reason = (String) request.get("reason");
            
            if (newDateStr == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "New date is required"));
            }
            
            LocalDateTime newDate = LocalDateTime.parse(newDateStr);
            Interview rescheduledInterview = interviewSchedulingService.rescheduleInterview(interviewId, newDate, reason);
            
            return ResponseEntity.ok(rescheduledInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to reschedule interview: " + e.getMessage()));
        }
    }

    /**
     * Cancel an interview
     */
    @PutMapping("/{interviewId}/cancel")
    public ResponseEntity<?> cancelInterview(
            @PathVariable Long interviewId,
            @RequestBody Map<String, Object> request) {
        try {
            String reason = (String) request.get("reason");
            interviewSchedulingService.cancelInterview(interviewId, reason);
            
            return ResponseEntity.ok(Map.of("message", "Interview cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to cancel interview: " + e.getMessage()));
        }
    }

    /**
     * Complete an interview with feedback
     */
    @PutMapping("/{interviewId}/complete")
    public ResponseEntity<?> completeInterview(
            @PathVariable Long interviewId,
            @RequestBody Map<String, Object> request) {
        try {
            String feedback = (String) request.get("feedback");
            Integer rating = (Integer) request.get("rating");
            Integer technicalScore = (Integer) request.get("technicalScore");
            Integer communicationScore = (Integer) request.get("communicationScore");
            Integer culturalFitScore = (Integer) request.get("culturalFitScore");
            String recommendation = (String) request.get("recommendation");
            
            Interview completedInterview = interviewSchedulingService.completeInterview(
                interviewId, feedback, rating, technicalScore, communicationScore, 
                culturalFitScore, recommendation
            );
            
            return ResponseEntity.ok(completedInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to complete interview: " + e.getMessage()));
        }
    }

    /**
     * Get upcoming interviews
     */
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingInterviews() {
        try {
            List<Interview> interviews = interviewSchedulingService.getUpcomingInterviews();
            return ResponseEntity.ok(Map.of(
                "interviews", interviews,
                "count", interviews.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get upcoming interviews: " + e.getMessage()));
        }
    }

    /**
     * Get interviews for a specific date
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<?> getInterviewsForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<Interview> interviews = interviewSchedulingService.getInterviewsForDate(date);
            return ResponseEntity.ok(Map.of(
                "date", date,
                "interviews", interviews,
                "count", interviews.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get interviews for date: " + e.getMessage()));
        }
    }

    /**
     * Get interviews for date range (calendar view)
     */
    @GetMapping("/calendar")
    public ResponseEntity<?> getInterviewsInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<Interview> interviews = interviewSchedulingService.getInterviewsInDateRange(startDate, endDate);
            return ResponseEntity.ok(Map.of(
                "startDate", startDate,
                "endDate", endDate,
                "interviews", interviews,
                "count", interviews.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get calendar interviews: " + e.getMessage()));
        }
    }

    /**
     * Search interviews with criteria
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchInterviews(
            @RequestParam(required = false) String interviewerEmail,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String interviewType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) String recommendation) {
        try {
            List<Interview> interviews = interviewSchedulingService.searchInterviews(
                interviewerEmail, status, interviewType, fromDate, toDate, recommendation
            );
            return ResponseEntity.ok(Map.of(
                "interviews", interviews,
                "count", interviews.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to search interviews: " + e.getMessage()));
        }
    }

    /**
     * Get interview statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getInterviewStatistics() {
        try {
            Map<String, Object> statistics = interviewSchedulingService.getInterviewStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get interview statistics: " + e.getMessage()));
        }
    }

    /**
     * Get interviewer performance metrics
     */
    @GetMapping("/interviewer-performance")
    public ResponseEntity<?> getInterviewerPerformance() {
        try {
            List<Map<String, Object>> performance = interviewSchedulingService.getInterviewerPerformance();
            return ResponseEntity.ok(Map.of(
                "performance", performance,
                "count", performance.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get interviewer performance: " + e.getMessage()));
        }
    }

    /**
     * Get interview dashboard data
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getInterviewDashboard() {
        try {
            Map<String, Object> dashboard = interviewSchedulingService.getInterviewDashboard();
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get interview dashboard: " + e.getMessage()));
        }
    }

    /**
     * Send interview reminders (typically called by scheduled task)
     */
    @PostMapping("/send-reminders")
    public ResponseEntity<?> sendInterviewReminders() {
        try {
            interviewSchedulingService.sendInterviewReminders();
            return ResponseEntity.ok(Map.of("message", "Interview reminders sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to send interview reminders: " + e.getMessage()));
        }
    }
}
