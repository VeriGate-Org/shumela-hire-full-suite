package com.arthmatic.shumelahire.controller.performance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.performance.*;
import com.arthmatic.shumelahire.service.performance.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/performance/feedback")
@FeatureGate("PERFORMANCE_360_FEEDBACK")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody FeedbackRequestCreateRequest request) {
        try {
            FeedbackRequestResponse response = feedbackService.createRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequest(@PathVariable String id) {
        try {
            return ResponseEntity.ok(feedbackService.getRequest(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests/employee/{employeeId}")
    public ResponseEntity<List<FeedbackRequestResponse>> getRequestsForEmployee(
            @PathVariable String employeeId) {
        return ResponseEntity.ok(feedbackService.getRequestsForEmployee(employeeId));
    }

    @GetMapping("/requests/requester/{requesterId}")
    public ResponseEntity<List<FeedbackRequestResponse>> getRequestsByRequester(
            @PathVariable String requesterId) {
        return ResponseEntity.ok(feedbackService.getRequestsByRequester(requesterId));
    }

    @GetMapping("/requests/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<List<FeedbackRequestResponse>> getPendingRequests() {
        return ResponseEntity.ok(feedbackService.getPendingRequests());
    }

    @PostMapping("/requests/{id}/submit")
    public ResponseEntity<?> submitFeedback(@PathVariable String id,
                                            @RequestBody FeedbackSubmitRequest request) {
        try {
            FeedbackResponseDto response = feedbackService.submitFeedback(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}/decline")
    public ResponseEntity<?> declineRequest(@PathVariable String id) {
        try {
            feedbackService.declineRequest(id);
            return ResponseEntity.ok(Map.of("message", "Request declined"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests/{id}/responses")
    public ResponseEntity<List<FeedbackResponseDto>> getResponses(@PathVariable String id) {
        return ResponseEntity.ok(feedbackService.getResponses(id));
    }
}
