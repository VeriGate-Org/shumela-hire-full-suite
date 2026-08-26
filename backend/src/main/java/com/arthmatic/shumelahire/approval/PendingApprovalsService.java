package com.arthmatic.shumelahire.approval;

import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.service.SalaryRecommendationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.arthmatic.shumelahire.security.ApprovalAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.Supplier;

/**
 * Everything awaiting approval, across the five mechanisms that each have their own screen.
 *
 * <p>Requisitions, job adverts, offers, salary recommendations and leave are five separate
 * approval implementations. An approver has five queues and no single view of what they owe, which
 * is how a requisition sits nineteen days while its approver is busy elsewhere in the product.
 *
 * <p><b>Two of the five can say whether an item is yours.</b> Offers filter by approval level;
 * leave filters by manager. Requisitions, job adverts and salary recommendations can only report
 * that something is pending <em>somebody</em>, so their items are marked
 * {@link PendingApproval.Assignment#UNCONFIRMED} and the caller must present them as such rather
 * than implying ownership. That is a limitation of the sources, not of this aggregate, and it
 * disappears once routing moves to {@link ApprovalPolicyEngine}, which knows the chain.
 *
 * <p><b>A source that fails is reported, never omitted.</b> Each is read independently and a
 * failure is recorded in {@link PendingApprovalsResult#getUnavailableSources()}. Dropping a failed
 * source would render an outage as "nothing pending", which is the same defect as a dashboard
 * showing zeros when its backend is unreachable.
 *
 * <p>Read-only. Approving still happens on each record's own endpoint, so the audit trail is
 * identical whichever screen was used.
 */
@Service
public class PendingApprovalsService {

    private static final Logger logger = LoggerFactory.getLogger(PendingApprovalsService.class);

    /** Requisition statuses that mean somebody owes a decision. */
    private static final List<RequisitionStatus> REQUISITION_PENDING = List.of(
            RequisitionStatus.PENDING_HR_APPROVAL,
            RequisitionStatus.PENDING_EXECUTIVE_APPROVAL);

    private final RequisitionDataRepository requisitionRepository;
    private final JobPostingDataRepository jobPostingRepository;
    private final OfferDataRepository offerRepository;
    private final SalaryRecommendationService salaryRecommendationService;
    private final ApprovalAuthority approvalAuthority;

    public PendingApprovalsService(RequisitionDataRepository requisitionRepository,
                                   JobPostingDataRepository jobPostingRepository,
                                   OfferDataRepository offerRepository,
                                   SalaryRecommendationService salaryRecommendationService,
                                   ApprovalAuthority approvalAuthority) {
        this.requisitionRepository = requisitionRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.offerRepository = offerRepository;
        this.salaryRecommendationService = salaryRecommendationService;
        this.approvalAuthority = approvalAuthority;
    }

    /**
     * @param viewer the signed-in caller, whose approval level decides which offers are theirs. A
     *               caller with no recorded level gets no offers, and the reason is reported in
     *               {@code unavailableSources} rather than the source being silently absent.
     */
    public PendingApprovalsResult pendingFor(Authentication viewer) {
        // Read from the user record, never from the request. Offers are filtered by this number,
        // so a caller who supplies it decides for themselves how much they may see.
        int userApprovalLevel = approvalAuthority.levelFor(viewer);
        PendingApprovalsResult result = new PendingApprovalsResult();
        List<PendingApproval> items = new ArrayList<>();

        collect(result, "requisitions", items, this::requisitions);
        collect(result, "jobAdverts", items, this::jobAdverts);
        collect(result, "salaryRecommendations", items, this::salaryRecommendations);

        if (userApprovalLevel > 0) {
            collect(result, "offers", items, () -> offers(userApprovalLevel));
        } else {
            result.getUnavailableSources().put("offers",
                    "No approval level is recorded against your user, so offers cannot be matched "
                            + "to you. An administrator sets this.");
        }

        // Leave is deliberately not read here. Its query takes a manager id rather than the
        // caller's identity, and wiring the two together is a change to leave's own contract —
        // see PendingApprovalsController for why it is a separate, explicit step.

        // Oldest first: on a queue the only ordering that matters is who has waited longest.
        items.sort(Comparator.comparing(PendingApproval::getWaitingSince,
                Comparator.nullsLast(Comparator.naturalOrder())));

        result.setItems(items);
        return result;
    }

    private void collect(PendingApprovalsResult result, String source,
                         List<PendingApproval> into, Supplier<List<PendingApproval>> reader) {
        try {
            into.addAll(reader.get());
        } catch (Exception e) {
            logger.error("Pending approvals: source {} failed", source, e);
            result.getUnavailableSources().put(source,
                    e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private List<PendingApproval> requisitions() {
        List<PendingApproval> out = new ArrayList<>();
        for (RequisitionStatus status : REQUISITION_PENDING) {
            for (Requisition requisition : requisitionRepository.findByStatusOrderByCreatedAtDesc(status)) {
                PendingApproval item = new PendingApproval();
                item.setId(requisition.getId());
                item.setKind(PendingApproval.Kind.REQUISITION);
                item.setTitle(requisition.getJobTitle());
                item.setSubtitle(requisition.getDepartment());
                item.setRaisedBy(requisition.getCreatedBy());
                item.setWaitingSince(requisition.getUpdatedAt());
                item.setStage(status.name());
                item.setStakeAmount(requisition.getSalaryMax());
                item.setStakeLabel(requisition.getSalaryMax() == null
                        ? "No band recorded" : "band ceiling");
                // Requisition routing is by role, and this aggregate does not know the caller's
                // role well enough to claim the item is theirs.
                item.setAssignment(PendingApproval.Assignment.UNCONFIRMED);
                out.add(item);
            }
        }
        return out;
    }

    private List<PendingApproval> jobAdverts() {
        List<PendingApproval> out = new ArrayList<>();
        for (JobPosting posting :
                jobPostingRepository.findByStatusOrderByCreatedAtDesc(JobPostingStatus.PENDING_APPROVAL)) {
            PendingApproval item = new PendingApproval();
            item.setId(String.valueOf(posting.getId()));
            item.setKind(PendingApproval.Kind.JOB_ADVERT);
            item.setTitle(posting.getTitle());
            item.setSubtitle(posting.getDepartment());
            item.setRaisedBy(posting.getCreatedBy());
            item.setWaitingSince(posting.getSubmittedForApprovalAt());
            item.setStage(JobPostingStatus.PENDING_APPROVAL.name());
            // Publishing an advert commits no money. Saying so is more useful than an empty cell.
            item.setStakeAmount(null);
            item.setStakeLabel("Publication — no financial commitment");
            item.setAssignment(PendingApproval.Assignment.UNCONFIRMED);
            out.add(item);
        }
        return out;
    }

    private List<PendingApproval> offers(int userApprovalLevel) {
        List<PendingApproval> out = new ArrayList<>();
        for (Offer offer : offerRepository.findOffersRequiringApproval(userApprovalLevel)) {
            PendingApproval item = new PendingApproval();
            item.setId(offer.getId());
            item.setKind(PendingApproval.Kind.OFFER);
            item.setTitle(offer.getJobTitle());
            // The candidate's name lives on the linked application, not on the offer. Read it if
            // the association is loaded and fall back to the offer number rather than fetching —
            // this aggregate must not turn one query per source into one query per row.
            item.setSubtitle(candidateNameOrReference(offer));
            item.setWaitingSince(offer.getCreatedAt());
            item.setStage("PENDING_APPROVAL");
            item.setStakeAmount(offer.getTotalCompensation());
            item.setStakeLabel("total compensation");
            // The source filtered by this user's approval level, so this one really is theirs.
            item.setAssignment(PendingApproval.Assignment.YOURS);
            out.add(item);
        }
        return out;
    }

    /**
     * The candidate an offer is for, if the application is already loaded, otherwise the offer
     * number. Never triggers a fetch: an approval queue that costs one extra read per row is the
     * defect this endpoint exists to avoid.
     */
    private String candidateNameOrReference(Offer offer) {
        try {
            if (offer.getApplication() != null && offer.getApplication().getCandidateName() != null) {
                return offer.getApplication().getCandidateName();
            }
        } catch (Exception e) {
            // A lazy association that cannot be resolved here is not worth failing the row for.
            logger.debug("Offer {} candidate name unavailable: {}", offer.getId(), e.getMessage());
        }
        return offer.getOfferNumber();
    }

    private List<PendingApproval> salaryRecommendations() {
        List<PendingApproval> out = new ArrayList<>();
        for (SalaryRecommendation rec : salaryRecommendationService.getPendingApproval()) {
            PendingApproval item = new PendingApproval();
            item.setId(rec.getId());
            item.setKind(PendingApproval.Kind.SALARY_RECOMMENDATION);
            item.setTitle(rec.getPositionTitle());
            item.setSubtitle(rec.getRecommendationNumber());
            item.setRaisedBy(rec.getRequestedBy());
            item.setWaitingSince(rec.getUpdatedAt());
            item.setStage("PENDING_APPROVAL");
            // The recommended amount is what is being authorised; fall back to the proposal
            // where no recommendation has been made yet.
            item.setStakeAmount(rec.getRecommendedSalary() != null
                    ? rec.getRecommendedSalary() : rec.getProposedTargetSalary());
            item.setStakeLabel(rec.getRecommendedSalary() != null
                    ? "recommended salary" : "proposed salary");
            item.setAssignment(PendingApproval.Assignment.UNCONFIRMED);
            out.add(item);
        }
        return out;
    }
}
