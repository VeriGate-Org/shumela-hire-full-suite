package com.arthmatic.shumelahire.approval;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * A declarative approval chain: who must approve, and at what value another approver joins.
 *
 * <p>This is the shape the platform already implements three times, in three places, with three
 * different thresholds:
 *
 * <ul>
 *   <li>{@code DelegationMatrixService} — requisitions, band ceiling above R1 000 000 adds an
 *       executive. The threshold is {@code @Value}-configured per environment.</li>
 *   <li>{@code SalaryRecommendationService} — recommendations, proposed target above R200 000 sets
 *       approval level 2. The threshold is a {@code private static final}.</li>
 *   <li>{@code OfferService} — offers, total compensation above R150 000 sets approval level 2.
 *       Also a {@code private static final}.</li>
 * </ul>
 *
 * <p>All three measure annual rand compensation, so a R900 000 requisition clears HR alone while a
 * R900 000 salary recommendation needs an executive. Nobody can see that, because the numbers live
 * in three files. Expressing the rule as data rather than code is the point of this class.
 *
 * <p><b>This does not decide anything on its own.</b> {@link ApprovalPolicyEngine} evaluates it. The
 * policy is deliberately inert so it can be stored, versioned and edited without a release — it is
 * intended to be persisted in {@code WorkflowDefinition.stepsJson}, which until now has never been
 * read by anything.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApprovalPolicy {

    /** Record type this policy governs, e.g. {@code REQUISITION}. Free text by design — new record types must not require a code change here. */
    private String appliesTo;

    /** Human name for the value being tested, used in the rationale sentence. */
    private String measureLabel = "value";

    /** Stages every record of this type must clear, in order. Never empty in a valid policy. */
    private List<String> baseChain = new ArrayList<>();

    /** Additional stages that join above a threshold, evaluated in order. */
    private List<Escalation> escalations = new ArrayList<>();

    /**
     * What to do when the measured value is unknown.
     *
     * <p>Defaults to {@code true}, matching {@code DelegationMatrixService}: "a requisition with no
     * salary information routes to the full chain — the conservative default, because an unpriced
     * role is not evidence of a cheap one." Set false only where an absent value genuinely means
     * nothing is at stake.
     */
    private boolean escalateWhenValueUnknown = true;

    public ApprovalPolicy() {
    }

    public String getAppliesTo() { return appliesTo; }
    public void setAppliesTo(String appliesTo) { this.appliesTo = appliesTo; }

    public String getMeasureLabel() { return measureLabel; }
    public void setMeasureLabel(String measureLabel) { this.measureLabel = measureLabel; }

    public List<String> getBaseChain() { return baseChain; }
    public void setBaseChain(List<String> baseChain) {
        this.baseChain = baseChain == null ? new ArrayList<>() : baseChain;
    }

    public List<Escalation> getEscalations() { return escalations; }
    public void setEscalations(List<Escalation> escalations) {
        this.escalations = escalations == null ? new ArrayList<>() : escalations;
    }

    public boolean isEscalateWhenValueUnknown() { return escalateWhenValueUnknown; }
    public void setEscalateWhenValueUnknown(boolean escalateWhenValueUnknown) {
        this.escalateWhenValueUnknown = escalateWhenValueUnknown;
    }

    /** One threshold, and the stages it adds. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Escalation {

        /**
         * The value above which this escalation applies. Strictly greater than, matching all three
         * existing implementations — a record exactly on the threshold does <em>not</em> escalate.
         */
        private BigDecimal above;

        /** Stages appended to the chain when this escalation fires, in order. */
        private List<String> addStages = new ArrayList<>();

        public Escalation() {
        }

        public Escalation(BigDecimal above, List<String> addStages) {
            this.above = above;
            setAddStages(addStages);
        }

        public BigDecimal getAbove() { return above; }
        public void setAbove(BigDecimal above) { this.above = above; }

        public List<String> getAddStages() { return addStages; }
        public void setAddStages(List<String> addStages) {
            this.addStages = addStages == null ? new ArrayList<>() : addStages;
        }
    }
}
