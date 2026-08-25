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
/*
 * HIRING_MANAGER is included at class level so a hiring manager can see and raise salary
 * recommendations for their own vacancies. Approve and reject are deliberately narrower — see the
 * annotations on those two methods.
 */
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
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

    /**
     * Approving a salary recommendation is not the same authority as raising one.
     *
     * <p>The escalation this platform is built around — a proposal above the approved band going
     * to someone senior — only means anything if the person who raised it cannot wave it through.
     * HIRING_MANAGER and RECRUITER are therefore excluded here while retaining access to the rest
     * of the controller.</p>
     *
     * <p>EXECUTIVE is <em>added</em>. The role was previously unable to approve a salary
     * recommendation at all, which contradicted how the delegation is described: an amount above
     * the band escalates to the executive, and the executive then approves it.</p>
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
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

    /** Same authority as approving — declining is a decision of equal weight. */
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
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

    /**
     * Send a recommendation back for rework.
     * POST /api/salary-recommendations/{id}/return
     *
     * <p>Separate from {@code /reject}: a rejection ends the recommendation, a return expects it
     * back. {@code submitForReview} already accepts a returned recommendation, so this closes a
     * loop that was built with one end missing.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
    @PostMapping("/{id}/return")
    public ResponseEntity<?> returnForRework(@PathVariable String id,
                                             @RequestBody Map<String, String> body,
                                             Authentication auth) {
        try {
            return ResponseEntity.ok(service.returnForRework(id, auth.getName(), body.get("reason")));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Recommendations that were sent back and not yet resubmitted.
     * GET /api/salary-recommendations/returned
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE', 'RECRUITER')")
    @GetMapping("/returned")
    public ResponseEntity<List<SalaryRecommendation>> getReturned() {
        return ResponseEntity.ok(service.getReturned());
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
