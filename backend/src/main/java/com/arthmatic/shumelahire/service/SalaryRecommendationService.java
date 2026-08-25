package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.SalaryRecommendationCreateRequest;
import com.arthmatic.shumelahire.dto.SalaryRecommendationSummaryResponse;
import com.arthmatic.shumelahire.dto.SalaryRecommendationProvideRequest;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.SalaryRecommendationDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    /**
     * Proposed base salary above which a recommendation needs executive rather than manager sign-off.
     *
     * <p><b>R900,000.</b> Both this and {@code OfferService}'s high-value threshold set
     * {@code approvalLevelRequired} to 2 instead of 1, and both were previously hard-coded — 200000
     * here, 150000 there — with no recorded relationship, leaving a band where an offer was called
     * high value and then routed to a manager anyway.
     *
     * <p>The two are now chosen together so that they catch <b>the same appointments</b>. This reads
     * {@code proposedTargetSalary}, a base salary. The offer threshold reads
     * {@code totalCompensation} — base plus allowances, bonus and benefits — which for a typical
     * package runs about 1.25x base. Setting the offer gate at 1.25x this one means an appointment
     * that trips one trips the other, and the dead band closes by construction rather than by
     * picking two round numbers and hoping.
     *
     * <p>The level is set where senior appointments sit rather than where every professional hire
     * does: the previous 200000 would have sent almost every appointment to an executive, which is
     * how an approval gate becomes a rubber stamp.
     *
     * <p>Initialised as well as annotated: this service is constructed directly in unit tests, where
     * Spring never runs and an annotation-only field would be null at the comparison.
     */
    @Value("${shumelahire.approval.executive-salary-threshold:900000}")
    private BigDecimal executiveApprovalThreshold = new BigDecimal("900000");

    private final SalaryRecommendationDataRepository repository;
    private final ApplicationDataRepository applicationRepository;
    private final AuditLogService auditLogService;

    @Autowired
    public SalaryRecommendationService(
            SalaryRecommendationDataRepository repository,
            ApplicationDataRepository applicationRepository,
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
        if (request.getProposedTargetSalary() != null && request.getProposedTargetSalary().compareTo(executiveApprovalThreshold) > 0) {
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

    public SalaryRecommendation submitForReview(String id, String userId) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.DRAFT && rec.getStatus() != SalaryRecommendationStatus.RETURNED) {
            throw new RuntimeException("Can only submit DRAFT or RETURNED recommendations for review");
        }

        rec.setStatus(SalaryRecommendationStatus.PENDING_REVIEW);
        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(userId, "SUBMIT_FOR_REVIEW", "SALARY_RECOMMENDATION", id,
                "Submitted recommendation " + rec.getRecommendationNumber() + " for review");
        return saved;
    }

    public SalaryRecommendation provideRecommendation(String id, SalaryRecommendationProvideRequest request, String recommendedBy) {
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
        if (request.getRecommendedSalary().compareTo(executiveApprovalThreshold) > 0) {
            rec.setApprovalLevelRequired(2);
            rec.setStatus(SalaryRecommendationStatus.PENDING_APPROVAL);
        } else if (Boolean.TRUE.equals(rec.getRequiresApproval())) {
            rec.setStatus(SalaryRecommendationStatus.PENDING_APPROVAL);
        } else {
            rec.setStatus(SalaryRecommendationStatus.RECOMMENDED);
        }

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(recommendedBy, "PROVIDE_RECOMMENDATION", "SALARY_RECOMMENDATION", id,
                "Provided recommendation of " + request.getRecommendedSalary() + " for " + rec.getRecommendationNumber());
        return saved;
    }

    public SalaryRecommendation approveRecommendation(String id, String approvedBy, String approvalNotes) {
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
        auditLogService.saveLog(approvedBy, "APPROVE", "SALARY_RECOMMENDATION", id,
                "Approved recommendation " + rec.getRecommendationNumber());
        return saved;
    }

    public SalaryRecommendation rejectRecommendation(String id, String rejectedBy, String rejectionReason) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.PENDING_APPROVAL && rec.getStatus() != SalaryRecommendationStatus.RECOMMENDED) {
            throw new RuntimeException("Can only reject PENDING_APPROVAL or RECOMMENDED items");
        }

        rec.setStatus(SalaryRecommendationStatus.REJECTED);
        rec.setRejectedBy(rejectedBy);
        rec.setRejectionReason(rejectionReason);

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(rejectedBy, "REJECT", "SALARY_RECOMMENDATION", id,
                "Rejected recommendation " + rec.getRecommendationNumber() + ": " + rejectionReason);
        return saved;
    }

    /**
     * Send a recommendation back to whoever raised it, to be fixed and resubmitted.
     *
     * <p><b>This is the transition that was missing.</b> {@code RETURNED} has existed on
     * {@link SalaryRecommendationStatus} since the enum was written, and {@link #submitForReview}
     * has always accepted it — the resubmission half of the loop was built. But no code anywhere
     * set the status, so no recommendation could ever be in it. The workflow could reject, and it
     * could resubmit something that had been returned; it could not return.
     *
     * <p><b>Returning is not rejecting.</b> A rejection ends the recommendation — the salary was
     * refused. A return is a request for rework: the number, the justification or the market
     * evidence is not good enough yet, and the requester is expected to fix it and come back. Only
     * one of the two leaves the record alive, which is why they are separate statuses and separate
     * operations rather than a rejection with a flag.
     *
     * <p>Returnable from any stage where somebody is holding it for a decision:
     * {@code PENDING_REVIEW} (the reviewer wants more before recommending a number),
     * {@code RECOMMENDED} and {@code PENDING_APPROVAL} (the approver wants the number revised). A
     * {@code DRAFT} cannot be returned because nobody has been asked to look at it, and a
     * {@code REJECTED} or {@code IMPLEMENTED} one is finished.
     *
     * @param reason why it is going back — required, because "returned" with no explanation is
     *               indistinguishable from a mistake and leaves the requester nothing to act on
     */
    public SalaryRecommendation returnForRework(String id, String returnedBy, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A reason is required when returning a recommendation");
        }

        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        SalaryRecommendationStatus status = rec.getStatus();
        if (status != SalaryRecommendationStatus.PENDING_REVIEW
                && status != SalaryRecommendationStatus.RECOMMENDED
                && status != SalaryRecommendationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Can only return a recommendation that is awaiting review or approval, not " + status);
        }

        rec.setStatus(SalaryRecommendationStatus.RETURNED);
        rec.setReturnedBy(returnedBy);
        rec.setReturnReason(reason);
        rec.setReturnedAt(LocalDateTime.now());
        // Counted rather than flagged: resubmission moves the status on, so without this the fact
        // that it was ever returned disappears the moment somebody fixes it.
        rec.setTimesReturned((rec.getTimesReturned() == null ? 0 : rec.getTimesReturned()) + 1);

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(returnedBy, "RETURN_FOR_REWORK", "SALARY_RECOMMENDATION", id,
                "Returned recommendation " + rec.getRecommendationNumber() + " for rework: " + reason);
        return saved;
    }

    /**
     * Recommendations sent back and not yet resubmitted.
     *
     * <p>The screen these belong on does not exist yet. Until it does they are invisible, which is
     * the state every other status on this record was in — {@link #getAll()} has been sitting here
     * unused while the page called only the two pending lists.
     */
    /**
     * Counts across every salary recommendation.
     *
     * <p>Whole-set on purpose: the page lists all of them, so counting the loaded rows would be
     * correct today and quietly wrong the moment the list is paged.
     */
    public SalaryRecommendationSummaryResponse summary() {
        return SalaryRecommendationSummaryResponse.from(repository.findAll(), LocalDateTime.now());
    }

    public List<SalaryRecommendation> getReturned() {
        return repository.findAll().stream()
                .filter(rec -> rec.getStatus() == SalaryRecommendationStatus.RETURNED)
                .toList();
    }

    public SalaryRecommendation linkToOffer(String id, String offerId, String userId) {
        SalaryRecommendation rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary recommendation not found: " + id));

        if (rec.getStatus() != SalaryRecommendationStatus.APPROVED) {
            throw new RuntimeException("Can only link APPROVED recommendations to offers");
        }

        rec.setOfferId(offerId);
        rec.setStatus(SalaryRecommendationStatus.IMPLEMENTED);

        SalaryRecommendation saved = repository.save(rec);
        auditLogService.saveLog(userId, "LINK_TO_OFFER", "SALARY_RECOMMENDATION", id,
                "Linked recommendation " + rec.getRecommendationNumber() + " to offer " + offerId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<SalaryRecommendation> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public SalaryRecommendation getById(String id) {
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
