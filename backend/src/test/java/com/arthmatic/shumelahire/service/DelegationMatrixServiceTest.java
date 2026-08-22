package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.service.DelegationMatrixService.ApprovalStage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers the behaviour Schedule 3 of RFP T31-06-26 describes: that approval authority is determined
 * by the value of the requisition, not applied uniformly.
 */
class DelegationMatrixServiceTest {

    private static final BigDecimal THRESHOLD = new BigDecimal("1000000");

    private DelegationMatrixService service;

    @BeforeEach
    void setUp() {
        service = new DelegationMatrixService(THRESHOLD);
    }

    private Requisition requisition(String salaryMax, RequisitionStatus status) {
        Requisition r = new Requisition();
        r.setJobTitle("Test Role");
        r.setSalaryMax(salaryMax == null ? null : new BigDecimal(salaryMax));
        r.setStatus(status);
        return r;
    }

    @Test
    @DisplayName("A role above the threshold requires executive approval as well as HR")
    void aboveThresholdRequiresExecutive() {
        Requisition riskManager = requisition("1100000", RequisitionStatus.DRAFT);

        assertEquals(
                java.util.List.of(ApprovalStage.HR_MANAGER, ApprovalStage.EXECUTIVE),
                service.requiredChain(riskManager));
    }

    @Test
    @DisplayName("A role within the HR delegation requires HR approval only")
    void belowThresholdIsHrOnly() {
        Requisition analyst = requisition("800000", RequisitionStatus.DRAFT);

        assertEquals(java.util.List.of(ApprovalStage.HR_MANAGER), service.requiredChain(analyst));
    }

    @Test
    @DisplayName("A role exactly on the threshold stays within the HR delegation")
    void thresholdIsInclusiveOfHrOnly() {
        Requisition onBoundary = requisition("1000000", RequisitionStatus.DRAFT);

        assertEquals(java.util.List.of(ApprovalStage.HR_MANAGER), service.requiredChain(onBoundary));
    }

    @Test
    @DisplayName("A requisition with no salary band requires the full chain, not the shortest one")
    void unpricedRoleRequiresFullChain() {
        Requisition unpriced = requisition(null, RequisitionStatus.DRAFT);

        assertEquals(
                java.util.List.of(ApprovalStage.HR_MANAGER, ApprovalStage.EXECUTIVE),
                service.requiredChain(unpriced));
    }

    @Test
    @DisplayName("Approving HR on a below-threshold role completes it, without escalating")
    void belowThresholdTerminatesAtHr() {
        Requisition analyst = requisition("800000", RequisitionStatus.PENDING_HR_APPROVAL);

        assertEquals(RequisitionStatus.APPROVED,
                service.statusAfterApproval(analyst, ApprovalStage.HR_MANAGER));
    }

    @Test
    @DisplayName("Approving HR on an above-threshold role escalates to the executive")
    void aboveThresholdEscalatesAfterHr() {
        Requisition riskManager = requisition("1100000", RequisitionStatus.PENDING_HR_APPROVAL);

        assertEquals(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
                service.statusAfterApproval(riskManager, ApprovalStage.HR_MANAGER));
    }

    @Test
    @DisplayName("Approving the executive stage completes the requisition")
    void executiveApprovalCompletes() {
        Requisition riskManager = requisition("1100000", RequisitionStatus.PENDING_EXECUTIVE_APPROVAL);

        assertEquals(RequisitionStatus.APPROVED,
                service.statusAfterApproval(riskManager, ApprovalStage.EXECUTIVE));
    }

    @Test
    @DisplayName("Pending stage is derived from status, and is absent once approved")
    void pendingStageDerivation() {
        assertEquals(ApprovalStage.HR_MANAGER,
                service.pendingStage(requisition("500000", RequisitionStatus.PENDING_HR_APPROVAL)));
        assertEquals(ApprovalStage.EXECUTIVE,
                service.pendingStage(requisition("900000", RequisitionStatus.PENDING_EXECUTIVE_APPROVAL)));
        assertNull(service.pendingStage(requisition("500000", RequisitionStatus.APPROVED)));
        assertNull(service.pendingStage(requisition("500000", RequisitionStatus.DRAFT)));
    }

    @Test
    @DisplayName("Routing decisions are explainable, citing the band and the threshold")
    void rationaleNamesBandAndThreshold() {
        String high = service.routingRationale(requisition("1100000", RequisitionStatus.DRAFT));
        assertTrue(high.contains("1100000"), "should cite the band ceiling: " + high);
        assertTrue(high.contains("1000000"), "should cite the threshold: " + high);
        assertTrue(high.toLowerCase().contains("executive"), "should name the outcome: " + high);

        String low = service.routingRationale(requisition("800000", RequisitionStatus.DRAFT));
        assertTrue(low.toLowerCase().contains("hr approval only"), "should name the outcome: " + low);
    }
}
