package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.service.DelegationMatrixService;
import com.arthmatic.shumelahire.service.DelegationMatrixService.ApprovalStage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Built against a real {@link DelegationMatrixService} rather than hand-written chains, so the
 * response cannot claim a routing the delegation matrix would not produce.
 */
class RequisitionRoutingResponseTest {

    private static final BigDecimal THRESHOLD = new BigDecimal("1000000");
    private final DelegationMatrixService delegation = new DelegationMatrixService(THRESHOLD);

    private RequisitionRoutingResponse routingFor(BigDecimal ceiling,
                                                  Requisition.RequisitionStatus status) {
        Requisition requisition = new Requisition();
        requisition.setSalaryMax(ceiling);
        requisition.setStatus(status);
        return RequisitionRoutingResponse.of(
                requisition,
                delegation.requiredChain(requisition),
                delegation.routingRationale(requisition),
                delegation.pendingStage(requisition));
    }

    @Test
    @DisplayName("Within the delegation: HR only, not escalated, and the rationale says so")
    void withinDelegation() {
        RequisitionRoutingResponse routing =
                routingFor(new BigDecimal("800000"), Requisition.RequisitionStatus.PENDING_HR_APPROVAL);

        assertEquals(List.of("HR_MANAGER"), routing.getChain());
        assertFalse(routing.isEscalated());
        assertEquals("HR_MANAGER", routing.getCurrentStage());
        assertTrue(routing.getRationale().contains("within"), routing.getRationale());
    }

    @Test
    @DisplayName("Above the threshold: the executive joins, and escalated is true")
    void aboveThreshold() {
        RequisitionRoutingResponse routing =
                routingFor(new BigDecimal("1100000"), Requisition.RequisitionStatus.PENDING_EXECUTIVE_APPROVAL);

        assertEquals(List.of("HR_MANAGER", "EXECUTIVE"), routing.getChain());
        assertTrue(routing.isEscalated());
        assertEquals("EXECUTIVE", routing.getCurrentStage());
        assertTrue(routing.getRationale().contains("exceeds"), routing.getRationale());
    }

    @Test
    @DisplayName("Exactly on the threshold does not escalate")
    void exactlyOnThreshold() {
        RequisitionRoutingResponse routing =
                routingFor(THRESHOLD, Requisition.RequisitionStatus.PENDING_HR_APPROVAL);

        assertEquals(List.of("HR_MANAGER"), routing.getChain());
        assertFalse(routing.isEscalated());
    }

    @Test
    @DisplayName("An unpriced requisition takes the full chain and reports no measured value")
    void unpricedTakesFullChain() {
        RequisitionRoutingResponse routing =
                routingFor(null, Requisition.RequisitionStatus.PENDING_HR_APPROVAL);

        assertEquals(List.of("HR_MANAGER", "EXECUTIVE"), routing.getChain());
        assertTrue(routing.isEscalated());
        assertNull(routing.getMeasuredValue(), "no band recorded must not surface as zero");
        assertTrue(routing.getRationale().contains("No salary band"), routing.getRationale());
    }

    @Test
    @DisplayName("A requisition not awaiting anyone has no current stage")
    void noCurrentStageWhenNotPending() {
        RequisitionRoutingResponse approved =
                routingFor(new BigDecimal("800000"), Requisition.RequisitionStatus.APPROVED);
        RequisitionRoutingResponse draft =
                routingFor(new BigDecimal("800000"), Requisition.RequisitionStatus.DRAFT);

        assertNull(approved.getCurrentStage());
        assertNull(draft.getCurrentStage());
        // The chain is still reported: what it had to clear is worth knowing after the fact.
        assertEquals(List.of("HR_MANAGER"), approved.getChain());
    }

    @Test
    @DisplayName("The measured value is the band ceiling, which is what routing was decided on")
    void measuredValueIsTheCeiling() {
        RequisitionRoutingResponse routing =
                routingFor(new BigDecimal("1450000"), Requisition.RequisitionStatus.PENDING_EXECUTIVE_APPROVAL);

        assertEquals(0, new BigDecimal("1450000").compareTo(routing.getMeasuredValue()));
    }
}
