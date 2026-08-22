package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Decides which approval stages a requisition must pass through, based on its value.
 *
 * <p>Before this existed, {@code RequisitionService.submit()} always routed to HR and
 * {@code approve()} always walked HR then Executive, for every requisition regardless of value.
 * A R200,000 role and a R1,100,000 role followed an identical path, so the approval chain recorded
 * who acted but never enforced <em>who was required to act</em>.</p>
 *
 * <p>Routing is on the <strong>top</strong> of the advertised band ({@code salaryMax}), which is the
 * maximum exposure the approver is authorising. A requisition with no salary information routes to
 * the full chain — the conservative default, because an unpriced role is not evidence of a cheap one.</p>
 *
 * <p>The threshold is configuration, not code, because the delegation framework belongs to the
 * client. It is read from {@code shumelahire.requisition.executive-approval-threshold} so it can be
 * set per environment during implementation without a release.</p>
 */
@Service
public class DelegationMatrixService {

    private static final Logger logger = LoggerFactory.getLogger(DelegationMatrixService.class);

    /**
     * Band above which executive approval is required in addition to HR.
     *
     * <p>Default is R1,000,000, set against the IDC demo tenant so that routing matches the
     * delegation behaviour described in Schedule 3: Risk Manager (ceiling R1.1m) escalates to the
     * executive, while Senior Business Analyst (R800k) and Project Manager (R950k) sit within the
     * HR delegation. Confirm against the client's actual delegation matrix during discovery before
     * treating it as correct.</p>
     */
    private final BigDecimal executiveApprovalThreshold;

    public DelegationMatrixService(
            @Value("${shumelahire.requisition.executive-approval-threshold:1000000}")
            BigDecimal executiveApprovalThreshold) {
        this.executiveApprovalThreshold = executiveApprovalThreshold;
        logger.info("Delegation matrix active: executive approval required above {}", executiveApprovalThreshold);
    }

    public BigDecimal getExecutiveApprovalThreshold() {
        return executiveApprovalThreshold;
    }

    /**
     * The ordered chain of approval stages this requisition must clear.
     *
     * @return at least one stage; never empty.
     */
    public List<ApprovalStage> requiredChain(Requisition requisition) {
        BigDecimal ceiling = requisition == null ? null : requisition.getSalaryMax();

        if (ceiling == null) {
            // No band recorded — require the full chain rather than assume a low-value role.
            return List.of(ApprovalStage.HR_MANAGER, ApprovalStage.EXECUTIVE);
        }

        if (ceiling.compareTo(executiveApprovalThreshold) > 0) {
            return List.of(ApprovalStage.HR_MANAGER, ApprovalStage.EXECUTIVE);
        }

        return List.of(ApprovalStage.HR_MANAGER);
    }

    /**
     * The stage a requisition is currently awaiting, or empty if it is not in an approval state.
     */
    public ApprovalStage pendingStage(Requisition requisition) {
        if (requisition == null || requisition.getStatus() == null) {
            return null;
        }
        return switch (requisition.getStatus()) {
            case PENDING_HR_APPROVAL -> ApprovalStage.HR_MANAGER;
            case PENDING_EXECUTIVE_APPROVAL -> ApprovalStage.EXECUTIVE;
            default -> null;
        };
    }

    /**
     * The status a requisition takes when it enters the given stage.
     */
    public RequisitionStatus statusForStage(ApprovalStage stage) {
        return switch (stage) {
            case HR_MANAGER -> RequisitionStatus.PENDING_HR_APPROVAL;
            case EXECUTIVE -> RequisitionStatus.PENDING_EXECUTIVE_APPROVAL;
        };
    }

    /**
     * The next status after the given stage approves, honouring this requisition's required chain.
     *
     * <p>This is the behaviour change: a requisition below the threshold terminates at APPROVED
     * after HR, instead of being pushed to an executive who was never required.</p>
     */
    public RequisitionStatus statusAfterApproval(Requisition requisition, ApprovalStage approvedStage) {
        List<ApprovalStage> chain = requiredChain(requisition);
        int index = chain.indexOf(approvedStage);

        if (index < 0 || index == chain.size() - 1) {
            return RequisitionStatus.APPROVED;
        }
        return statusForStage(chain.get(index + 1));
    }

    /**
     * Human-readable reason a requisition routes the way it does. Surfaced in the UI and the audit
     * trail so the routing decision is explainable rather than merely applied.
     */
    public String routingRationale(Requisition requisition) {
        BigDecimal ceiling = requisition == null ? null : requisition.getSalaryMax();

        if (ceiling == null) {
            return "No salary band recorded — full approval chain required.";
        }
        if (ceiling.compareTo(executiveApprovalThreshold) > 0) {
            return String.format("Band ceiling %s exceeds the %s executive threshold — executive approval required.",
                    ceiling.toPlainString(), executiveApprovalThreshold.toPlainString());
        }
        return String.format("Band ceiling %s is within the %s HR delegation — HR approval only.",
                ceiling.toPlainString(), executiveApprovalThreshold.toPlainString());
    }

    /**
     * Stages in a requisition approval chain, in escalation order.
     */
    public enum ApprovalStage {
        HR_MANAGER,
        EXECUTIVE
    }
}
