package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.service.InterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/interviews")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER')")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    // Create interview
    @PostMapping
    public ResponseEntity<Interview> createInterview(@RequestBody Interview interview,
                                                   @RequestParam String createdBy) {
        try {
            // Resolve applicationId to Application entity when sent as a flat ID from the frontend
            if (interview.getApplication() == null && interview.getApplicationId() != null) {
                Application application = new Application();
                application.setId(interview.getApplicationId());
                interview.setApplication(application);
            }
            Interview createdInterview = interviewService.createInterview(interview, createdBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdInterview);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Schedule interview (convenience method)
    @PostMapping("/schedule")
    public ResponseEntity<Interview> scheduleInterview(@RequestParam String applicationId,
                                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduledAt,
                                                     @RequestParam String interviewerId,
                                                     @RequestParam InterviewType type,
                                                     @RequestParam InterviewRound round,
                                                     @RequestParam String scheduledBy,
                                                     @RequestParam(required = false) Integer durationMinutes,
                                                     @RequestParam(required = false) String location,
                                                     @RequestParam(required = false) String meetingLink,
                                                     @RequestParam(required = false) String meetingRoom,
                                                     @RequestParam(required = false) String instructions) {
        try {
            Interview interview = interviewService.scheduleInterview(applicationId, scheduledAt,
                                                                   interviewerId, type, round, scheduledBy);
            
            // Set optional parameters if provided
            if (durationMinutes != null) interview.setDurationMinutes(durationMinutes);
            if (location != null) interview.setLocation(location);
            if (meetingLink != null) interview.setMeetingLink(meetingLink);
            if (meetingRoom != null) interview.setMeetingRoom(meetingRoom);
            if (instructions != null) interview.setInstructions(instructions);
            
            if (durationMinutes != null || location != null || meetingLink != null || 
                meetingRoom != null || instructions != null) {
                interview = interviewService.updateInterview(interview.getId(), interview, scheduledBy);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(interview);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get interview by ID
    @GetMapping("/{id}")
    public ResponseEntity<Interview> getInterview(@PathVariable String id) {
        try {
            Interview interview = interviewService.getInterviewById(id);
            return ResponseEntity.ok(interview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update interview
    @PutMapping("/{id}")
    public ResponseEntity<Interview> updateInterview(@PathVariable String id,
                                                   @RequestBody Interview interview,
                                                   @RequestParam String updatedBy) {
        try {
            Interview updatedInterview = interviewService.updateInterview(id, interview, updatedBy);
            return ResponseEntity.ok(updatedInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Delete interview
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInterview(@PathVariable String id,
                                              @RequestParam String deletedBy) {
        try {
            interviewService.deleteInterview(id, deletedBy);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Search interviews
    @GetMapping
    public ResponseEntity<Page<Interview>> searchInterviews(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) InterviewStatus status,
            @RequestParam(required = false) InterviewType type,
            @RequestParam(required = false) InterviewRound round,
            @RequestParam(required = false) String interviewerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Long interviewerIdLong = interviewerId != null ? Long.valueOf(interviewerId) : null;
        Page<Interview> interviews = interviewService.searchInterviews(
                searchTerm, status, type, round, interviewerIdLong, startDate, endDate, pageable);

        return ResponseEntity.ok(interviews);
    }

    // Get interviews by application (also accessible by applicants for their own applications)
    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'APPLICANT')")
    public ResponseEntity<List<Interview>> getInterviewsByApplication(@PathVariable String applicationId) {
        List<Interview> interviews = interviewService.getInterviewsByApplication(applicationId);
        return ResponseEntity.ok(interviews);
    }

    // Get interviewer schedule
    @GetMapping("/interviewer/{interviewerId}/schedule")
    public ResponseEntity<List<Interview>> getInterviewerSchedule(
            @PathVariable String interviewerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<Interview> schedule = interviewService.getInterviewerSchedule(interviewerId, startDate, endDate);
        return ResponseEntity.ok(schedule);
    }

    // Reschedule interview
    @PostMapping("/{id}/reschedule")
    public ResponseEntity<Interview> rescheduleInterview(@PathVariable String id,
                                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newScheduledAt,
                                                       @RequestParam String reason,
                                                       @RequestParam String rescheduledBy) {
        try {
            Interview rescheduledInterview = interviewService.rescheduleInterview(id, newScheduledAt, reason, rescheduledBy);
            return ResponseEntity.ok(rescheduledInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Cancel interview
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Interview> cancelInterview(@PathVariable String id,
                                                   @RequestParam String reason,
                                                   @RequestParam String cancelledBy) {
        try {
            Interview cancelledInterview = interviewService.cancelInterview(id, reason, cancelledBy);
            return ResponseEntity.ok(cancelledInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Postpone interview
    @PostMapping("/{id}/postpone")
    public ResponseEntity<Interview> postponeInterview(@PathVariable String id,
                                                      @RequestParam String reason,
                                                      @RequestParam String postponedBy) {
        try {
            Interview postponedInterview = interviewService.postponeInterview(id, reason, postponedBy);
            return ResponseEntity.ok(postponedInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Start interview
    @PostMapping("/{id}/start")
    public ResponseEntity<Interview> startInterview(@PathVariable String id,
                                                  @RequestParam String startedBy) {
        try {
            Interview startedInterview = interviewService.startInterview(id, startedBy);
            return ResponseEntity.ok(startedInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Complete interview
    @PostMapping("/{id}/complete")
    public ResponseEntity<Interview> completeInterview(@PathVariable String id,
                                                     @RequestParam String completedBy) {
        try {
            Interview completedInterview = interviewService.completeInterview(id, completedBy);
            return ResponseEntity.ok(completedInterview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Submit feedback (multi-feedback: one per interviewer)
    @PostMapping("/{id}/feedback")
    public ResponseEntity<InterviewFeedback> submitFeedback(@PathVariable String id,
                                                   @RequestParam @NotBlank(message = "Feedback text is required") String feedback,
                                                   @RequestParam(required = false) Integer rating,
                                                   @RequestParam(required = false) Integer communicationSkills,
                                                   @RequestParam(required = false) Integer technicalSkills,
                                                   @RequestParam(required = false) Integer culturalFit,
                                                   @RequestParam(required = false) String overallImpression,
                                                   @RequestParam InterviewRecommendation recommendation,
                                                   @RequestParam(required = false) String nextSteps,
                                                   @RequestParam(required = false) String technicalAssessment,
                                                   @RequestParam(required = false) String candidateQuestions,
                                                   @RequestParam(required = false) String interviewerNotes,
                                                   @RequestParam String submittedBy,
                                                   @RequestParam(required = false) String interviewerName) {
        try {
            InterviewFeedback savedFeedback = interviewService.submitFeedback(
                    id, feedback, rating, communicationSkills, technicalSkills,
                    culturalFit, overallImpression, recommendation, nextSteps,
                    technicalAssessment, candidateQuestions, interviewerNotes,
                    submittedBy, interviewerName);
            return ResponseEntity.ok(savedFeedback);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get all feedbacks for an interview
    @GetMapping("/{id}/feedbacks")
    public ResponseEntity<List<InterviewFeedback>> getFeedbacks(@PathVariable String id) {
        List<InterviewFeedback> feedbacks = interviewService.getFeedbacksForInterview(id);
        return ResponseEntity.ok(feedbacks);
    }

    // Get feedback for a specific user on an interview
    @GetMapping("/{id}/feedback/user/{userId}")
    public ResponseEntity<InterviewFeedback> getUserFeedback(@PathVariable String id,
                                                             @PathVariable String userId) {
        return interviewService.getFeedbackByInterviewAndUser(id, userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Delete own feedback
    @DeleteMapping("/feedback/{feedbackId}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable String feedbackId,
                                               @RequestParam String deletedBy) {
        try {
            interviewService.deleteFeedback(feedbackId, deletedBy);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // Check interviewer availability
    @GetMapping("/availability/interviewer/{interviewerId}")
    public ResponseEntity<Map<String, Boolean>> checkInterviewerAvailability(
            @PathVariable String interviewerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(defaultValue = "60") int durationMinutes) {
        
        boolean available = interviewService.isInterviewerAvailable(interviewerId, startTime, durationMinutes);
        return ResponseEntity.ok(Map.of("available", available));
    }

    // Check meeting room availability
    @GetMapping("/availability/room/{meetingRoom}")
    public ResponseEntity<Map<String, Boolean>> checkMeetingRoomAvailability(
            @PathVariable String meetingRoom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(defaultValue = "60") int durationMinutes) {
        
        boolean available = interviewService.isMeetingRoomAvailable(meetingRoom, startTime, durationMinutes);
        return ResponseEntity.ok(Map.of("available", available));
    }

    // Get suggested time slots
    @GetMapping("/suggestions/interviewer/{interviewerId}")
    public ResponseEntity<List<LocalDateTime>> getSuggestedTimeSlots(
            @PathVariable String interviewerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime preferredDate,
            @RequestParam(defaultValue = "60") int durationMinutes,
            @RequestParam(defaultValue = "5") int numberOfSuggestions) {
        
        List<LocalDateTime> suggestions = interviewService.getSuggestedTimeSlots(
                interviewerId, preferredDate, durationMinutes, numberOfSuggestions);
        return ResponseEntity.ok(suggestions);
    }

    // Get upcoming interviews
    @GetMapping("/upcoming")
    public ResponseEntity<List<Interview>> getUpcomingInterviews(@RequestParam(defaultValue = "7") int days) {
        List<Interview> upcomingInterviews = interviewService.getUpcomingInterviews(days);
        return ResponseEntity.ok(upcomingInterviews);
    }

    // Get overdue interviews
    @GetMapping("/overdue")
    public ResponseEntity<List<Interview>> getOverdueInterviews() {
        List<Interview> overdueInterviews = interviewService.getOverdueInterviews();
        return ResponseEntity.ok(overdueInterviews);
    }

    // Get interviews requiring feedback
    @GetMapping("/pending-feedback")
    public ResponseEntity<List<Interview>> getInterviewsRequiringFeedback() {
        List<Interview> interviews = interviewService.getInterviewsRequiringFeedback();
        return ResponseEntity.ok(interviews);
    }

    // Get interviews needing reminders
    @GetMapping("/reminders")
    public ResponseEntity<List<Interview>> getInterviewsNeedingReminders(@RequestParam(defaultValue = "24") int hoursAhead) {
        List<Interview> interviews = interviewService.getInterviewsNeedingReminders(hoursAhead);
        return ResponseEntity.ok(interviews);
    }

    // Mark reminder sent
    @PostMapping("/{id}/reminder-sent")
    public ResponseEntity<Void> markReminderSent(@PathVariable String id) {
        try {
            interviewService.markReminderSent(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Request feedback
    @PostMapping("/{id}/request-feedback")
    public ResponseEntity<Void> requestFeedback(@PathVariable String id) {
        try {
            interviewService.requestFeedback(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get analytics
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getInterviewAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        // Default to last 30 days if no dates provided
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> analytics = interviewService.getInterviewAnalytics(startDate, endDate);
        return ResponseEntity.ok(analytics);
    }

    // Calendar endpoints
    @GetMapping("/calendar/{interviewerId}")
    public ResponseEntity<List<Interview>> getInterviewerCalendar(
            @PathVariable String interviewerId,
            @RequestParam int year,
            @RequestParam int month) {
        
        List<Interview> calendar = interviewService.getInterviewerSchedule(
                interviewerId, 
                LocalDateTime.of(year, month, 1, 0, 0),
                LocalDateTime.of(year, month, 1, 0, 0).plusMonths(1)
        );
        return ResponseEntity.ok(calendar);
    }

    // Get interview types enum
    @GetMapping("/types")
    public ResponseEntity<InterviewType[]> getInterviewTypes() {
        return ResponseEntity.ok(InterviewType.values());
    }

    // Get interview rounds enum
    @GetMapping("/rounds")
    public ResponseEntity<InterviewRound[]> getInterviewRounds() {
        return ResponseEntity.ok(InterviewRound.values());
    }

    // Get interview statuses enum
    @GetMapping("/statuses")
    public ResponseEntity<InterviewStatus[]> getInterviewStatuses() {
        return ResponseEntity.ok(InterviewStatus.values());
    }

    // Get interview recommendations enum
    @GetMapping("/recommendations")
    public ResponseEntity<InterviewRecommendation[]> getInterviewRecommendations() {
        return ResponseEntity.ok(InterviewRecommendation.values());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
    }
}