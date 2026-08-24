package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.repository.AuditLogDataRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * The audit search must cover the whole log, not the page the console happens to hold.
 *
 * <p><strong>The defect this guards.</strong> The admin console filtered the fifty entries it had
 * already been given. On the IDC tenant that meant typing {@code ESCALAT} — the search that
 * produces the requisition escalation, the governance record the audit trail exists to hold —
 * returned <b>zero results</b>, because those three entries had aged onto page six of ten. Nothing
 * on screen said the search had only looked at fifty rows out of 475, so an empty table read as
 * "there is no such record". For an audit trail that is the worst possible failure: silent, and
 * indistinguishable from evidence of absence.</p>
 *
 * <p>The fixture below is the real shape of the problem — the escalation sits well beyond the
 * first page, so any implementation that searches only page one fails these tests.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Audit log search — whole log, not one page")
class AuditLogSearchTest {

    @Mock
    private AuditLogDataRepository auditLogRepository;

    @InjectMocks
    private AuditLogService service;

    private static AuditLog log(String action, String user, String role, String details, LocalDateTime at) {
        AuditLog l = new AuditLog();
        l.setAction(action);
        l.setUserName(user);
        l.setUserRole(role);
        l.setDetails(details);
        l.setEntityType("REQUISITION");
        l.setTimestamp(at);
        return l;
    }

    /** 300 recent entries, with the June escalation buried far beyond page one. */
    private List<AuditLog> tenantLog() {
        List<AuditLog> all = new ArrayList<>();
        LocalDateTime recent = LocalDateTime.of(2026, 8, 24, 12, 0);
        for (int i = 0; i < 300; i++) {
            all.add(log("INTERVIEW_RESCHEDULED", "Yolanda Gaba", "HIRING_MANAGER",
                    "routine activity " + i, recent.minusMinutes(i)));
        }
        all.add(log("REQUISITION_ESCALATED_TO_EXECUTIVE", "Thandi Nkosi", "HR_MANAGER",
                "Risk Manager - SALARY ceiling R1,100,000 exceeds the R1,000,000 HR delegation threshold.",
                LocalDateTime.of(2026, 6, 22, 9, 15, 32)));
        all.add(log("REQUISITION_PENDING_EXECUTIVE_REVIEW", "Nomsa Mabaso", "EXECUTIVE",
                "Risk Manager - Received for executive approval on salary escalation.",
                LocalDateTime.of(2026, 6, 22, 9, 16, 5)));
        return all;
    }

    @Test
    @DisplayName("ESCALAT finds the June escalation even though it is 300 entries down")
    void findsEscalationBeyondTheFirstPage() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        Page<AuditLog> result = service.searchLogs("ESCALAT", PageRequest.of(0, 50));

        assertEquals(2, result.getTotalElements(),
                "both escalation entries must be found — they are past page one, which is the whole bug");
        assertTrue(result.getContent().stream()
                        .anyMatch(l -> "REQUISITION_ESCALATED_TO_EXECUTIVE".equals(l.getAction())),
                "the escalation itself must be in the results");
    }

    @Test
    @DisplayName("Underscores read as spaces, so the screen text finds the stored value")
    void matchesTheTextTheConsoleDisplays() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        // The console renders REQUISITION_ESCALATED_TO_EXECUTIVE as "REQUISITION ESCALATED TO
        // EXECUTIVE". Searching for what is on screen has to work.
        Page<AuditLog> spaced = service.searchLogs("escalated to executive", PageRequest.of(0, 50));
        assertEquals(1, spaced.getTotalElements(), "spaced form must match the underscored value");

        Page<AuditLog> underscored = service.searchLogs("ESCALATED_TO_EXECUTIVE", PageRequest.of(0, 50));
        assertEquals(1, underscored.getTotalElements(), "underscored form must match too");
    }

    @Test
    @DisplayName("A person's name is searchable, not only the action")
    void searchesUserName() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        Page<AuditLog> result = service.searchLogs("Nomsa", PageRequest.of(0, 50));
        assertEquals(1, result.getTotalElements(), "userName must be searchable");
        assertEquals("Nomsa Mabaso", result.getContent().get(0).getUserName());
    }

    @Test
    @DisplayName("The detail payload is searchable — SALARY finds the escalation reasoning")
    void searchesDetails() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        Page<AuditLog> result = service.searchLogs("R1,100,000", PageRequest.of(0, 50));
        assertEquals(1, result.getTotalElements(), "the detail text must be searchable");
    }

    @Test
    @DisplayName("Results are newest first, so paging a search is stable")
    void resultsAreNewestFirst() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        Page<AuditLog> result = service.searchLogs("Risk Manager", PageRequest.of(0, 50));
        List<AuditLog> rows = result.getContent();
        assertEquals(2, rows.size());
        assertTrue(rows.get(0).getTimestamp().isAfter(rows.get(1).getTimestamp()),
                "newest first — the same order the unsearched view uses");
    }

    @Test
    @DisplayName("A blank search is not a search — it falls through to the normal page")
    void blankSearchIsNotASearch() {
        when(auditLogRepository.findAll(PageRequest.of(0, 50)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(), PageRequest.of(0, 50), 0));

        service.searchLogs("   ", PageRequest.of(0, 50));
        service.searchLogs(null, PageRequest.of(0, 50));

        // Delegating means the console can send the parameter unconditionally.
        org.mockito.Mockito.verify(auditLogRepository, org.mockito.Mockito.times(2))
                .findAll(PageRequest.of(0, 50));
    }

    @Test
    @DisplayName("A term that genuinely matches nothing still returns nothing")
    void noFalsePositives() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        Page<AuditLog> result = service.searchLogs("zzz-no-such-entry", PageRequest.of(0, 50));
        assertEquals(0, result.getTotalElements());
        assertFalse(result.hasContent());
    }

    @Test
    @DisplayName("Matches spanning more than one page are paged, not truncated")
    void pagesThroughMatches() {
        when(auditLogRepository.findAll()).thenReturn(tenantLog());

        Page<AuditLog> first = service.searchLogs("INTERVIEW", PageRequest.of(0, 50));
        assertEquals(300, first.getTotalElements(), "the count is every match, not the page size");
        assertEquals(50, first.getContent().size());
        assertEquals(6, first.getTotalPages());

        Page<AuditLog> last = service.searchLogs("INTERVIEW", PageRequest.of(5, 50));
        assertEquals(50, last.getContent().size(), "the final page of matches is reachable");
    }
}
