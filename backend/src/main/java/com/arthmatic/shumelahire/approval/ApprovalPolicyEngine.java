package com.arthmatic.shumelahire.approval;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

/**
 * Evaluates an {@link ApprovalPolicy} against a record's value to produce the required approval
 * chain, and the sentence explaining it.
 *
 * <p>This is the piece the platform has never had. {@code WorkflowDefinition} has carried a
 * {@code stepsJson} column, a {@code triggerType}, versioning and an {@code isActive} flag since it
 * was written, and {@code WorkflowService} is ninety-five lines of CRUD that never once reads
 * {@code stepsJson}. {@code WorkflowExecution} is a table with no writer. So definitions could be
 * authored, duplicated and toggled, and nothing could ever run one.
 *
 * <p>Meanwhile the same routing rule is implemented three times in three services with three
 * different thresholds. This engine reproduces all three exactly — see
 * {@code ApprovalPolicyEngineTest}, which asserts equivalence rather than asserting the engine
 * merely works — so the existing behaviour can move to configuration without changing what any
 * record does today.
 *
 * <p><b>Scope is deliberately narrow.</b> This decides <em>who must approve</em>. It does not send
 * notifications, does not move records between states, and does not execute arbitrary automation.
 * A general-purpose step runner is a much larger thing and should not be smuggled in behind an
 * approval change.
 */
@Service
public class ApprovalPolicyEngine {

    private static final Logger logger = LoggerFactory.getLogger(ApprovalPolicyEngine.class);

    private final ObjectMapper objectMapper;

    public ApprovalPolicyEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Compute the approval chain for a record.
     *
     * @param policy the chain definition; must not be null and must have at least one base stage
     * @param value  the amount routing is decided on, or null if the record carries none
     * @throws IllegalArgumentException if the policy could not produce a chain — a record that
     *                                  cannot be routed must fail loudly rather than silently
     *                                  become self-approving
     */
    public ApprovalDecision evaluate(ApprovalPolicy policy, BigDecimal value) {
        if (policy == null) {
            throw new IllegalArgumentException("No approval policy supplied");
        }
        if (policy.getBaseChain().isEmpty()) {
            throw new IllegalArgumentException(
                    "Approval policy for " + policy.getAppliesTo() + " has no base chain; "
                            + "a record with no required approver is not a policy");
        }

        // LinkedHashSet: order is the chain, and a stage named twice is still one approval.
        LinkedHashSet<String> chain = new LinkedHashSet<>(policy.getBaseChain());
        List<String> firedReasons = new ArrayList<>();
        boolean escalated = false;

        if (value == null) {
            if (policy.isEscalateWhenValueUnknown()) {
                for (ApprovalPolicy.Escalation escalation : policy.getEscalations()) {
                    if (chain.addAll(escalation.getAddStages())) {
                        escalated = true;
                    }
                }
                return new ApprovalDecision(
                        new ArrayList<>(chain),
                        "No " + policy.getMeasureLabel() + " recorded — full approval chain required.",
                        null,
                        escalated);
            }
            return new ApprovalDecision(
                    new ArrayList<>(chain),
                    "No " + policy.getMeasureLabel() + " recorded — base approval only.",
                    null,
                    false);
        }

        BigDecimal highestCleared = null;
        for (ApprovalPolicy.Escalation escalation : policy.getEscalations()) {
            if (escalation.getAbove() == null) {
                logger.warn("Escalation on {} has no threshold; ignoring it rather than applying it to everything",
                        policy.getAppliesTo());
                continue;
            }
            // Strictly greater than: a record exactly on the threshold does not escalate.
            if (value.compareTo(escalation.getAbove()) > 0) {
                if (chain.addAll(escalation.getAddStages())) {
                    escalated = true;
                }
                if (highestCleared == null || escalation.getAbove().compareTo(highestCleared) > 0) {
                    highestCleared = escalation.getAbove();
                }
                firedReasons.add(String.join(", ", escalation.getAddStages()));
            }
        }

        String rationale = escalated
                ? String.format("%s %s exceeds the %s threshold — %s approval required in addition.",
                        capitalise(policy.getMeasureLabel()), money(value), money(highestCleared),
                        String.join(" and ", firedReasons))
                : String.format("%s %s is within the %s delegation — base approval only.",
                        capitalise(policy.getMeasureLabel()), money(value),
                        lowestThreshold(policy));

        return new ApprovalDecision(new ArrayList<>(chain), rationale, value, escalated);
    }

    /**
     * Read a policy out of a {@code WorkflowDefinition.stepsJson} payload.
     *
     * @throws IllegalArgumentException if the JSON cannot be read as a policy. A definition that
     *                                  cannot be parsed must not fall back to a permissive default —
     *                                  the caller decides what to do with an unusable policy.
     */
    public ApprovalPolicy parse(String stepsJson) {
        if (stepsJson == null || stepsJson.isBlank()) {
            throw new IllegalArgumentException("Workflow definition has no steps");
        }
        try {
            return objectMapper.readValue(stepsJson, ApprovalPolicy.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Workflow definition steps are not a valid approval policy: "
                    + e.getMessage(), e);
        }
    }

    /** Serialise a policy for storage in {@code WorkflowDefinition.stepsJson}. */
    public String serialise(ApprovalPolicy policy) {
        try {
            return objectMapper.writeValueAsString(policy);
        } catch (Exception e) {
            throw new IllegalArgumentException("Approval policy could not be serialised: " + e.getMessage(), e);
        }
    }

    private String lowestThreshold(ApprovalPolicy policy) {
        return policy.getEscalations().stream()
                .map(ApprovalPolicy.Escalation::getAbove)
                .filter(java.util.Objects::nonNull)
                .min(BigDecimal::compareTo)
                .map(this::money)
                .orElse("configured");
    }

    /** Rands, grouped with a non-breaking-friendly space, no decimals — matching how the UI shows bands. */
    private String money(BigDecimal amount) {
        if (amount == null) return "configured";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.UK);
        symbols.setGroupingSeparator(' ');
        return "R " + new DecimalFormat("#,##0", symbols).format(amount);
    }

    private String capitalise(String text) {
        if (text == null || text.isEmpty()) return "Value";
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }
}
