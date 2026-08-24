package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers the audit trail a requisition leaves behind.
 *
 * <p>It left none. {@code RequisitionService} carried no call to {@code AuditLogService} at all, so
 * of the 467 audit entries on the IDC tenant not one had {@code entityType = REQUISITION} — raising,
 * amending, submitting, approving and rejecting a requisition were entirely unrecorded. The audit
 * tab on a requisition was therefore correct and empty, which reads to a reviewer exactly like a
 * broken screen.</p>
 *
 * <p>The entity id is asserted on every event, not just the entity type. The five-argument
 * {@code saveLog} sets it; the four-argument overload beside it looks identical at a call site and
 * passes {@code null}, which is how 402 of those 467 entries ended up unable to name the record they
 * describe. An audit entry that cannot identify its subject cannot be queried by subject.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RequisitionAuditTest {

    private static final String REQ_ID = "1581aca9-9785-4901-95c7-ea3e32da8516";
    private static final String ACTOR_ID = "efc4d38d-9df6-486a-9efe-1add4850a951";

    @Mock
    private RequisitionDataRepository requisitionRepository;

    @Mock
    private AuditLogService auditLogService;

    private RequisitionService service;

    @BeforeEach
    void setUp() {
        service = new RequisitionService();
        ReflectionTestUtils.setField(service, "requisitionRepository", requisitionRepository);
        ReflectionTestUtils.setField(service, "auditLogService", auditLogService);
        // The real delegation matrix, not a mock: the routing rationale it produces is the
        // governance content of the submit entry, and a stub would assert nothing about it.
        ReflectionTestUtils.setField(service, "delegationMatrixService",
                new DelegationMatrixService(new BigDecimal("1000000")));

        when(requisitionRepository.save(any(Requisition.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private Requisition requisition(String salaryMax, RequisitionStatus status) {
        Requisition r = new Requisition();
        r.setId(REQ_ID);
        r.setJobTitle("Risk Manager");
        r.setDepartment("Enterprise Risk Management");
        r.setSalaryMin(new BigDecimal("800000"));
        r.setSalaryMax(new BigDecimal(salaryMax));
        r.setStatus(status);
        return r;
    }

    /** The single audit call made during the test. */
    private AuditCall captureAudit() {
        ArgumentCaptor<String> userId = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> action = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> entityType = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> entityId = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> details = ArgumentCaptor.forClass(String.class);

        verify(auditLogService).saveLog(userId.capture(), action.capture(), entityType.capture(),
                entityId.capture(), details.capture());

        return new AuditCall(userId.getValue(), action.getValue(), entityType.getValue(),
                entityId.getValue(), details.getValue());
    }

    private record AuditCall(String userId, String action, String entityType, String entityId,
                             String details) {}

    private void assertAddressable(AuditCall call) {
        assertEquals("REQUISITION", call.entityType(),
                "the UI queries /api/audit/entity/REQUISITION/{id}; any other value is invisible to it");
        assertEquals(REQ_ID, call.entityId(),
                "an entry with a null entity id cannot be found by the record it describes");
    }

    @Test
    @DisplayName("Raising a requisition is recorded against the requisition")
    void createIsAudited() {
        Requisition req = requisition("1100000", RequisitionStatus.DRAFT);
        req.setCreatedBy(ACTOR_ID);

        service.create(req);

        AuditCall call = captureAudit();
        assertAddressable(call);
        assertEquals("REQUISITION_CREATED", call.action());
        assertEquals(ACTOR_ID, call.userId());
        assertTrue(call.details().contains("Risk Manager"), "the entry should name the role");
    }

    @Test
    @DisplayName("Submission records why the requisition routed where it did")
    void submitRecordsTheRoutingRationale() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("1100000", RequisitionStatus.DRAFT)));

        service.submit(REQ_ID, ACTOR_ID, "Yolanda Gaba");

        AuditCall call = captureAudit();
        assertAddressable(call);
        assertEquals("REQUISITION_SUBMITTED", call.action());
        assertEquals(ACTOR_ID, call.userId());
        assertTrue(call.details().contains("Yolanda Gaba"), "the entry should name the actor");
        // A R1.1m ceiling is above the R1m delegation threshold. That the entry says so is the
        // point of auditing a submission at all — the escalation is the governance event.
        assertTrue(call.details().contains("1000000") || call.details().toLowerCase().contains("executive"),
                "the entry must carry the routing rationale, not just the fact of submission: " + call.details());
    }

    @Test
    @DisplayName("An approval records the stage and the status it moved between")
    void approveRecordsBeforeAndAfter() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("1100000", RequisitionStatus.PENDING_HR_APPROVAL)));

        service.approve(REQ_ID, ACTOR_ID, "Thandi Nkosi", "Band confirmed against the approved structure.");

        AuditCall call = captureAudit();
        assertAddressable(call);
        assertEquals("REQUISITION_APPROVED", call.action());
        assertTrue(call.details().contains("PENDING_HR_APPROVAL"), "the status before the approval");
        assertTrue(call.details().contains("PENDING_EXECUTIVE_APPROVAL"), "the status after it");
        assertTrue(call.details().contains("Band confirmed"), "the approver's comment");
    }

    @Test
    @DisplayName("A rejection is recorded, with the stage it was rejected at")
    void rejectIsAudited() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("1100000", RequisitionStatus.PENDING_EXECUTIVE_APPROVAL)));

        service.reject(REQ_ID, ACTOR_ID, "Thabo Molefe", "Not funded this cycle.");

        AuditCall call = captureAudit();
        assertAddressable(call);
        assertEquals("REQUISITION_REJECTED", call.action());
        assertTrue(call.details().contains("EXECUTIVE"), "the stage it was rejected at");
        assertTrue(call.details().contains("Not funded"), "the reason given");
    }

    @Test
    @DisplayName("An amendment records the old and new value, not just that something changed")
    void updateRecordsBeforeAndAfter() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("950000", RequisitionStatus.DRAFT)));

        Requisition amended = requisition("1100000", RequisitionStatus.DRAFT);
        amended.setJobTitle("Senior Risk Manager");

        service.update(REQ_ID, amended, ACTOR_ID);

        AuditCall call = captureAudit();
        assertAddressable(call);
        assertEquals("REQUISITION_UPDATED", call.action());
        assertTrue(call.details().contains("950000") && call.details().contains("1100000"),
                "a band moved across the delegation threshold is the amendment an auditor looks for: "
                        + call.details());
        assertTrue(call.details().contains("Senior Risk Manager"), "the new job title");
    }

    @Test
    @DisplayName("An amendment that changes nothing says so rather than claiming a change")
    void updateWithNoChangesSaysSo() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("950000", RequisitionStatus.DRAFT)));

        service.update(REQ_ID, requisition("950000", RequisitionStatus.DRAFT), ACTOR_ID);

        assertTrue(captureAudit().details().contains("no field values changed"));
    }

    @Test
    @DisplayName("A band restated as 950000.00 is not reported as an amendment")
    void equivalentAmountsAreNotAChange() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("950000", RequisitionStatus.DRAFT)));

        service.update(REQ_ID, requisition("950000.00", RequisitionStatus.DRAFT), ACTOR_ID);

        assertTrue(captureAudit().details().contains("no field values changed"),
                "BigDecimal.equals distinguishes scale; comparing by equals invents amendments");
    }

    @Test
    @DisplayName("A deletion names the requisition that went")
    void deleteIsAudited() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("1100000", RequisitionStatus.DRAFT)));

        service.delete(REQ_ID, ACTOR_ID);

        AuditCall call = captureAudit();
        assertAddressable(call);
        assertEquals("REQUISITION_DELETED", call.action());
        assertTrue(call.details().contains("Risk Manager"),
                "after the delete the id resolves to nothing, so the entry must carry the description");
        verify(requisitionRepository).deleteById(REQ_ID);
    }

    @Test
    @DisplayName("An audit failure does not undo the approval it was recording")
    void auditFailureDoesNotRollBackTheApproval() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("1100000", RequisitionStatus.PENDING_HR_APPROVAL)));
        doThrow(new RuntimeException("DynamoDB unavailable"))
                .when(auditLogService).saveLog(anyString(), anyString(), anyString(), anyString(), anyString());

        Requisition result = service.approve(REQ_ID, ACTOR_ID, "Thandi Nkosi", null);

        assertNotNull(result, "the approval must stand even when its record could not be written");
        assertEquals(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL, result.getStatus());
        verify(requisitionRepository, times(1)).save(any(Requisition.class));
    }

    @Test
    @DisplayName("An unattributed action is recorded as SYSTEM, never as a null actor")
    void missingActorIsNamedSystem() {
        when(requisitionRepository.findById(REQ_ID))
                .thenReturn(Optional.of(requisition("800000", RequisitionStatus.DRAFT)));

        service.submit(REQ_ID);

        assertEquals("SYSTEM", captureAudit().userId());
    }
}
