package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.UserRepository;
import com.arthmatic.shumelahire.service.OfferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/offers")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class OfferController {

    private static final Logger log = LoggerFactory.getLogger(OfferController.class);

    @Autowired
    private OfferService offerService;

    @Autowired
    private UserRepository userRepository;

    // Create new offer
    @PostMapping("/applications/{applicationId}")
    public ResponseEntity<?> createOffer(
            @PathVariable Long applicationId,
            @Valid @RequestBody Offer offer,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            Offer createdOffer = offerService.createOffer(applicationId, offer, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOffer);
        } catch (RuntimeException e) {
            log.error("Failed to create offer for application {}: {}", applicationId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get offer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Offer> getOffer(@PathVariable Long id) {
        Optional<Offer> offer = offerService.getOfferById(id);
        return offer.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    // Get offers for application
    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<List<Offer>> getOffersByApplication(@PathVariable Long applicationId) {
        List<Offer> offers = offerService.getOffersByApplication(applicationId);
        return ResponseEntity.ok(offers);
    }

    // Get offers for applicant (O6: single call, eliminates N+1)
    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<List<Offer>> getOffersByApplicant(@PathVariable Long applicantId) {
        List<Offer> offers = offerService.getOffersByApplicant(applicantId);
        return ResponseEntity.ok(offers);
    }

    // Update offer
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOffer(
            @PathVariable Long id,
            @Valid @RequestBody Offer offer,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            Offer updatedOffer = offerService.updateOffer(id, offer, userId);
            return ResponseEntity.ok(updatedOffer);
        } catch (RuntimeException e) {
            log.error("Failed to update offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Submit for approval
    @PostMapping("/{id}/submit-for-approval")
    public ResponseEntity<?> submitForApproval(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            Offer offer = offerService.submitForApproval(id, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to submit offer {} for approval: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Approve offer
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveOffer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String approvalNotes = request.get("approvalNotes");
            Offer offer = offerService.approveOffer(id, approvalNotes, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to approve offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Reject offer
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectOffer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String rejectionReason = request.get("rejectionReason");
            Offer offer = offerService.rejectOffer(id, rejectionReason, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to reject offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Send offer
    @PostMapping("/{id}/send")
    public ResponseEntity<?> sendOffer(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            Offer offer = offerService.sendOffer(id, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to send offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Withdraw offer
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawOffer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String withdrawalReason = request.get("withdrawalReason");
            Offer offer = offerService.withdrawOffer(id, withdrawalReason, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to withdraw offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Record candidate viewed
    @PostMapping("/{id}/viewed")
    public ResponseEntity<?> recordCandidateViewed(@PathVariable Long id) {
        try {
            Offer offer = offerService.recordCandidateViewed(id);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to record offer {} viewed: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Accept offer
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptOffer(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            Offer offer = offerService.acceptOffer(id, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to accept offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Decline offer
    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineOffer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String declineReason = request.get("declineReason");
            Offer offer = offerService.declineOffer(id, declineReason, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to decline offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Start negotiation
    @PostMapping("/{id}/negotiate")
    public ResponseEntity<?> startNegotiation(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String candidateCounterOffer = request.get("candidateCounterOffer");
            Offer offer = offerService.startNegotiation(id, candidateCounterOffer, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to start negotiation for offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Respond to negotiation
    @PostMapping("/{id}/negotiate/respond")
    public ResponseEntity<?> respondToNegotiation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String companyResponse = (String) request.get("companyResponse");
            String statusStr = (String) request.get("negotiationStatus");
            NegotiationStatus status = NegotiationStatus.valueOf(statusStr);

            Offer offer = offerService.respondToNegotiation(id, companyResponse, status, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to respond to negotiation for offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Escalate negotiation
    @PostMapping("/{id}/negotiate/escalate")
    public ResponseEntity<?> escalateNegotiation(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            String escalationReason = request.get("escalationReason");
            Offer offer = offerService.escalateNegotiation(id, escalationReason, userId);
            return ResponseEntity.ok(offer);
        } catch (RuntimeException e) {
            log.error("Failed to escalate negotiation for offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Create new version
    @PostMapping("/{id}/new-version")
    public ResponseEntity<?> createNewVersion(
            @PathVariable Long id,
            @Valid @RequestBody Offer updatedOfferData,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);
            Offer newVersion = offerService.createNewVersion(id, updatedOfferData, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(newVersion);
        } catch (RuntimeException e) {
            log.error("Failed to create new version for offer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Search offers with pagination
    @GetMapping("/search")
    public ResponseEntity<Page<Offer>> searchOffers(
            @RequestParam(required = false) OfferStatus status,
            @RequestParam(required = false) OfferType offerType,
            @RequestParam(required = false) NegotiationStatus negotiationStatus,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String jobTitle,
            @RequestParam(required = false) BigDecimal minSalary,
            @RequestParam(required = false) BigDecimal maxSalary,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                   Sort.by(sortBy).descending() :
                   Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Offer> offers = offerService.searchOffers(
            status, offerType, negotiationStatus, department, jobTitle,
            minSalary, maxSalary, startDate, endDate, pageable
        );

        return ResponseEntity.ok(offers);
    }

    // Get offer analytics
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getOfferAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        Map<String, Object> analytics = offerService.getOfferAnalytics(startDate, endDate);
        return ResponseEntity.ok(analytics);
    }

    // Get dashboard counts
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Long>> getDashboardCounts() {
        Map<String, Long> counts = offerService.getDashboardCounts();
        return ResponseEntity.ok(counts);
    }

    // Get expired offers
    @GetMapping("/expired")
    public ResponseEntity<List<Offer>> getExpiredOffers() {
        List<Offer> expiredOffers = offerService.getExpiredOffers();
        return ResponseEntity.ok(expiredOffers);
    }

    // Get offers near expiry
    @GetMapping("/near-expiry")
    public ResponseEntity<List<Offer>> getOffersNearExpiry(
            @RequestParam(defaultValue = "24") int hoursAhead) {
        List<Offer> nearExpiryOffers = offerService.getOffersNearExpiry(hoursAhead);
        return ResponseEntity.ok(nearExpiryOffers);
    }

    // Process expired offers (admin/system endpoint)
    @PostMapping("/process-expired")
    public ResponseEntity<String> processExpiredOffers() {
        try {
            offerService.processExpiredOffers();
            return ResponseEntity.ok("Expired offers processed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                              .body("Error processing expired offers");
        }
    }

    // Get offer status options
    @GetMapping("/status-options")
    public ResponseEntity<OfferStatus[]> getOfferStatusOptions() {
        return ResponseEntity.ok(OfferStatus.values());
    }

    // Get offer type options
    @GetMapping("/type-options")
    public ResponseEntity<OfferType[]> getOfferTypeOptions() {
        return ResponseEntity.ok(OfferType.values());
    }

    // Get negotiation status options
    @GetMapping("/negotiation-status-options")
    public ResponseEntity<NegotiationStatus[]> getNegotiationStatusOptions() {
        return ResponseEntity.ok(NegotiationStatus.values());
    }

    // Exception handler for validation errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        return ResponseEntity.badRequest()
                           .body(Map.of("error", e.getMessage()));
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .map(User::getId)
                        .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }
        throw new RuntimeException("Unable to resolve user from authentication");
    }
}
