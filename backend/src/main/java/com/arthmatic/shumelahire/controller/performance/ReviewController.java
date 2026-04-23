package com.arthmatic.shumelahire.controller.performance;

import com.arthmatic.shumelahire.entity.performance.PerformanceReview;
import com.arthmatic.shumelahire.service.performance.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/performance/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<PerformanceReview>> getReviews(
            @RequestParam(required = false) String cycleId,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(reviewService.getReviews(cycleId, employeeId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceReview> getReview(@PathVariable String id) {
        return reviewService.getReview(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody CreateReviewRequest request) {
        try {
            PerformanceReview review = reviewService.createReview(request.contractId, request.reviewType);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/self-assessment")
    public ResponseEntity<?> submitSelfAssessment(@PathVariable String id,
                                                   @RequestBody SelfAssessmentRequest request) {
        try {
            PerformanceReview review = reviewService.submitSelfAssessment(
                    id, request.notes, request.rating, request.goalScores);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/manager-assessment")
    public ResponseEntity<?> submitManagerAssessment(@PathVariable String id,
                                                      @RequestBody ManagerAssessmentRequest request) {
        try {
            PerformanceReview review = reviewService.submitManagerAssessment(
                    id, request.notes, request.rating, request.goalScores);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeReview(@PathVariable String id) {
        try {
            PerformanceReview review = reviewService.completeReview(id);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class CreateReviewRequest {
        public String contractId;
        public String reviewType;
    }

    public static class SelfAssessmentRequest {
        public String notes;
        public BigDecimal rating;
        public List<ReviewService.GoalScoreInput> goalScores;
    }

    public static class ManagerAssessmentRequest {
        public String notes;
        public BigDecimal rating;
        public List<ReviewService.GoalScoreInput> goalScores;
    }
}
