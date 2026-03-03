package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.OfferRepository;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class OfferService {

    @Autowired
    private OfferRepository offerRepository;
    
    @Autowired
    private ApplicationRepository applicationRepository;
    
    @Autowired
    private AuditLogService auditLogService;

    // Constants for business rules
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("150000");
    private static final int DEFAULT_EXPIRY_DAYS = 7;
    private static final int MAX_NEGOTIATION_ROUNDS = 5;
    private static final int STALE_NEGOTIATION_HOURS = 48;

    // Core CRUD operations
    public Offer createOffer(Long applicationId, Offer offerData, Long createdBy) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        // Validate application state
        if (!canCreateOfferForApplication(application)) {
            throw new RuntimeException("Cannot create offer for application in current state: " + 
                                     application.getStatus());
        }

        // Set application and basic data
        offerData.setApplication(application);
        offerData.setCreatedBy(createdBy);
        offerData.setJobTitle(application.getJobPosting().getTitle());
        offerData.setDepartment(application.getJobPosting().getDepartment());
        
        // Set default expiry
        if (offerData.getOfferExpiryDate() == null) {
            offerData.setOfferExpiryDate(LocalDateTime.now().plusDays(DEFAULT_EXPIRY_DAYS));
        }
        
        // Determine approval requirements
        setApprovalRequirements(offerData);
        
        // Set probationary period based on offer type
        if (offerData.getProbationaryPeriodDays() == null) {
            offerData.setProbationaryPeriodDays(
                offerData.getOfferType().getDefaultProbationaryPeriodDays()
            );
        }

        Offer savedOffer = offerRepository.save(offerData);
        
        auditLogService.logUserAction(
            createdBy,
            "OFFER_CREATED", 
            "Offer", 
            String.format("Offer %s created for application %d", 
                         savedOffer.getOfferNumber(), applicationId)
        );

        return savedOffer;
    }

    @Transactional(readOnly = true)
    public Optional<Offer> getOfferById(Long id) {
        return offerRepository.findByIdWithDetails(id);
    }

    @Transactional(readOnly = true)
    public List<Offer> getOffersByApplication(Long applicationId) {
        return offerRepository.findActiveOffersByApplication(applicationId);
    }

    @Transactional(readOnly = true)
    public List<Offer> getOffersByApplicant(Long applicantId) {
        return offerRepository.findActiveOffersByApplicantId(applicantId);
    }

    public Offer updateOffer(Long id, Offer updateData, Long updatedBy) {
        Offer existingOffer = offerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Offer not found"));

        if (!existingOffer.canBeEdited()) {
            throw new RuntimeException("Offer cannot be edited in current status: " + 
                                     existingOffer.getStatus());
        }

        // Update fields
        updateOfferFields(existingOffer, updateData);
        existingOffer.setUpdatedBy(updatedBy);
        
        // Re-evaluate approval requirements if compensation changed
        if (compensationChanged(existingOffer, updateData)) {
            setApprovalRequirements(existingOffer);
            // Reset to draft if significant changes made
            if (existingOffer.getStatus() != OfferStatus.DRAFT) {
                existingOffer.setStatus(OfferStatus.DRAFT);
                auditLogService.logUserAction(
                    updatedBy,
                    "OFFER_RESET_TO_DRAFT", 
                    "Offer", 
                    "Offer reset to draft due to significant changes"
                );
            }
        }

        Offer savedOffer = offerRepository.save(existingOffer);
        
        auditLogService.logUserAction(
            updatedBy,
            "OFFER_UPDATED", 
            "Offer", 
            "Offer updated"
        );

        return savedOffer;
    }

    // Status transition methods
    public Offer submitForApproval(Long id, Long submittedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.getStatus().canTransitionTo(OfferStatus.PENDING_APPROVAL)) {
            throw new RuntimeException("Cannot submit offer for approval from status: " + 
                                     offer.getStatus());
        }

        validateOfferForSubmission(offer);
        
        offer.setStatus(OfferStatus.PENDING_APPROVAL);
        offer.setUpdatedBy(submittedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            submittedBy,
            "OFFER_SUBMITTED_FOR_APPROVAL", 
            "Offer", 
            String.format("Offer %s submitted for approval", offer.getOfferNumber())
        );

        return savedOffer;
    }

    public Offer approveOffer(Long id, String approvalNotes, Long approvedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.canBeApproved()) {
            throw new RuntimeException("Offer cannot be approved in current status: " + 
                                     offer.getStatus());
        }

        // Validate approval authority
        validateApprovalAuthority(offer, approvedBy);
        
        offer.setStatus(OfferStatus.APPROVED);
        offer.setApprovedBy(approvedBy);
        offer.setApprovedAt(LocalDateTime.now());
        offer.setApprovalNotes(approvalNotes);
        offer.setUpdatedBy(approvedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            approvedBy,
            "OFFER_APPROVED", 
            "Offer", 
            String.format("Offer %s approved by user %d", offer.getOfferNumber(), approvedBy)
        );

        return savedOffer;
    }

    public Offer rejectOffer(Long id, String rejectionReason, Long rejectedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.getStatus().canTransitionTo(OfferStatus.DRAFT)) {
            throw new RuntimeException("Cannot reject offer from status: " + offer.getStatus());
        }

        offer.setStatus(OfferStatus.DRAFT);
        offer.setRejectedBy(rejectedBy);
        offer.setRejectedAt(LocalDateTime.now());
        offer.setRejectionReason(rejectionReason);
        offer.setUpdatedBy(rejectedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            rejectedBy,
            "OFFER_REJECTED", 
            "Offer", 
            String.format("Offer %s rejected: %s", offer.getOfferNumber(), rejectionReason)
        );

        return savedOffer;
    }

    public Offer sendOffer(Long id, Long sentBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.canBeSent()) {
            throw new RuntimeException("Offer cannot be sent from status: " + offer.getStatus());
        }

        offer.setStatus(OfferStatus.SENT);
        offer.setOfferSentAt(LocalDateTime.now());
        offer.setUpdatedBy(sentBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            sentBy,
            "OFFER_SENT", 
            "Offer", 
            String.format("Offer %s sent to candidate", offer.getOfferNumber())
        );

        return savedOffer;
    }

    public Offer withdrawOffer(Long id, String withdrawalReason, Long withdrawnBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.canBeWithdrawn()) {
            throw new RuntimeException("Offer cannot be withdrawn from status: " + 
                                     offer.getStatus());
        }

        offer.setStatus(OfferStatus.WITHDRAWN);
        offer.setWithdrawnAt(LocalDateTime.now());
        offer.setRejectionReason(withdrawalReason);
        offer.setUpdatedBy(withdrawnBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            withdrawnBy,
            "OFFER_WITHDRAWN", 
            "Offer", 
            String.format("Offer %s withdrawn: %s", offer.getOfferNumber(), withdrawalReason)
        );

        return savedOffer;
    }

    // Candidate response methods
    public Offer recordCandidateViewed(Long id) {
        Offer offer = getOfferOrThrow(id);
        
        if (offer.getCandidateViewedAt() == null) {
            offer.setCandidateViewedAt(LocalDateTime.now());
            
            Offer savedOffer = offerRepository.save(offer);
            
            auditLogService.logSystemAction(
                "OFFER_VIEWED_BY_CANDIDATE", 
                "Offer", 
                String.format("Offer %s viewed by candidate", offer.getOfferNumber())
            );
            
            return savedOffer;
        }
        
        return offer;
    }

    public Offer acceptOffer(Long id, Long acceptedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.getStatus().canTransitionTo(OfferStatus.ACCEPTED)) {
            throw new RuntimeException("Offer cannot be accepted from status: " + 
                                     offer.getStatus());
        }

        offer.setStatus(OfferStatus.ACCEPTED);
        offer.setAcceptedAt(LocalDateTime.now());
        offer.setCandidateResponseAt(LocalDateTime.now());
        offer.setUpdatedBy(acceptedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            acceptedBy,
            "OFFER_ACCEPTED", 
            "Offer", 
            String.format("Offer %s accepted by candidate", offer.getOfferNumber())
        );

        return savedOffer;
    }

    public Offer declineOffer(Long id, String declineReason, Long declinedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.getStatus().canTransitionTo(OfferStatus.DECLINED)) {
            throw new RuntimeException("Offer cannot be declined from status: " + 
                                     offer.getStatus());
        }

        offer.setStatus(OfferStatus.DECLINED);
        offer.setDeclinedAt(LocalDateTime.now());
        offer.setCandidateResponseAt(LocalDateTime.now());
        offer.setRejectionReason(declineReason);
        offer.setUpdatedBy(declinedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            declinedBy,
            "OFFER_DECLINED", 
            "Offer", 
            String.format("Offer %s declined: %s", offer.getOfferNumber(), declineReason)
        );

        return savedOffer;
    }

    // Negotiation methods
    public Offer startNegotiation(Long id, String candidateCounterOffer, Long initiatedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (!offer.canBeNegotiated()) {
            throw new RuntimeException("Offer cannot be negotiated from status: " + 
                                     offer.getStatus());
        }

        offer.setStatus(OfferStatus.UNDER_NEGOTIATION);
        offer.setNegotiationStatus(NegotiationStatus.IN_PROGRESS);
        offer.setCandidateCounterOffer(candidateCounterOffer);
        offer.setNegotiationRounds(offer.getNegotiationRounds() + 1);
        offer.setLastNegotiationAt(LocalDateTime.now());
        offer.setCandidateResponseAt(LocalDateTime.now());
        offer.setUpdatedBy(initiatedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            initiatedBy,
            "NEGOTIATION_STARTED", 
            "Offer", 
            String.format("Negotiation started for offer %s (Round %d)", 
                         offer.getOfferNumber(), offer.getNegotiationRounds())
        );

        return savedOffer;
    }

    public Offer respondToNegotiation(Long id, String companyResponse, 
                                     NegotiationStatus newStatus, Long respondedBy) {
        Offer offer = getOfferOrThrow(id);
        
        if (offer.getStatus() != OfferStatus.UNDER_NEGOTIATION) {
            throw new RuntimeException("Offer is not under negotiation");
        }

        if (offer.getNegotiationRounds() >= MAX_NEGOTIATION_ROUNDS) {
            throw new RuntimeException("Maximum negotiation rounds exceeded");
        }

        offer.setCompanyResponse(companyResponse);
        offer.setNegotiationStatus(newStatus);
        offer.setLastNegotiationAt(LocalDateTime.now());
        
        if (newStatus == NegotiationStatus.CANDIDATE_RESPONSE_PENDING) {
            offer.setNegotiationRounds(offer.getNegotiationRounds() + 1);
        }
        
        offer.setUpdatedBy(respondedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            respondedBy,
            "NEGOTIATION_RESPONSE", 
            "Offer", 
            String.format("Company responded to negotiation for offer %s (Status: %s)", 
                         offer.getOfferNumber(), newStatus.getDisplayName())
        );

        return savedOffer;
    }

    public Offer escalateNegotiation(Long id, String escalationReason, Long escalatedBy) {
        Offer offer = getOfferOrThrow(id);
        
        offer.setNegotiationStatus(NegotiationStatus.ESCALATED);
        offer.setNegotiationNotes(escalationReason);
        offer.setLastNegotiationAt(LocalDateTime.now());
        offer.setUpdatedBy(escalatedBy);
        
        Offer savedOffer = offerRepository.save(offer);
        
        auditLogService.logUserAction(
            escalatedBy,
            "NEGOTIATION_ESCALATED", 
            "Offer", 
            String.format("Negotiation escalated for offer %s: %s", 
                         offer.getOfferNumber(), escalationReason)
        );

        return savedOffer;
    }

    // Version management
    public Offer createNewVersion(Long originalOfferId, Offer updatedOfferData, Long createdBy) {
        Offer originalOffer = getOfferOrThrow(originalOfferId);
        
        if (!originalOffer.getStatus().canTransitionTo(OfferStatus.SUPERSEDED)) {
            throw new RuntimeException("Cannot create new version from status: " + 
                                     originalOffer.getStatus());
        }

        // Create new version
        updatedOfferData.setApplication(originalOffer.getApplication());
        updatedOfferData.setVersion(originalOffer.getVersion() + 1);
        updatedOfferData.setSupersedesOfferId(originalOfferId);
        updatedOfferData.setCreatedBy(createdBy);
        
        Offer newOffer = offerRepository.save(updatedOfferData);
        
        // Update original offer
        originalOffer.setStatus(OfferStatus.SUPERSEDED);
        originalOffer.setSupersededByOfferId(newOffer.getId());
        originalOffer.setUpdatedBy(createdBy);
        offerRepository.save(originalOffer);
        
        auditLogService.logUserAction(
            createdBy,
            "OFFER_VERSION_CREATED", 
            "Offer", 
            String.format("New version %d created for offer %s", 
                         newOffer.getVersion(), originalOffer.getOfferNumber())
        );

        return newOffer;
    }

    // Search and analytics
    @Transactional(readOnly = true)
    public Page<Offer> searchOffers(OfferStatus status, OfferType offerType, 
                                   NegotiationStatus negotiationStatus, String department,
                                   String jobTitle, BigDecimal minSalary, BigDecimal maxSalary,
                                   LocalDateTime startDate, LocalDateTime endDate,
                                   Pageable pageable) {
        return offerRepository.searchOffers(status, offerType, negotiationStatus, 
                                          department, jobTitle, minSalary, maxSalary,
                                          startDate, endDate, pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOfferAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();
        
        // Status distribution
        List<Object[]> statusDistribution = offerRepository.getOfferStatusDistribution(startDate, endDate);
        analytics.put("statusDistribution", statusDistribution);
        
        // Type distribution
        List<Object[]> typeDistribution = offerRepository.getOfferTypeDistribution(startDate, endDate);
        analytics.put("typeDistribution", typeDistribution);
        
        // Acceptance rates
        Object[] acceptanceData = offerRepository.getAcceptanceRateData(startDate, endDate);
        analytics.put("acceptanceRate", acceptanceData);
        
        // Time metrics
        Double avgTimeToAcceptance = offerRepository.getAverageTimeToAcceptanceHours(startDate, endDate);
        analytics.put("averageTimeToAcceptanceHours", avgTimeToAcceptance);
        
        Double avgTimeToDecision = offerRepository.getAverageTimeToDecisionHours(startDate, endDate);
        analytics.put("averageTimeToDecisionHours", avgTimeToDecision);
        
        // Salary statistics
        List<Object[]> salaryByDepartment = offerRepository.getAverageSalaryByDepartment(startDate, endDate);
        analytics.put("averageSalaryByDepartment", salaryByDepartment);
        
        return analytics;
    }

    // Expiry management
    @Transactional(readOnly = true)
    public List<Offer> getExpiredOffers() {
        return offerRepository.findExpiredOffers(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<Offer> getOffersNearExpiry(int hoursAhead) {
        LocalDateTime nearExpiryTime = LocalDateTime.now().plusHours(hoursAhead);
        return offerRepository.findOffersExpiringBetween(LocalDateTime.now(), nearExpiryTime);
    }

    public void processExpiredOffers() {
        List<Offer> expiredOffers = getExpiredOffers();
        
        for (Offer offer : expiredOffers) {
            if (offer.getStatus().canTransitionTo(OfferStatus.EXPIRED)) {
                offer.setStatus(OfferStatus.EXPIRED);
                offer.setUpdatedBy(null); // System process
                offerRepository.save(offer);
                
                auditLogService.logSystemAction(
                    "OFFER_EXPIRED", 
                    "Offer", 
                    String.format("Offer %s expired automatically", offer.getOfferNumber())
                );
            }
        }
    }

    // Dashboard queries
    @Transactional(readOnly = true)
    public Map<String, Long> getDashboardCounts() {
        Map<String, Long> counts = new HashMap<>();
        
        counts.put("pendingApproval", offerRepository.countPendingApproval());
        counts.put("nearExpiry", offerRepository.countNearExpiry(LocalDateTime.now().plusDays(7)));
        counts.put("activeNegotiations", offerRepository.countActiveNegotiations());
        counts.put("recentAcceptances", offerRepository.countRecentAcceptances(LocalDateTime.now().minusDays(7)));
        
        return counts;
    }

    // Helper methods
    private Offer getOfferOrThrow(Long id) {
        return offerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Offer not found with id: " + id));
    }

    private boolean canCreateOfferForApplication(Application application) {
        ApplicationStatus status = application.getStatus();
        return status == ApplicationStatus.REFERENCE_CHECK || 
               status == ApplicationStatus.OFFER_PENDING ||
               status == ApplicationStatus.OFFERED;
    }

    private void setApprovalRequirements(Offer offer) {
        BigDecimal totalCompensation = offer.getTotalCompensation();
        
        if (totalCompensation.compareTo(HIGH_VALUE_THRESHOLD) > 0) {
            offer.setApprovalLevelRequired(2); // Senior management approval
        } else {
            offer.setApprovalLevelRequired(1); // Manager approval
        }
    }

    private void validateApprovalAuthority(Offer offer, Long approverId) {
        // In a real system, this would check user permissions
        // For now, we'll assume the user has appropriate authority
    }

    private void validateOfferForSubmission(Offer offer) {
        if (offer.getBaseSalary() == null || offer.getBaseSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Base salary is required and must be positive");
        }
        
        if (offer.getStartDate() == null) {
            throw new RuntimeException("Start date is required");
        }
        
        if (offer.getOfferType().requiresContractEndDate() && offer.getContractEndDate() == null) {
            throw new RuntimeException("Contract end date is required for this offer type");
        }
    }

    private void updateOfferFields(Offer existing, Offer updated) {
        // Update compensation
        if (updated.getBaseSalary() != null) {
            existing.setBaseSalary(updated.getBaseSalary());
        }
        if (updated.getBonusEligible() != null) {
            existing.setBonusEligible(updated.getBonusEligible());
        }
        if (updated.getBonusTargetPercentage() != null) {
            existing.setBonusTargetPercentage(updated.getBonusTargetPercentage());
        }
        if (updated.getSigningBonus() != null) {
            existing.setSigningBonus(updated.getSigningBonus());
        }
        
        // Update benefits
        if (updated.getVacationDaysAnnual() != null) {
            existing.setVacationDaysAnnual(updated.getVacationDaysAnnual());
        }
        if (updated.getHealthInsurance() != null) {
            existing.setHealthInsurance(updated.getHealthInsurance());
        }
        
        // Update contract terms
        if (updated.getStartDate() != null) {
            existing.setStartDate(updated.getStartDate());
        }
        if (updated.getContractEndDate() != null) {
            existing.setContractEndDate(updated.getContractEndDate());
        }
        if (updated.getProbationaryPeriodDays() != null) {
            existing.setProbationaryPeriodDays(updated.getProbationaryPeriodDays());
        }
        
        // Update other fields as needed
        if (updated.getSpecialConditions() != null) {
            existing.setSpecialConditions(updated.getSpecialConditions());
        }
    }

    private boolean compensationChanged(Offer existing, Offer updated) {
        return updated.getBaseSalary() != null && 
               !updated.getBaseSalary().equals(existing.getBaseSalary());
    }
}