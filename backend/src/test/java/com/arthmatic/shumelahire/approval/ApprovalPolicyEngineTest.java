package com.arthmatic.shumelahire.approval;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.service.DelegationMatrixService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The point of these tests is not that the engine works — it is that the engine produces
 * <em>exactly</em> what the three existing implementations produce. Configurable routing is only
 * safe to adopt if switching to it changes no record's behaviour on day one.
 */
class ApprovalPolicyEngineTest {

    private ApprovalPolicyEngine engine;

    /** Requisitions: R1 000 000, from {@code shumelahire.requisition.executive-approval-threshold}. */
    private static final BigDecimal REQUISITION_THRESHOLD = new BigDecimal("1000000");
    /** Salary recommendations: {@code SalaryRecommendationService.EXECUTIVE_APPROVAL_THRESHOLD}. */
    private static final BigDecimal SALARY_THRESHOLD = new BigDecimal("200000");
    /** Offers: {@code OfferService.HIGH_VALUE_THRESHOLD}. */
    private static final BigDecimal OFFER_THRESHOLD = new BigDecimal("150000");

    @BeforeEach
    void setUp() {
        engine = new ApprovalPolicyEngine(new ObjectMapper());
    }

    private static ApprovalPolicy requisitionPolicy() {
        ApprovalPolicy policy = new ApprovalPolicy();
        policy.setAppliesTo("REQUISITION");
        policy.setMeasureLabel("band ceiling");
        policy.setBaseChain(List.of("HR_MANAGER"));
        policy.setEscalations(List.of(
                new ApprovalPolicy.Escalation(REQUISITION_THRESHOLD, List.of("EXECUTIVE"))));
        return policy;
    }

    private static ApprovalPolicy levelPolicy(String appliesTo, String label, BigDecimal threshold) {
        ApprovalPolicy policy = new ApprovalPolicy();
        policy.setAppliesTo(appliesTo);
        policy.setMeasureLabel(label);
        policy.setBaseChain(List.of("LEVEL_1"));
        policy.setEscalations(List.of(new ApprovalPolicy.Escalation(threshold, List.of("LEVEL_2"))));
        return policy;
    }

    private static Requisition requisitionWithCeiling(BigDecimal ceiling) {
        Requisition requisition = new Requisition();
        requisition.setSalaryMax(ceiling);
        return requisition;
    }

    // ── Equivalence with the live requisition implementation ────────────────

    @Nested
    @DisplayName("Reproduces DelegationMatrixService exactly")
    class RequisitionEquivalence {

        private final DelegationMatrixService live = new DelegationMatrixService(REQUISITION_THRESHOLD);

        private List<String> liveChain(BigDecimal ceiling) {
            return live.requiredChain(requisitionWithCeiling(ceiling)).stream()
                    .map(Enum::name)
                    .toList();
        }

        @Test
        @DisplayName("Below, on and above the threshold all agree")
        void agreesAcrossTheThreshold() {
            List<BigDecimal> values = List.of(
                    new BigDecimal("0"),
                    new BigDecimal("200000"),
                    new BigDecimal("999999"),
                    new BigDecimal("1000000"),   // exactly on — must NOT escalate
                    new BigDecimal("1000001"),
                    new BigDecimal("1100000"),
                    new BigDecimal("50000000"));

            for (BigDecimal value : values) {
                assertEquals(liveChain(value),
                        engine.evaluate(requisitionPolicy(), value).getChain(),
                        "chains diverged at " + value);
            }
        }

        @Test
        @DisplayName("A requisition with no band takes the full chain, in both")
        void agreesOnUnpricedRoles() {
            assertEquals(liveChain(null),
                    engine.evaluate(requisitionPolicy(), null).getChain(),
                    "an unpriced role must route identically under both");
        }

        @Test
        @DisplayName("Exactly on the threshold does not escalate — the boundary the live service sets")
        void boundaryIsExclusive() {
            ApprovalDecision decision = engine.evaluate(requisitionPolicy(), REQUISITION_THRESHOLD);

            assertEquals(List.of("HR_MANAGER"), decision.getChain());
            assertFalse(decision.isEscalated());
            assertEquals(liveChain(REQUISITION_THRESHOLD), decision.getChain());
        }
    }

    // ── Equivalence with the two level-based implementations ────────────────

    @Test
    @DisplayName("Salary recommendations: above R200 000 is level 2, at or below is level 1")
    void reproducesSalaryRule() {
        ApprovalPolicy policy = levelPolicy("SALARY_RECOMMENDATION", "proposed salary", SALARY_THRESHOLD);

        assertEquals(List.of("LEVEL_1"),
                engine.evaluate(policy, new BigDecimal("199999")).getChain());
        assertEquals(List.of("LEVEL_1"),
                engine.evaluate(policy, SALARY_THRESHOLD).getChain(),
                "compareTo(...) > 0 means exactly 200 000 stays at level 1");
        assertEquals(List.of("LEVEL_1", "LEVEL_2"),
                engine.evaluate(policy, new BigDecimal("200001")).getChain());
    }

    @Test
    @DisplayName("Offers: above R150 000 total compensation is level 2")
    void reproducesOfferRule() {
        ApprovalPolicy policy = levelPolicy("OFFER", "total compensation", OFFER_THRESHOLD);

        assertEquals(List.of("LEVEL_1"),
                engine.evaluate(policy, OFFER_THRESHOLD).getChain());
        assertEquals(List.of("LEVEL_1", "LEVEL_2"),
                engine.evaluate(policy, new BigDecimal("150001")).getChain());
    }

    @Test
    @DisplayName("The three thresholds disagree by design, and the engine makes that visible")
    void thresholdsAreInconsistentToday() {
        BigDecimal nineHundredThousand = new BigDecimal("900000");

        ApprovalDecision requisition = engine.evaluate(requisitionPolicy(), nineHundredThousand);
        ApprovalDecision salary = engine.evaluate(
                levelPolicy("SALARY_RECOMMENDATION", "proposed salary", SALARY_THRESHOLD), nineHundredThousand);

        assertFalse(requisition.isEscalated(), "R900k requisition clears HR alone");
        assertTrue(salary.isEscalated(), "the same R900k as a salary recommendation needs level 2");
    }

    // ── Rationale ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("An escalated decision explains itself with the amount and the threshold")
    void escalatedRationaleNamesBothNumbers() {
        String rationale = engine.evaluate(requisitionPolicy(), new BigDecimal("1100000")).getRationale();

        assertTrue(rationale.contains("1 100 000"), rationale);
        assertTrue(rationale.contains("1 000 000"), rationale);
        assertTrue(rationale.contains("EXECUTIVE"), rationale);
    }

    @Test
    @DisplayName("An unpriced record says so rather than reporting a value of zero")
    void unknownValueRationale() {
        ApprovalDecision decision = engine.evaluate(requisitionPolicy(), null);

        assertTrue(decision.getRationale().contains("No band ceiling recorded"), decision.getRationale());
        assertEquals(null, decision.getMeasuredValue(), "absent must not become zero");
    }

    @Test
    @DisplayName("escalateWhenValueUnknown=false keeps an unpriced record on the base chain")
    void unknownValueCanBeConfiguredNotToEscalate() {
        ApprovalPolicy policy = requisitionPolicy();
        policy.setEscalateWhenValueUnknown(false);

        assertEquals(List.of("HR_MANAGER"), engine.evaluate(policy, null).getChain());
    }

    // ── Chain progress ──────────────────────────────────────────────────────

    @Test
    @DisplayName("The next stage is the first uncleared one, and a full chain is complete")
    void tracksProgressThroughTheChain() {
        ApprovalDecision decision = engine.evaluate(requisitionPolicy(), new BigDecimal("1100000"));

        assertEquals("HR_MANAGER", decision.nextStageAfter(List.of()).orElseThrow());
        assertEquals("EXECUTIVE", decision.nextStageAfter(List.of("HR_MANAGER")).orElseThrow());
        assertTrue(decision.isComplete(List.of("HR_MANAGER", "EXECUTIVE")));
        assertFalse(decision.isComplete(List.of("HR_MANAGER")));
    }

    @Test
    @DisplayName("A stage named twice is still one approval")
    void duplicateStagesCollapse() {
        ApprovalPolicy policy = new ApprovalPolicy();
        policy.setAppliesTo("REQUISITION");
        policy.setBaseChain(List.of("HR_MANAGER"));
        policy.setEscalations(List.of(
                new ApprovalPolicy.Escalation(new BigDecimal("100"), List.of("HR_MANAGER", "EXECUTIVE"))));

        assertEquals(List.of("HR_MANAGER", "EXECUTIVE"),
                engine.evaluate(policy, new BigDecimal("500")).getChain());
    }

    @Test
    @DisplayName("Several escalations stack in order")
    void multipleEscalationsStack() {
        ApprovalPolicy policy = new ApprovalPolicy();
        policy.setAppliesTo("REQUISITION");
        policy.setMeasureLabel("band ceiling");
        policy.setBaseChain(List.of("HR_MANAGER"));
        policy.setEscalations(List.of(
                new ApprovalPolicy.Escalation(new BigDecimal("1000000"), List.of("EXECUTIVE")),
                new ApprovalPolicy.Escalation(new BigDecimal("5000000"), List.of("BOARD"))));

        assertEquals(List.of("HR_MANAGER"), engine.evaluate(policy, new BigDecimal("900000")).getChain());
        assertEquals(List.of("HR_MANAGER", "EXECUTIVE"),
                engine.evaluate(policy, new BigDecimal("2000000")).getChain());
        assertEquals(List.of("HR_MANAGER", "EXECUTIVE", "BOARD"),
                engine.evaluate(policy, new BigDecimal("6000000")).getChain());
    }

    // ── Guard rails ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("A policy with no base chain is rejected, not treated as self-approving")
    void emptyChainIsRejected() {
        ApprovalPolicy policy = new ApprovalPolicy();
        policy.setAppliesTo("REQUISITION");

        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class,
                () -> engine.evaluate(policy, BigDecimal.TEN));
        assertTrue(thrown.getMessage().contains("no base chain"), thrown.getMessage());
    }

    @Test
    @DisplayName("A null policy is rejected")
    void nullPolicyIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> engine.evaluate(null, BigDecimal.TEN));
    }

    @Test
    @DisplayName("An escalation with no threshold is ignored, not applied to everything")
    void escalationWithoutThresholdIsIgnored() {
        ApprovalPolicy policy = new ApprovalPolicy();
        policy.setAppliesTo("REQUISITION");
        policy.setBaseChain(List.of("HR_MANAGER"));
        policy.setEscalations(List.of(new ApprovalPolicy.Escalation(null, List.of("EXECUTIVE"))));

        assertEquals(List.of("HR_MANAGER"), engine.evaluate(policy, new BigDecimal("99999999")).getChain());
    }

    // ── Storage round trip ──────────────────────────────────────────────────

    @Test
    @DisplayName("A policy survives a round trip through stepsJson unchanged")
    void roundTripsThroughJson() {
        ApprovalPolicy original = requisitionPolicy();

        ApprovalPolicy restored = engine.parse(engine.serialise(original));

        assertEquals(original.getAppliesTo(), restored.getAppliesTo());
        assertEquals(original.getBaseChain(), restored.getBaseChain());
        assertEquals(1, restored.getEscalations().size());
        assertEquals(0, REQUISITION_THRESHOLD.compareTo(restored.getEscalations().get(0).getAbove()));
        assertEquals(engine.evaluate(original, new BigDecimal("1100000")).getChain(),
                engine.evaluate(restored, new BigDecimal("1100000")).getChain());
    }

    @Test
    @DisplayName("Unreadable steps are rejected rather than defaulting to something permissive")
    void unparseableStepsAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> engine.parse("not json"));
        assertThrows(IllegalArgumentException.class, () -> engine.parse(""));
        assertThrows(IllegalArgumentException.class, () -> engine.parse(null));
    }

    @Test
    @DisplayName("Unknown fields in stored steps do not break an older policy")
    void toleratesUnknownFields() {
        String json = "{\"appliesTo\":\"REQUISITION\",\"baseChain\":[\"HR_MANAGER\"],"
                + "\"escalations\":[{\"above\":1000000,\"addStages\":[\"EXECUTIVE\"],\"note\":\"future field\"}],"
                + "\"somethingAddedLater\":true}";

        ApprovalPolicy policy = engine.parse(json);

        assertEquals(List.of("HR_MANAGER", "EXECUTIVE"),
                engine.evaluate(policy, new BigDecimal("2000000")).getChain());
    }
}
