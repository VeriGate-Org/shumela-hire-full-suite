package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulatedJobBoardConnectorTest {

    private static final Set<String> SIMULATED_TENANTS = Set.of("idc");

    @Mock
    private JobBoardPostingDataRepository repository;

    @Mock
    private AuditLogService auditLogService;

    private SimulatedJobBoardConnector connector;

    @BeforeEach
    void setUp() {
        connector = new SimulatedJobBoardConnector(
                JobBoardType.PNET, repository, auditLogService, SIMULATED_TENANTS);
        TenantContext.setCurrentTenant("idc");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private JobBoardPosting livePosting(String id, LocalDateTime postedAt) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setId(id);
        posting.setJobPostingId("job-1");
        posting.setBoardType(JobBoardType.PNET);
        posting.setStatus(PostingStatus.POSTED);
        posting.setPostedAt(postedAt);
        posting.setExpiresAt(postedAt.plusDays(30));
        return posting;
    }

    @Test
    void postsWithABoardShapedReference() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        JobBoardPosting posting = connector.post("job-1", null);

        assertEquals(PostingStatus.POSTED, posting.getStatus());
        assertTrue(posting.getExternalPostId().startsWith("PNET-"),
                "reference should be recognisable as a PNet one");
        assertNotNull(posting.getPostedAt());
        assertNotNull(posting.getExpiresAt());
    }

    @Test
    void aFreshPostingHasNoEngagementYet() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        JobBoardPosting posting = connector.post("job-1", null);

        assertEquals(0, posting.getViewCount());
        assertEquals(0, posting.getClickCount());
        assertEquals(0, posting.getApplicationCount());
    }

    @Test
    void engagementAccruesWithTimeLive() {
        JobBoardPosting posting = livePosting("p-1", LocalDateTime.now().minusDays(4));

        connector.applyModelledEngagement(posting);

        assertTrue(posting.getViewCount() > 0, "a posting live for four days should have views");
        assertTrue(posting.getClickCount() > 0);
        assertTrue(posting.getViewCount() > posting.getClickCount(),
                "not every view opens the advert");
        assertTrue(posting.getClickCount() >= posting.getApplicationCount(),
                "not everyone who opens it applies");
    }

    @Test
    void engagementIsReproducibleForTheSamePosting() {
        JobBoardPosting first = livePosting("p-1", LocalDateTime.now().minusDays(4));
        JobBoardPosting second = livePosting("p-1", first.getPostedAt());

        connector.applyModelledEngagement(first);
        connector.applyModelledEngagement(second);

        assertEquals(first.getViewCount(), second.getViewCount());
        assertEquals(first.getClickCount(), second.getClickCount());
        assertEquals(first.getApplicationCount(), second.getApplicationCount());
    }

    @Test
    void engagementNeverGoesBackwards() {
        LocalDateTime postedAt = LocalDateTime.now().minusDays(10);
        JobBoardPosting earlier = livePosting("p-1", LocalDateTime.now().minusDays(2));
        JobBoardPosting later = livePosting("p-1", postedAt);

        connector.applyModelledEngagement(earlier);
        connector.applyModelledEngagement(later);

        assertTrue(later.getViewCount() > earlier.getViewCount(),
                "a posting live longer must not report fewer views");
    }

    @Test
    void twoPostingsDoNotReportIdenticalFigures() {
        LocalDateTime postedAt = LocalDateTime.now().minusDays(6);
        JobBoardPosting a = livePosting("posting-alpha", postedAt);
        JobBoardPosting b = livePosting("posting-beta", postedAt);

        connector.applyModelledEngagement(a);
        connector.applyModelledEngagement(b);

        assertNotEquals(a.getViewCount(), b.getViewCount(),
                "two adverts published together should not look copy-pasted");
    }

    @Test
    void anExpiredPostingStopsAccruingEngagement() {
        JobBoardPosting posting = livePosting("p-1", LocalDateTime.now().minusDays(60));
        // expiresAt is postedAt + 30 days, so this one has been dead for 30 days.
        when(repository.findById("p-1")).thenReturn(Optional.of(posting));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        JobBoardPosting synced = connector.sync("p-1");
        int atExpiry = synced.getViewCount();

        connector.applyModelledEngagement(synced);

        assertEquals(PostingStatus.EXPIRED, synced.getStatus());
        assertEquals(atExpiry, synced.getViewCount(),
                "engagement should stop at the expiry date, not keep climbing");
    }

    @Test
    void syncLeavesARemovedPostingAlone() {
        JobBoardPosting posting = livePosting("p-1", LocalDateTime.now().minusDays(3));
        posting.setStatus(PostingStatus.REMOVED);
        when(repository.findById("p-1")).thenReturn(Optional.of(posting));

        JobBoardPosting synced = connector.sync("p-1");

        assertEquals(PostingStatus.REMOVED, synced.getStatus());
        verify(repository, never()).save(any());
    }

    @Test
    void removeTakesThePostingDown() {
        JobBoardPosting posting = livePosting("p-1", LocalDateTime.now().minusDays(3));
        when(repository.findById("p-1")).thenReturn(Optional.of(posting));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        JobBoardPosting removed = connector.remove("p-1");

        assertEquals(PostingStatus.REMOVED, removed.getStatus());
        verify(auditLogService).saveLog(eq("SYSTEM"), eq("REMOVE_POSTING"),
                eq("JOB_BOARD_POSTING"), eq("p-1"), anyString());
    }

    @ParameterizedTest
    @CsvSource({
            "PNET,            PNET-",
            "CAREER_JUNCTION, CJ-",
            "LINKEDIN,        LI-",
            "INDEED,          IND-",
    })
    void eachBoardMintsItsOwnReferenceShape(JobBoardType boardType, String expectedPrefix) {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var board = new SimulatedJobBoardConnector(
                boardType, repository, auditLogService, SIMULATED_TENANTS);
        JobBoardPosting posting = board.post("job-1", null);

        // seed-idc-job-board-postings.py reproduces these, so a seeded row and
        // one published live during a demonstration look identical. Changing a
        // shape here means changing it there too.
        assertEquals(boardType, posting.getBoardType());
        assertTrue(posting.getExternalPostId().startsWith(expectedPrefix),
                () -> posting.getExternalPostId() + " should start with " + expectedPrefix);
    }

    @ParameterizedTest
    @CsvSource({"PNET", "CAREER_JUNCTION", "LINKEDIN", "INDEED"})
    void publishesNoLinkToAnAdvertThatDoesNotExist(JobBoardType boardType) {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var board = new SimulatedJobBoardConnector(
                boardType, repository, auditLogService, SIMULATED_TENANTS);
        JobBoardPosting posting = board.post("job-1", null);

        // Any URL built for a sandbox posting resolves to the board's own
        // not-found page. The UI renders its "View" button only when a URL is
        // present, so the absence removes the affordance instead of offering a
        // dead link into a third party's site beside a green Published badge.
        assertNull(posting.getExternalUrl(),
                () -> boardType + " must not link to an advert it did not create");
    }

    @Test
    void isEnabledOnlyForATenantOnTheAllowList() {
        TenantContext.setCurrentTenant("idc");
        assertTrue(connector.isEnabled());
    }

    @Test
    void isNotEnabledForAnotherTenantOnTheSameDeployment() {
        // The point of the allow-list: a paying tenant sharing this deployment
        // must keep the honest manual-posting behaviour.
        TenantContext.setCurrentTenant("uthukela");
        assertFalse(connector.isEnabled());
    }

    @Test
    void isNotEnabledWithNoTenantInContext() {
        TenantContext.clear();
        assertFalse(connector.isEnabled());
    }

    @Test
    void anEmptyAllowListSimulatesForNobody() {
        var noTenants = new SimulatedJobBoardConnector(
                JobBoardType.PNET, repository, auditLogService, Set.of());

        TenantContext.setCurrentTenant("idc");

        assertFalse(noTenants.isEnabled(),
                "board mode alone must not be enough to simulate");
    }
}
