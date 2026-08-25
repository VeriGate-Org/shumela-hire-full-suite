package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * The internal opportunities board.
 *
 * <p>What these pin is the thing {@code GET /ads/internal} could not do: show an employee the role
 * they remember seeing last week. That endpoint returns active ads only, so a closed role vanishes
 * and the board looks emptier than the organisation is.
 */
class InternalJobBoardResponseTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 25);

    private static JobAd ad(String id, JobAdStatus status, LocalDate closing,
                            boolean internal, boolean external) {
        JobAd ad = new JobAd();
        ad.setId(id);
        ad.setTitle(id);
        ad.setStatus(status);
        ad.setClosingDate(closing);
        ad.setChannelInternal(internal);
        ad.setChannelExternal(external);
        ad.setSalaryRangeMin(new BigDecimal("650000"));
        ad.setSalaryRangeMax(new BigDecimal("800000"));
        return ad;
    }

    @Test
    @DisplayName("A role closed last week is still on the board")
    void recentlyClosedRolesStay() {
        var board = InternalJobBoardResponse.from(List.of(
                ad("open", JobAdStatus.PUBLISHED, TODAY.plusDays(5), true, false),
                ad("closed-recently", JobAdStatus.EXPIRED, TODAY.minusDays(7), true, false)), TODAY);

        assertEquals(2, board.getRoles().size());
        assertEquals(1, board.getOpen());
        assertEquals(1, board.getRecentlyClosed());
    }

    @Test
    @DisplayName("A role closed months ago is not — the board is not an archive")
    void longClosedRolesDrop() {
        var board = InternalJobBoardResponse.from(List.of(
                ad("ancient", JobAdStatus.EXPIRED, TODAY.minusDays(90), true, false)), TODAY);

        assertEquals(0, board.getRoles().size());
        assertEquals(0, board.getRecentlyClosed());
    }

    @Test
    @DisplayName("A published role past its closing date counts as closed")
    void pastDeadlineIsClosedEvenIfStillPublished() {
        // The status may not have caught up; the date is the fact.
        var board = InternalJobBoardResponse.from(List.of(
                ad("stale", JobAdStatus.PUBLISHED, TODAY.minusDays(2), true, false)), TODAY);

        assertEquals(1, board.getRecentlyClosed());
        assertEquals(0, board.getOpen());
    }

    @Test
    @DisplayName("Closing soonest first, and a role with no closing date sorts after those that have one")
    void sortedByClosingDate() {
        // A missing deadline is not an imminent one.
        var board = InternalJobBoardResponse.from(List.of(
                ad("no-date", JobAdStatus.PUBLISHED, null, true, false),
                ad("later", JobAdStatus.PUBLISHED, TODAY.plusDays(37), true, false),
                ad("sooner", JobAdStatus.PUBLISHED, TODAY.plusDays(5), true, false)), TODAY);

        assertEquals(List.of("sooner", "later", "no-date"),
                board.getRoles().stream().map(JobAdResponse::getTitle).toList());
    }

    @Test
    @DisplayName("Roles also advertised externally are counted")
    void externalRolesAreCounted() {
        // Competing against colleagues and competing against the open market are different
        // propositions, and the employee deciding whether to apply deserves to know which.
        var board = InternalJobBoardResponse.from(List.of(
                ad("internal-only", JobAdStatus.PUBLISHED, TODAY.plusDays(5), true, false),
                ad("both", JobAdStatus.PUBLISHED, TODAY.plusDays(5), true, true)), TODAY);

        assertEquals(1, board.getAlsoExternal());
        assertEquals(2, board.getOpen());
    }

    @Test
    @DisplayName("Closing soon is counted inside open, not beside it")
    void closingSoonIsASubsetOfOpen() {
        var board = InternalJobBoardResponse.from(List.of(
                ad("urgent", JobAdStatus.PUBLISHED, TODAY.plusDays(3), true, false),
                ad("relaxed", JobAdStatus.PUBLISHED, TODAY.plusDays(60), true, false)), TODAY);

        assertEquals(2, board.getOpen());
        assertEquals(1, board.getClosingSoon());
    }

    @Test
    @DisplayName("A role with no published band is counted, not hidden")
    void unpublishedBandIsCounted() {
        JobAd noBand = ad("no-band", JobAdStatus.PUBLISHED, TODAY.plusDays(22), true, false);
        noBand.setSalaryRangeMin(null);
        noBand.setSalaryRangeMax(null);

        var board = InternalJobBoardResponse.from(List.of(noBand), TODAY);

        assertEquals(1, board.getWithoutBand());
        assertEquals(1, board.getRoles().size());
    }

    @Test
    @DisplayName("An externally-only advert never appears on an internal board")
    void externalOnlyIsExcluded() {
        var board = InternalJobBoardResponse.from(List.of(
                ad("external-only", JobAdStatus.PUBLISHED, TODAY.plusDays(5), false, true)), TODAY);

        assertEquals(0, board.getRoles().size());
    }

    @Test
    @DisplayName("Drafts and unpublished ads were never open to anybody")
    void unpublishedIsExcluded() {
        var board = InternalJobBoardResponse.from(List.of(
                ad("draft", JobAdStatus.DRAFT, TODAY.plusDays(5), true, false),
                ad("pulled", JobAdStatus.UNPUBLISHED, TODAY.plusDays(5), true, false)), TODAY);

        assertEquals(0, board.getRoles().size());
    }

    @Test
    @DisplayName("A closed role with no closing date is left off rather than guessed at")
    void closedWithoutDateIsExcluded() {
        // Nothing says when it closed, so nothing can say it closed recently.
        var board = InternalJobBoardResponse.from(List.of(
                ad("undated", JobAdStatus.EXPIRED, null, true, false)), TODAY);

        assertEquals(0, board.getRoles().size());
    }

    @Test
    @DisplayName("An empty board reports zeroes without throwing")
    void emptyBoard() {
        var board = InternalJobBoardResponse.from(List.of(), TODAY);

        assertEquals(0, board.getOpen());
        assertEquals(0, board.getRoles().size());
    }
}
