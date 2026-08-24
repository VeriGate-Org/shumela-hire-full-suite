package com.arthmatic.shumelahire.approval;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * The outcome of evaluating an {@link ApprovalPolicy} against one record.
 *
 * <p>Carries the chain <em>and</em> the sentence explaining it. The explanation is not a nicety:
 * {@code DelegationMatrixService.routingRationale()} already produces one and describes it as
 * "surfaced in the UI and the audit trail so the routing decision is explainable rather than merely
 * applied" — and then no controller ever returned it. Once routing is configurable rather than
 * hardcoded, an unexplained chain is worse still, because the reader cannot infer the rule from the
 * code either.
 *
 * <p>Immutable. Evaluating a policy has no side effects; recording the decision against a record is
 * a separate, deliberate act.
 */
public final class ApprovalDecision {

    private final List<String> chain;
    private final String rationale;
    private final BigDecimal measuredValue;
    private final boolean escalated;

    ApprovalDecision(List<String> chain, String rationale, BigDecimal measuredValue, boolean escalated) {
        this.chain = List.copyOf(chain);
        this.rationale = rationale;
        this.measuredValue = measuredValue;
        this.escalated = escalated;
    }

    /** The ordered stages this record must clear. Never empty. */
    public List<String> getChain() {
        return chain;
    }

    /** Plain-language reason this record routes the way it does. Never null. */
    public String getRationale() {
        return rationale;
    }

    /** The value the decision was made on, or null if the record carried none. */
    public BigDecimal getMeasuredValue() {
        return measuredValue;
    }

    /** True when at least one escalation fired — i.e. the chain is longer than the base chain. */
    public boolean isEscalated() {
        return escalated;
    }

    /** The stage this record is awaiting, given the stages already cleared. Empty when the chain is complete. */
    public java.util.Optional<String> nextStageAfter(List<String> completedStages) {
        List<String> completed = completedStages == null ? Collections.emptyList() : completedStages;
        for (String stage : chain) {
            if (!completed.contains(stage)) {
                return java.util.Optional.of(stage);
            }
        }
        return java.util.Optional.empty();
    }

    /** True when every stage in the chain has been cleared. */
    public boolean isComplete(List<String> completedStages) {
        return nextStageAfter(completedStages).isEmpty();
    }

    @Override
    public String toString() {
        return "ApprovalDecision{chain=" + chain + ", escalated=" + escalated
                + ", value=" + measuredValue + "}";
    }
}
