package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.VerificationRequirementsRequest;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers configuring the one requirement the pipeline actually enforces.
 *
 * <p>The rule existed and could not be switched on. {@code enforceCheckCompletion} and
 * {@code requiredCheckTypes} live on the requisition, are settable only through the create/update
 * path, and that path refuses an approved or published posting — {@code canBeEdited()} allows
 * {@code DRAFT} and {@code REJECTED} only. So on a live vacancy the gate could not be turned on at
 * all, and it was false on all nineteen IDC postings. These cover the dedicated endpoint that fixes
 * that without opening the rest of the record.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JobPostingVerificationRequirementsTest {

    @Mock private JobPostingDataRepository jobPostingRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private JobAdSyncService jobAdSyncService;
    @Mock private NotificationService notificationService;
    @Mock private RequisitionDataRepository requisitionRepository;
    @Mock private UserDataRepository userRepository;
    @Mock private ObjectProvider<BackgroundCheckService> backgroundCheckProvider;
    @Mock private BackgroundCheckService backgroundCheckService;

    private JobPostingService service;
    private JobPosting published;

    private static Map<String, Object> code(String c) {
        return Map.of("code", c, "name", c);
    }

    @BeforeEach
    void setUp() {
        service = new JobPostingService(jobPostingRepository, auditLogService, jobAdSyncService,
                notificationService, requisitionRepository, userRepository, backgroundCheckProvider);

        published = new JobPosting();
        published.setId("posting-1");
        published.setTitle("Project Manager");
        published.setStatus(JobPostingStatus.PUBLISHED);
        published.setEnforceCheckCompletion(false);

        when(jobPostingRepository.findById("posting-1")).thenReturn(Optional.of(published));
        when(jobPostingRepository.save(any(JobPosting.class))).thenAnswer(i -> i.getArgument(0));
        when(backgroundCheckProvider.getIfAvailable()).thenReturn(backgroundCheckService);
        when(backgroundCheckService.getAvailableCheckTypes()).thenReturn(List.of(
                code("CRIMINAL_CHECK"), code("QUALIFICATION_VERIFICATION"), code("CREDIT_CHECK")));
    }

    @Test
    @DisplayName("requirements can be set on a PUBLISHED requisition — the whole point")
    void setsRequirementsOnALiveRequisition() {
        assertFalse(published.canBeEdited(), "precondition: the general edit path refuses this posting");

        service.updateVerificationRequirements("posting-1",
                new VerificationRequirementsRequest(true, List.of("CRIMINAL_CHECK", "QUALIFICATION_VERIFICATION")),
                "hr-manager-1");

        assertTrue(published.getEnforceCheckCompletion());
        assertEquals("[\"CRIMINAL_CHECK\",\"QUALIFICATION_VERIFICATION\"]", published.getRequiredCheckTypes());
    }

    @Test
    @DisplayName("an unknown check code is refused, not stored")
    void refusesAnUnknownCheckCode() {
        // A typo is unsatisfiable by construction: no check of that type can ever complete, so every
        // candidate on the requisition would sit blocked at Background Check with no way to clear it.
        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class, () ->
                service.updateVerificationRequirements("posting-1",
                        new VerificationRequirementsRequest(true, List.of("CRIMINAL_CHEK")),
                        "hr-manager-1"));

        assertTrue(thrown.getMessage().contains("CRIMINAL_CHEK"), thrown.getMessage());
        verify(jobPostingRepository, never()).save(any(JobPosting.class));
    }

    @Test
    @DisplayName("enforcement with nothing to check is refused — it would imply a control that is not there")
    void refusesEnforcementWithNoChecks() {
        assertThrows(IllegalArgumentException.class, () ->
                service.updateVerificationRequirements("posting-1",
                        new VerificationRequirementsRequest(true, List.of()),
                        "hr-manager-1"));

        verify(jobPostingRepository, never()).save(any(JobPosting.class));
    }

    @Test
    @DisplayName("switching enforcement off is recorded with what it was before")
    void auditsBeforeAndAfter() {
        published.setEnforceCheckCompletion(true);
        published.setRequiredCheckTypes("[\"CRIMINAL_CHECK\"]");

        service.updateVerificationRequirements("posting-1",
                new VerificationRequirementsRequest(false, List.of("CRIMINAL_CHECK")),
                "admin-1");

        ArgumentCaptor<String> detail = ArgumentCaptor.forClass(String.class);
        // The entity id is now part of the call — without it this row could never be retrieved
        // for the posting it describes.
        verify(auditLogService).logUserAction(eq("admin-1"),
                eq("JOB_POSTING_VERIFICATION_REQUIREMENTS_UPDATED"), eq("JOB_POSTING"), anyString(),
                detail.capture());

        // "Who relaxed the control, and from what" is the auditor's question. "Changed" is not an answer.
        assertTrue(detail.getValue().contains("enforcement on -> off"), detail.getValue());
        assertTrue(detail.getValue().contains("Project Manager"), detail.getValue());
    }

    @Test
    @DisplayName("duplicates are collapsed rather than stored twice")
    void collapsesDuplicates() {
        service.updateVerificationRequirements("posting-1",
                new VerificationRequirementsRequest(true, List.of("CREDIT_CHECK", "CREDIT_CHECK")),
                "hr-manager-1");

        assertEquals("[\"CREDIT_CHECK\"]", published.getRequiredCheckTypes());
    }

    @Test
    @DisplayName("with no verification provider wired in, configuration still works")
    void toleratesAnAbsentProvider() {
        // The provider is feature-flagged. An absent one must not stop a requisition being set up
        // for the day it is present.
        when(backgroundCheckProvider.getIfAvailable()).thenReturn(null);

        service.updateVerificationRequirements("posting-1",
                new VerificationRequirementsRequest(true, List.of("ANYTHING")),
                "hr-manager-1");

        assertTrue(published.getEnforceCheckCompletion());
    }

    @Test
    @DisplayName("a missing requisition is not found, not a server error")
    void unknownPostingIsRejected() {
        when(jobPostingRepository.findById("nope")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.updateVerificationRequirements("nope",
                        new VerificationRequirementsRequest(true, List.of("CREDIT_CHECK")), "admin-1"));
    }

    @Test
    @DisplayName("clearing the requirements leaves an empty list, not null")
    void clearingLeavesAnEmptyList() {
        published.setRequiredCheckTypes("[\"CREDIT_CHECK\"]");
        published.setEnforceCheckCompletion(true);

        service.updateVerificationRequirements("posting-1",
                new VerificationRequirementsRequest(false, null), "admin-1");

        assertEquals("[]", published.getRequiredCheckTypes());
        assertFalse(published.getEnforceCheckCompletion());
        verify(auditLogService).logUserAction(anyString(), anyString(), anyString(), anyString(), anyString());
    }
}
