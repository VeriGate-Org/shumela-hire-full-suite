package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.service.PipelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pipeline")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
public class PipelineController {

    @Autowired
    private PipelineService pipelineService;

    // Transition operations
    @PostMapping("/applications/{applicationId}/move")
    public ResponseEntity<PipelineTransition> moveApplicationToStage(
            @PathVariable String applicationId,
            @RequestParam PipelineStage targetStage,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String notes,
            @RequestParam String performedBy) {
        
        try {
            PipelineTransition transition = pipelineService.moveApplicationToStage(
                applicationId, targetStage, reason, notes, performedBy);
            return ResponseEntity.ok(transition);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/applications/{applicationId}/progress")
    public ResponseEntity<PipelineTransition> progressToNextStage(
            @PathVariable String applicationId,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String notes,
            @RequestParam String performedBy) {
        
        try {
            PipelineTransition transition = pipelineService.progressToNextStage(
                applicationId, reason, notes, performedBy);
            return ResponseEntity.ok(transition);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/applications/{applicationId}/reject")
    public ResponseEntity<PipelineTransition> rejectApplication(
            @PathVariable String applicationId,
            @RequestParam PipelineStage rejectionStage,
            @RequestParam String reason,
            @RequestParam(required = false) String notes,
            @RequestParam String rejectedBy) {
        
        try {
            PipelineTransition transition = pipelineService.rejectApplication(
                applicationId, rejectionStage, reason, notes, rejectedBy);
            return ResponseEntity.ok(transition);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/applications/{applicationId}/withdraw")
    public ResponseEntity<PipelineTransition> withdrawApplication(
            @PathVariable String applicationId,
            @RequestParam String reason,
            @RequestParam(required = false) String notes,
            @RequestParam String withdrawnBy) {
        
        try {
            PipelineTransition transition = pipelineService.withdrawApplication(
                applicationId, reason, notes, withdrawnBy);
            return ResponseEntity.ok(transition);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Query operations
    @GetMapping("/applications/{applicationId}/timeline")
    public ResponseEntity<List<PipelineTransition>> getApplicationTimeline(@PathVariable String applicationId) {
        List<PipelineTransition> timeline = pipelineService.getApplicationTimeline(applicationId);
        return ResponseEntity.ok(timeline);
    }

    @GetMapping("/applications/{applicationId}/latest-transition")
    public ResponseEntity<PipelineTransition> getLatestTransition(@PathVariable String applicationId) {
        Optional<PipelineTransition> transition = pipelineService.getLatestTransition(applicationId);
        return transition.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applications/{applicationId}/available-transitions")
    public ResponseEntity<List<PipelineStage>> getAvailableTransitions(@PathVariable String applicationId) {
        try {
            List<PipelineStage> stages = pipelineService.getAvailableTransitions(applicationId);
            return ResponseEntity.ok(stages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<List<PipelineTransition>> getRecentActivity(
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "50") int limit) {
        
        List<PipelineTransition> activity = pipelineService.getRecentActivity(hours, limit);
        return ResponseEntity.ok(activity);
    }

    // Analytics endpoints
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getPipelineAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        // Default to last 30 days if no dates provided
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> analytics = pipelineService.getPipelineAnalytics(startDate, endDate);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/analytics/bottlenecks")
    public ResponseEntity<Map<String, Object>> getBottleneckAnalysis(
            @RequestParam(defaultValue = "7") int thresholdDays,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(90);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> analysis = pipelineService.getBottleneckAnalysis(thresholdDays, startDate, endDate);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/analytics/rejections")
    public ResponseEntity<Map<String, Object>> getRejectionAnalysis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(90);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> analysis = pipelineService.getRejectionAnalysis(startDate, endDate);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/analytics/withdrawals")
    public ResponseEntity<Map<String, Object>> getWithdrawalAnalysis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(90);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> analysis = pipelineService.getWithdrawalAnalysis(startDate, endDate);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/analytics/departments")
    public ResponseEntity<Map<String, Object>> getDepartmentPipelineStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(90);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> stats = pipelineService.getDepartmentPipelineStats(startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/analytics/job-postings/{jobPostingId}")
    public ResponseEntity<Map<String, Object>> getJobPostingPipelineStats(
            @PathVariable String jobPostingId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(90);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> stats = pipelineService.getJobPostingPipelineStats(jobPostingId, startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/analytics/transition-types")
    public ResponseEntity<Map<String, Object>> getTransitionTypeStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> stats = pipelineService.getTransitionTypeStatistics(startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/analytics/user-activity")
    public ResponseEntity<Map<String, Object>> getUserActivityStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> stats = pipelineService.getUserActivityStatistics(startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/analytics/regressions")
    public ResponseEntity<List<PipelineTransition>> getRegressionAnalysis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(90);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        List<PipelineTransition> regressions = pipelineService.getRegressionAnalysis(startDate, endDate);
        return ResponseEntity.ok(regressions);
    }

    // Stage management
    @GetMapping("/stages")
    public ResponseEntity<PipelineStage[]> getAllStages() {
        return ResponseEntity.ok(PipelineStage.values());
    }

    @GetMapping("/stages/active")
    public ResponseEntity<PipelineStage[]> getActiveStages() {
        return ResponseEntity.ok(PipelineStage.getActiveStages());
    }

    @GetMapping("/stages/terminal")
    public ResponseEntity<PipelineStage[]> getTerminalStages() {
        return ResponseEntity.ok(PipelineStage.getTerminalStages());
    }

    @GetMapping("/stages/ordered")
    public ResponseEntity<PipelineStage[]> getOrderedStages() {
        return ResponseEntity.ok(PipelineStage.getOrderedStages());
    }

    // Transition types
    @GetMapping("/transition-types")
    public ResponseEntity<TransitionType[]> getTransitionTypes() {
        return ResponseEntity.ok(TransitionType.values());
    }

    // Stuck applications
    @GetMapping("/stuck-applications")
    public ResponseEntity<List<Application>> getStuckApplications(
            @RequestParam PipelineStage stage,
            @RequestParam(defaultValue = "7") int days) {
        
        List<Application> stuckApplications = pipelineService.getApplicationsStuckInStage(stage, days);
        return ResponseEntity.ok(stuckApplications);
    }

    // Automated transitions
    @PostMapping("/applications/{applicationId}/auto-progress")
    public ResponseEntity<PipelineTransition> automateProgressionFromInterview(
            @PathVariable String applicationId,
            @RequestParam String interviewId,
            @RequestParam PipelineStage targetStage,
            @RequestParam InterviewRecommendation recommendation) {
        
        try {
            PipelineTransition transition = pipelineService.automateTransitionFromInterview(
                applicationId, interviewId, targetStage, recommendation);
            return ResponseEntity.ok(transition);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = Map.of(
            "status", "healthy",
            "service", "Pipeline Management",
            "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.ok(health);
    }

    // Error handling
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
    }
}
