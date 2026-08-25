package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * The internal opportunities board, as an employee needs to read it.
 *
 * <p><b>Closed roles are included on purpose.</b> {@code GET /ads/internal} returns
 * {@code findActiveInternalAdsPaged}, which drops anything past its closing date — so a role an
 * employee remembers seeing last week simply vanishes, and the board looks emptier than the
 * organisation actually is. Showing it greyed out for a fortnight explains where it went.
 *
 * <p><b>Counts are whole-set.</b> The existing endpoint is paged, so counting the loaded page would
 * be the page-scoped mistake again. Worth noting separately: that endpoint builds its
 * {@code PageImpl} with {@code content.size()} as the total, so its {@code totalElements} already
 * reports the page size rather than the number of ads.
 */
public class InternalJobBoardResponse {

    /**
     * How long a closed role stays on the board.
     *
     * <p>A fortnight. Long enough that somebody returning after a week's leave can see what they
     * missed, short enough that the board does not become an archive.
     */
    public static final int CLOSED_VISIBLE_DAYS = 14;

    /** How near a closing date must be to count as closing soon. */
    public static final int CLOSING_SOON_DAYS = 7;

    private List<JobAdResponse> roles = new ArrayList<>();

    /** Open to internal applicants right now. */
    private long open;

    /** Open, and closing within {@link #CLOSING_SOON_DAYS}. */
    private long closingSoon;

    /** Closed within the last fortnight and still shown. */
    private long recentlyClosed;

    /**
     * Open roles that are also advertised externally.
     *
     * <p>Competing only against colleagues is a materially different proposition from competing
     * against the open market, and an employee deciding whether to apply deserves the count.
     */
    private long alsoExternal;

    /** Open roles that publish no salary band. Reported rather than rendered as a blank. */
    private long withoutBand;

    public static InternalJobBoardResponse from(List<JobAd> internalAds, LocalDate today) {
        InternalJobBoardResponse board = new InternalJobBoardResponse();
        if (internalAds == null) {
            return board;
        }

        List<JobAd> visible = new ArrayList<>();

        for (JobAd ad : internalAds) {
            if (!Boolean.TRUE.equals(ad.getChannelInternal())) {
                continue;
            }
            // A draft or an unpublished ad was never open to anybody, so it does not belong on a
            // board an employee reads.
            if (ad.getStatus() != JobAdStatus.PUBLISHED && ad.getStatus() != JobAdStatus.EXPIRED) {
                continue;
            }

            LocalDate closing = ad.getClosingDate();
            boolean closed = ad.getStatus() == JobAdStatus.EXPIRED
                    || (closing != null && closing.isBefore(today));

            if (closed) {
                // Only recently — the board is not an archive. An ad with no closing date cannot be
                // shown to have closed recently, so it is left off rather than guessed at.
                if (closing == null || ChronoUnit.DAYS.between(closing, today) > CLOSED_VISIBLE_DAYS) {
                    continue;
                }
                board.recentlyClosed++;
                visible.add(ad);
                continue;
            }

            board.open++;
            if (Boolean.TRUE.equals(ad.getChannelExternal())) {
                board.alsoExternal++;
            }
            if (ad.getSalaryRangeMin() == null || ad.getSalaryRangeMax() == null) {
                board.withoutBand++;
            }
            if (closing != null && ChronoUnit.DAYS.between(today, closing) <= CLOSING_SOON_DAYS) {
                board.closingSoon++;
            }
            visible.add(ad);
        }

        // Closing soonest first — on a board somebody visits occasionally, the only urgent fact is
        // what is about to close. Roles with no closing date sort after those that have one; a
        // missing deadline is not an imminent one.
        visible.sort(Comparator
                .comparing((JobAd ad) -> ad.getClosingDate() == null)
                .thenComparing(JobAd::getClosingDate, Comparator.nullsLast(Comparator.naturalOrder())));

        board.roles = visible.stream().map(JobAdResponse::fromEntity).toList();
        return board;
    }

    public List<JobAdResponse> getRoles() { return roles; }
    public void setRoles(List<JobAdResponse> roles) { this.roles = roles; }

    public long getOpen() { return open; }
    public void setOpen(long open) { this.open = open; }

    public long getClosingSoon() { return closingSoon; }
    public void setClosingSoon(long closingSoon) { this.closingSoon = closingSoon; }

    public long getRecentlyClosed() { return recentlyClosed; }
    public void setRecentlyClosed(long recentlyClosed) { this.recentlyClosed = recentlyClosed; }

    public long getAlsoExternal() { return alsoExternal; }
    public void setAlsoExternal(long alsoExternal) { this.alsoExternal = alsoExternal; }

    public long getWithoutBand() { return withoutBand; }
    public void setWithoutBand(long withoutBand) { this.withoutBand = withoutBand; }
}
