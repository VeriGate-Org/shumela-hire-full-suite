package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.service.DelegationMatrixService.ApprovalStage;

import java.math.BigDecimal;
import java.util.List;

/**
 * Why a requisition needs the approvers it needs.
 *
 * <p>{@code DelegationMatrixService} has always computed both of these, and its own documentation
 * says the rationale is "surfaced in the UI and the audit trail so the routing decision is
 * explainable rather than merely applied". It reached the audit trail. It never reached a screen,
 * because no controller returned it — so the requisition detail page could show <em>that</em> a
 * requisition was with the executive and never <em>why</em>.
 *
 * <p>This is a separate response rather than fields on {@code Requisition} because the controller
 * returns the entity directly, and widening that shape affects every caller. Routing is also
 * derived rather than stored: it is recomputed from the current band ceiling and the configured
 * threshold, so it stays correct if either changes.
 */
public class RequisitionRoutingResponse {

    /** The ordered stages this requisition must clear. Never empty. */
    private List<String> chain;

    /** Plain-language reason it routes this way, suitable for showing to a person. */
    private String rationale;

    /** True when the chain is longer than the minimum — i.e. the band pushed it up. */
    private boolean escalated;

    /**
     * The amount routing was decided on — the top of the advertised band, which is the maximum
     * exposure being authorised. Null when the requisition carries no band, which is itself
     * meaningful: an unpriced role takes the full chain.
     */
    private BigDecimal measuredValue;

    /** The stage awaiting a decision now, or null if the requisition is not in an approval state. */
    private String currentStage;

    public RequisitionRoutingResponse() {
    }

    public static RequisitionRoutingResponse of(Requisition requisition,
                                                List<ApprovalStage> chain,
                                                String rationale,
                                                ApprovalStage currentStage) {
        RequisitionRoutingResponse response = new RequisitionRoutingResponse();
        response.chain = chain.stream().map(Enum::name).toList();
        response.rationale = rationale;
        response.measuredValue = requisition.getSalaryMax();
        response.currentStage = currentStage == null ? null : currentStage.name();
        // More than one stage means the band pushed it beyond the minimum chain. Deriving this
        // rather than storing it keeps it true if the threshold is reconfigured.
        response.escalated = chain.size() > 1;
        return response;
    }

    public List<String> getChain() { return chain; }
    public void setChain(List<String> chain) { this.chain = chain; }

    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }

    public boolean isEscalated() { return escalated; }
    public void setEscalated(boolean escalated) { this.escalated = escalated; }

    public BigDecimal getMeasuredValue() { return measuredValue; }
    public void setMeasuredValue(BigDecimal measuredValue) { this.measuredValue = measuredValue; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }
}
