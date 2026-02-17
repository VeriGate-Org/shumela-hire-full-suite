package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.SalaryRecommendationCreateRequest;
import com.arthmatic.shumelahire.dto.SalaryRecommendationProvideRequest;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.SalaryRecommendationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SalaryRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(SalaryRecommendationService.class);
    private static final BigDecimal EXECUTIVE_APPROVAL_THRESHOLD = new BigDecimal("200000");

    private final SalaryRecommendationRepository repository;
    private final ApplicationRepository applicationRepository;
    private final AuditLogService auditLogService;

    @Autowired
    public SalaryRecommendationService(
            SalaryRecommendationRepository repository,
            @Qualifier("shumelahireApplicationRepository") ApplicationRepository applicationRepository,
            AuditLogService auditLogService) {
        this.repository = repository;
        this.applicationRepository = applicationRepository;
        this.auditLogService = auditLogService;
    }

    public SalaryRecommendation createRecommendationRequest(SalaryRecommendationCreateRequest request, String requestedBy) {
        SalaryRecommendation rec = new SalaryRecommendation();
        rec.setRecommendationNumber("SR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        rec.setStatus(SalaryRecommendationStatus.DRAFT);
        rec.setPositionTitle(request.getPositionTitle());
        rec.setDepartment(request.getDepartment());
        rec.setJobGrade(request.getJobGrade());
        rec.setPositionLevel(request.getPositionLevel());
        rec.setRequestedBy(requestedBy);
        rec.setCandidateName(request.getCandidateName());
        rec.setCandidateCurrentSalary(request.getCandidateCurrentSalary());
        rec.setCandidateExpectedSalary(request.getCandidateExpectedSalary());
        rec.setMarketDataReference(request.getMarketDataReference());
        rec.setProposedMinSalary(request.getProposedMinSalary());
        rec.setProposedMaxSalary(request.getProposedMaxSalary());
        rec.setProposedTargetSalary(request.getProposedTargetSalary());

        if (request.getApplicationId() != null) {
            Application app = applicationRepository.findById(request.getApplicationId()).orElse(null);
            rec.setApplication(app);
        }

        // Determine approval level based on proposed target salary
        if (request.getProposedTargetSalary() != null && request.getProposedTargetSalary().compareTo(EXECUTIVE_APPROVAL_THRESHOLD) > 0) {
            rec.setApprovalLevelRequired(2); // Executive approval
        } else {
            rec.setApprovalLevelRequired(1); // Manager approval
        }

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(requestedBy, "CREATE", "SALARY_RECOMMENDATION", saved.getId().toString(),
                "Created salary recommendation request for " + request.getPositionTitle());
        logger.info("Salary recommendation {} created by {}", saved.getRecommendationNumber(), requestedBy);
        return saved;
    }

    public SalaryRecommendation submitForReview(Long id, String userId) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.DRAFT && rec.getStatus() != SalaryRecommendationStatus.RETURNED) {
            throw new RuntimeException("Can only submit DRAFT or RETURNED recommendations for review");
        }

        rec.setStatus(SalaryRecommendationStatus.PENDING_REVIEW);
        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(userId, "SUBMIT_FOR_REVIEW", "SALARY_RECOMMENDATION", id.toString(),
                "Submitted recommendation " + rec.getRecommendationNumber() + " for review");
        return saved;
    }

    public SalaryRecommendation provideRecommendation(Long id, SalaryRecommendationProvideRequest request, String recommendedBy) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.PENDING_REVIEW) {
            throw new RuntimeException("Can only provide recommendation for PENDING_REVIEW items");
        }

        rec.setRecommendedSalary(request.getRecommendedSalary());
        rec.setRecommendedBy(recommendedBy);
        rec.setRecommendedAt(LocalDateTime.now());
        rec.setRecommendationJustification(request.getRecommendationJustification());
        rec.setBonusRecommendation(request.getBonusRecommendation());
        rec.setEquityRecommendation(request.getEquityRecommendation());
        rec.setBenefitsNotes(request.getBenefitsNotes());

        // Determine if approval is needed based on recommended amount
        if (request.getRecommendedSalary().compareTo(EXECUTIVE_APPROVAL_THRESHOLD) > 0) {
            rec.setApprovalLevelRequired(2);
            rec.setStatus(SalaryRecommendationStatus.PENDING_APPROVAL);
        } else if (Boolean.TRUE.equals(rec.getRequiresApproval())) {
            rec.setStatus(SalaryRecommendationStatus.PENDING_APPROVAL);
        } else {
            rec.setStatus(SalaryRecommendationStatus.RECOMMENDED);
        }

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(recommendedBy, "PROVIDE_RECOMMENDATION", "SALARY_RECOMMENDATION", id.toString(),
                "Provided recommendation of " + request.getRecommendedSalary() + " for " + rec.getRecommendationNumber());
        return saved;
    }

    public SalaryRecommendation approveRecommendation(Long id, String approvedBy, String approvalNotes) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.PENDING_APPROVAL && rec.getStatus() != SalaryRecommendationStatus.RECOMMENDED) {
            throw new RuntimeException("Can only approve PENDING_APPROVAL or RECOMMENDED items");
        }

        rec.setStatus(SalaryRecommendationStatus.APPROVED);
        rec.setApprovedBy(approvedBy);
        rec.setApprovedAt(LocalDateTime.now());
        rec.setApprovalNotes(approvalNotes);

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(approvedBy, "APPROVE", "SALARY_RECOMMENDATION", id.toString(),
                "Approved recommendation " + rec.getRecommendationNumber());
        return saved;
    }

    public SalaryRecommendation rejectRecommendation(Long id, String rejectedBy, String rejectionReason) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.PENDING_APPROVAL && rec.getStatus() != SalaryRecommendationStatus.RECOMMENDED) {
            throw new RuntimeException("Can only reject PENDING_APPROVAL or RECOMMENDED items");
        }

        rec.setStatus(SalaryRecommendationStatus.REJECTED);
        rec.setRejectedBy(rejectedBy);
        rec.setRejectionReason(rejectionReason);

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(rejectedBy, "REJECT", "SALARY_RECOMMENDATION", id.toString(),
                "Rejected recommendation " + rec.getRecommendationNumber() + ": " + rejectionReason);
        return saved;
    }

    public SalaryRecommendation linkToOffer(Long id, Long offerId, String userId) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.APPROVED) {
            throw new RuntimeException("Can only link APPROVED recommendations to offers");
        }

        rec.setOfferId(offerId);
        rec.setStatus(SalaryRecommendationStatus.IMPLEMENTED);

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(userId, "LINK_TO_OFFER", "SALARY_RECOMMENDATION", id.toString(),
                "Linked recommendation " + rec.getRecommendationNumber() + " to offer " + offerId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<SalaryRecommendation> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public SalaryRecommendation getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<SalaryRecommendation> getPendingReview() {
        return repository.findByStatusOrderByCreatedAtDesc(SalaryRecommendationStatus.PENDING_REVIEW);
    }

    @Transactional(readOnly = true)
    public List<SalaryRecommendation> getPendingApproval() {
        return repository.findByStatusOrderByCreatedAtDesc(SalaryRecommendationStatus.PENDING_APPROVAL);
    }
}
