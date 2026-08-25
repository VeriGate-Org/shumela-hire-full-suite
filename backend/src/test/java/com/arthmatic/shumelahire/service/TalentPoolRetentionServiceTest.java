package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.entity.TalentPoolEntry;
import com.arthmatic.shumelahire.repository.TalentPoolEntryDataRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Talent pool retention.
 *
 * <p>This is the only scheduled task in the system that <b>destroys personal data</b>, so the tests
 * that matter are the ones proving it does nothing it should not. Deleting a candidate's history a
 * year early cannot be undone; deleting it a year late is a compliance gap somebody can still close.
 *
 * <p>The retention period itself is a decision for the client, not for this code — see
 * {@code docs/TALENT-POOL-RETENTION-DECISION.md}. Until it is set, everything here is inert, and
 * that is the first thing pinned below.
 */
class TalentPoolRetentionServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 25);

    private TalentPoolEntryDataRepository entryRepository;
    private NotificationService notificationService;
    private TalentPoolRetentionService service;
    private List<TalentPoolEntry> stored;

    @BeforeEach
    void setUp() {
        stored = new ArrayList<>();
        entryRepository = Mockito.mock(TalentPoolEntryDataRepository.class);
        notificationService = Mockito.mock(NotificationService.class);
        when(entryRepository.findAll()).thenReturn(stored);
        when(entryRepository.save(any(TalentPoolEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        service = new TalentPoolRetentionService(entryRepository, notificationService);
        configure(24, 30, true);
    }

    private void configure(int months, int noticeDays, boolean purgeEnabled) {
        ReflectionTestUtils.setField(service, "retentionMonths", months);
        ReflectionTestUtils.setField(service, "noticeDays", noticeDays);
        ReflectionTestUtils.setField(service, "purgeEnabled", purgeEnabled);
    }

    private TalentPoolEntry entry(String id, LocalDate retainUntil, LocalDateTime noticeSentAt) {
        Applicant applicant = new Applicant();
        applicant.setId("applicant-" + id);
        applicant.setName("Candidate " + id);
        applicant.setEmail(id + "@example.com");

        TalentPool pool = new TalentPool();
        pool.setPoolName("Engineering");

        TalentPoolEntry e = new TalentPoolEntry();
        e.setId(id);
        e.setApplicant(applicant);
        e.setTalentPool(pool);
        e.setAddedAt(LocalDateTime.of(2024, 1, 1, 9, 0));
        e.setRetainUntil(retainUntil);
        e.setRetentionNoticeSentAt(noticeSentAt);
        stored.add(e);
        when(entryRepository.findById(id)).thenReturn(Optional.of(e));
        return e;
    }

    // ── Inert until somebody decides ─────────────────────────────────────────

    @Test
    @DisplayName("With no retention period set, nothing expires and nothing is deleted")
    void inertUntilConfigured() {
        // The default state of every deployment. A purge running on a period nobody agreed is the
        // failure this whole design is arranged to prevent.
        configure(0, 30, true);
        entry("e1", TODAY.minusYears(5), LocalDateTime.of(2020, 1, 1, 9, 0));

        assertFalse(service.isConfigured());
        assertEquals(0, service.sendRetentionNotices(TODAY));
        assertEquals(0, service.purgeExpiredEntries(TODAY));
        verify(entryRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("A negative or zero period is treated as unset, not as delete-everything")
    void misconfigurationFailsSafe() {
        configure(-12, 30, true);
        entry("e1", TODAY.minusYears(5), LocalDateTime.of(2020, 1, 1, 9, 0));

        assertFalse(service.isConfigured());
        assertEquals(0, service.purgeExpiredEntries(TODAY));
    }

    @Test
    @DisplayName("No retention date is stamped while no period is configured")
    void noRetentionDateWithoutAPeriod() {
        configure(0, 30, false);
        TalentPoolEntry e = new TalentPoolEntry();
        e.setAddedAt(LocalDateTime.of(2026, 1, 1, 9, 0));

        service.applyRetention(e);

        assertNull(e.getRetainUntil());
    }

    // ── Computing the date ───────────────────────────────────────────────────

    @Test
    @DisplayName("Retention runs from last contact when there is one")
    void retentionRunsFromLastContact() {
        TalentPoolEntry e = new TalentPoolEntry();
        e.setAddedAt(LocalDateTime.of(2024, 1, 1, 9, 0));
        e.setLastContactedAt(LocalDateTime.of(2026, 3, 1, 9, 0));

        assertEquals(LocalDate.of(2028, 3, 1), service.retainUntilFor(e));
    }

    @Test
    @DisplayName("Retention falls back to when they were added")
    void retentionFallsBackToAddedAt() {
        // The state of an entry nobody has engaged with since it was created.
        TalentPoolEntry e = new TalentPoolEntry();
        e.setAddedAt(LocalDateTime.of(2024, 1, 1, 9, 0));

        assertEquals(LocalDate.of(2026, 1, 1), service.retainUntilFor(e));
    }

    @Test
    @DisplayName("An entry with no dates at all is retained, not aged")
    void undatedEntryIsRetained() {
        // A missing timestamp is a data fault, not a licence to delete.
        TalentPoolEntry e = new TalentPoolEntry();
        e.setAddedAt(null);

        assertNull(service.retainUntilFor(e));
    }

    // ── Nothing is deleted without notice ────────────────────────────────────

    @Test
    @DisplayName("An expired entry that has never been warned is notified, not deleted")
    void expiredButUnwarnedIsNotified() {
        entry("e1", TODAY.minusDays(1), null);

        assertEquals(0, service.purgeExpiredEntries(TODAY));
        verify(entryRepository, never()).deleteById(anyString());

        assertEquals(1, service.sendRetentionNotices(TODAY));
        verify(notificationService).notifyTalentPoolRetentionExpiring(any(), anyInt());
    }

    @Test
    @DisplayName("A null retention date never expires, however old the entry")
    void nullRetentionNeverExpires() {
        // Every entry written before a policy existed carries null. Reading that as "due" would
        // delete the entire pool base on the first run.
        entry("e1", null, null);

        assertEquals(0, service.entriesDueNotice(TODAY).size());
        assertEquals(0, service.entriesDuePurge(TODAY).size());
    }

    @Test
    @DisplayName("A candidate is not warned twice")
    void noticeIsSentOnce() {
        entry("e1", TODAY.minusDays(1), LocalDateTime.now());

        assertEquals(0, service.sendRetentionNotices(TODAY));
        verify(notificationService, never()).notifyTalentPoolRetentionExpiring(any(), anyInt());
    }

    @Test
    @DisplayName("A failed notice does not start the deletion clock")
    void failedNoticeIsNotStamped() {
        // Stamping before the send succeeds would begin a grace period on a warning that never
        // arrived, and the candidate would be deleted having been told nothing.
        TalentPoolEntry e = entry("e1", TODAY.minusDays(1), null);
        Mockito.doThrow(new IllegalStateException("mailbox unreachable"))
                .when(notificationService).notifyTalentPoolRetentionExpiring(any(), anyInt());

        assertEquals(0, service.sendRetentionNotices(TODAY));
        assertNull(e.getRetentionNoticeSentAt());
    }

    // ── The grace period ─────────────────────────────────────────────────────

    @Test
    @DisplayName("The grace period is measured from the notice, not from the expiry date")
    void graceRunsFromTheNotice() {
        // A candidate warned yesterday about a date that passed a year ago still gets their full
        // window. Measuring from retainUntil would delete them the moment they were told.
        entry("e1", TODAY.minusYears(1), TODAY.minusDays(1).atStartOfDay());

        assertEquals(0, service.purgeExpiredEntries(TODAY));
        verify(entryRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("An entry is deleted once its notice period has run out")
    void deletedAfterGrace() {
        entry("e1", TODAY.minusYears(1), TODAY.minusDays(30).atStartOfDay());

        assertEquals(1, service.purgeExpiredEntries(TODAY));
        verify(entryRepository).deleteById("e1");
    }

    @Test
    @DisplayName("Recording contact pushes the date out and clears the warning")
    void contactExtendsRetention() {
        // The other half of the notice: a candidate who answers stays, and is warned again next
        // time rather than deleted on the strength of a warning they responded to.
        TalentPoolEntry e = entry("e1", TODAY.minusDays(1), TODAY.minusDays(2).atStartOfDay());

        service.recordContact("e1");

        assertTrue(e.getRetainUntil().isAfter(TODAY.plusYears(1)));
        assertNull(e.getRetentionNoticeSentAt());
    }

    // ── Engagement inferred from what a candidate actually does ──────────────

    @Test
    @DisplayName("Engagement extends every pool the candidate is in")
    void engagementExtendsAllPools() {
        // A candidate is often in several pools. Extending only one would leave the others
        // warning and deleting somebody the organisation is actively hiring.
        TalentPoolEntry a = entry("e1", TODAY.minusDays(1), TODAY.minusDays(2).atStartOfDay());
        TalentPoolEntry b = entry("e2", TODAY.minusDays(1), null);
        when(entryRepository.findByApplicantId("applicant-e1")).thenReturn(List.of(a, b));

        assertEquals(2, service.recordEngagement("applicant-e1", "submitted an application"));
        assertTrue(a.getRetainUntil().isAfter(TODAY.plusYears(1)));
        assertTrue(b.getRetainUntil().isAfter(TODAY.plusYears(1)));
    }

    @Test
    @DisplayName("Engagement clears a notice already sent")
    void engagementClearsTheWarning() {
        // Otherwise a candidate who reapplies is still deleted at the end of a grace period that
        // started before they did.
        TalentPoolEntry a = entry("e1", TODAY.minusDays(1), TODAY.minusDays(2).atStartOfDay());
        when(entryRepository.findByApplicantId("applicant-e1")).thenReturn(List.of(a));

        service.recordEngagement("applicant-e1", "shortlisted");

        assertNull(a.getRetentionNoticeSentAt());
    }

    @Test
    @DisplayName("Sending a retention notice is not itself engagement")
    void theNoticeDoesNotResetItsOwnClock() {
        // The trap that would quietly disable the whole feature. If "we sent them an email" counted
        // as contact, the notice would push its own deadline out on every run and nothing would
        // ever be deleted — while every log line said the policy was working.
        TalentPoolEntry e = entry("e1", TODAY.minusDays(1), null);
        LocalDate before = e.getRetainUntil();

        assertEquals(1, service.sendRetentionNotices(TODAY));

        assertEquals(before, e.getRetainUntil());
        assertNotNull(e.getRetentionNoticeSentAt());
        verify(entryRepository, never()).findByApplicantId(anyString());
    }

    @Test
    @DisplayName("An entry already removed from a pool is not resurrected by engagement elsewhere")
    void removedEntriesAreLeftAlone() {
        TalentPoolEntry removed = entry("e1", TODAY.minusDays(1), null);
        removed.setRemovedAt(LocalDateTime.now().minusDays(5));
        when(entryRepository.findByApplicantId("applicant-e1")).thenReturn(List.of(removed));

        assertEquals(0, service.recordEngagement("applicant-e1", "submitted an application"));
    }

    @Test
    @DisplayName("A failure to extend retention never breaks the thing the candidate was doing")
    void engagementFailureIsSwallowed() {
        // This runs inside application submission. A retention date that cannot be written must not
        // fail somebody's job application.
        when(entryRepository.findByApplicantId("applicant-e1"))
                .thenThrow(new IllegalStateException("repository unavailable"));

        assertEquals(0, service.recordEngagement("applicant-e1", "submitted an application"));
    }

    @Test
    @DisplayName("Engagement does nothing while no period is configured")
    void engagementRespectsTheSwitch() {
        configure(0, 30, true);

        assertEquals(0, service.recordEngagement("applicant-e1", "shortlisted"));
        verify(entryRepository, never()).findByApplicantId(anyString());
    }

    @Test
    @DisplayName("A missing applicant id is not an error")
    void engagementWithoutAnApplicantId() {
        assertEquals(0, service.recordEngagement(null, "shortlisted"));
        assertEquals(0, service.recordEngagement("  ", "shortlisted"));
    }

    // ── Reaching entries that predate the policy ─────────────────────────────

    @Test
    @DisplayName("Entries with no retention date are stamped, so the policy reaches them")
    void backfillStampsExistingEntries() {
        // Without this the policy would only ever apply to entries created after it was switched
        // on — and the oldest records, which are exactly what it exists for, would be the only ones
        // it never touched.
        TalentPoolEntry old = entry("e1", null, null);
        old.setAddedAt(LocalDateTime.of(2023, 1, 1, 9, 0));

        assertEquals(1, service.backfillRetentionDates());
        assertEquals(LocalDate.of(2025, 1, 1), old.getRetainUntil());
    }

    @Test
    @DisplayName("Backfilling does not delete anyone, however overdue they are")
    void backfillIsNotADeletion() {
        // The first run after enabling a policy must not be able to delete. A backfilled entry is
        // due a notice, and only then does its grace period start.
        TalentPoolEntry old = entry("e1", null, null);
        old.setAddedAt(LocalDateTime.of(2015, 1, 1, 9, 0));

        service.backfillRetentionDates();

        assertEquals(0, service.purgeExpiredEntries(TODAY));
        verify(entryRepository, never()).deleteById(anyString());
        assertEquals(1, service.entriesDueNotice(TODAY).size());
    }

    @Test
    @DisplayName("Backfilling leaves an already-stamped date alone")
    void backfillDoesNotOverwrite() {
        // Recording contact pushes a date out. A nightly backfill must not drag it back.
        TalentPoolEntry e = entry("e1", TODAY.plusYears(2), null);

        assertEquals(0, service.backfillRetentionDates());
        assertEquals(TODAY.plusYears(2), e.getRetainUntil());
    }

    @Test
    @DisplayName("An entry with no dates at all is not given an invented one")
    void backfillSkipsUndatedEntries() {
        TalentPoolEntry e = entry("e1", null, null);
        e.setAddedAt(null);

        assertEquals(0, service.backfillRetentionDates());
        assertNull(e.getRetainUntil());
    }

    @Test
    @DisplayName("Backfilling does nothing while no period is configured")
    void backfillRespectsTheSwitch() {
        configure(0, 30, true);
        TalentPoolEntry e = entry("e1", null, null);

        assertEquals(0, service.backfillRetentionDates());
        assertNull(e.getRetainUntil());
    }

    // ── The second switch ────────────────────────────────────────────────────

    @Test
    @DisplayName("With purging disabled, due entries are reported and kept")
    void purgingCanBeHeldOff() {
        // Lets a deployment run notices for a full cycle and see what the policy would do, before
        // anything is destroyed.
        configure(24, 30, false);
        entry("e1", TODAY.minusYears(1), TODAY.minusDays(60).atStartOfDay());

        assertEquals(1, service.entriesDuePurge(TODAY).size());
        assertEquals(0, service.purgeExpiredEntries(TODAY));
        verify(entryRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("The preview reports what would happen and changes nothing")
    void previewIsReadOnly() {
        entry("due-notice", TODAY.minusDays(1), null);
        entry("due-purge", TODAY.minusYears(1), TODAY.minusDays(60).atStartOfDay());

        Map<String, Object> preview = service.previewRetention(TODAY);

        assertEquals(1, preview.get("wouldNotify"));
        assertEquals(1, preview.get("wouldDelete"));
        assertEquals(2, preview.get("totalEntries"));
        assertEquals(true, preview.get("configured"));
        verify(entryRepository, never()).deleteById(anyString());
        verify(entryRepository, never()).save(any());
        verify(notificationService, never()).notifyTalentPoolRetentionExpiring(any(), anyInt());
    }

    @Test
    @DisplayName("One undeletable entry does not stop the rest")
    void oneFailureDoesNotAbortThePurge() {
        entry("bad", TODAY.minusYears(1), TODAY.minusDays(60).atStartOfDay());
        entry("good", TODAY.minusYears(1), TODAY.minusDays(60).atStartOfDay());
        Mockito.doThrow(new IllegalStateException("locked")).when(entryRepository).deleteById("bad");

        assertEquals(1, service.purgeExpiredEntries(TODAY));
        verify(entryRepository).deleteById("good");
    }
}
