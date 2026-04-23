package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.SalaryRecommendationCreateRequest;
import com.arthmatic.shumelahire.dto.SalaryRecommendationProvideRequest;
import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.service.SalaryRecommendationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salary-recommendations")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class SalaryRecommendationController {

    private final SalaryRecommendationService service;

    @Autowired
    public SalaryRecommendationController(SalaryRecommendationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SalaryRecommendation>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody SalaryRecommendationCreateRequest request, Authentication auth) {
        try {
            SalaryRecommendation created = service.createRecommendationRequest(request, auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitForReview(@PathVariable String id, Authentication auth) {
        try {
            return ResponseEntity.ok(service.submitForReview(id, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/recommend")
    public ResponseEntity<?> provideRecommendation(@PathVariable String id,
                                                    @Valid @RequestBody SalaryRecommendationProvideRequest request,
                                                    Authentication auth) {
        try {
            return ResponseEntity.ok(service.provideRecommendation(id, request, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id,
                                     @RequestBody(required = false) Map<String, String> body,
                                     Authentication auth) {
        try {
            String notes = body != null ? body.get("approvalNotes") : null;
            return ResponseEntity.ok(service.approveRecommendation(id, auth.getName(), notes));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id,
                                    @RequestBody Map<String, String> body,
                                    Authentication auth) {
        try {
            String reason = body.get("rejectionReason");
            return ResponseEntity.ok(service.rejectRecommendation(id, auth.getName(), reason));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/link-offer")
    public ResponseEntity<?> linkToOffer(@PathVariable String id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        try {
            String offerId = body.get("offerId");
            return ResponseEntity.ok(service.linkToOffer(id, offerId, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending-review")
    public ResponseEntity<List<SalaryRecommendation>> getPendingReview() {
        return ResponseEntity.ok(service.getPendingReview());
    }

    @GetMapping("/pending-approval")
    public ResponseEntity<List<SalaryRecommendation>> getPendingApproval() {
        return ResponseEntity.ok(service.getPendingApproval());
    }
}
