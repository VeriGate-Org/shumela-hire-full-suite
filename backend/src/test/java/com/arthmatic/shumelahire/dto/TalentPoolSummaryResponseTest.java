package com.arthmatic.shumelahire.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Counts across every pool.
 *
 * <p>The figure these exist for is <b>growing unattended</b>: a pool that adds a person on every
 * rejection while nobody opens it. Either condition on its own is a choice; together they are a
 * shortlist quietly turning into a rejection log.
 */
class TalentPoolSummaryResponseTest {

    private static TalentPoolResponse pool(String id, boolean active, boolean autoAdd,
                                           Long medianDays, long held) {
        TalentPoolResponse pool = new TalentPoolResponse();
        pool.setId(id);
        pool.setIsActive(active);
        pool.setAutoAddEnabled(autoAdd);
        pool.setMedianEntryAgeDays(medianDays);
        pool.setEntryCount(held);
        return pool;
    }

    @Test
    @DisplayName("Growing unattended needs both auto-add and a stale median")
    void growingUnattendedNeedsBoth() {
        var summary = TalentPoolSummaryResponse.from(List.of(
                pool("both", true, true, 500L, 147),        // auto-adding and stale
                pool("stale-only", true, false, 600L, 63),  // stale, but somebody chose every entry
                pool("auto-only", true, true, 40L, 38),     // auto-adding, but current
                pool("neither", true, false, 30L, 27)));

        assertEquals(1, summary.getGrowingUnattended());
        assertEquals(2, summary.getStale());
        assertEquals(2, summary.getAutoAdding());
    }

    @Test
    @DisplayName("Stale is measured at the threshold, not past it")
    void staleIncludesTheBoundary() {
        var summary = TalentPoolSummaryResponse.from(List.of(
                pool("on-the-line", true, false,
                        (long) TalentPoolSummaryResponse.STALE_POOL_DAYS, 10),
                pool("just-inside", true, false,
                        TalentPoolSummaryResponse.STALE_POOL_DAYS - 1L, 10)));

        assertEquals(1, summary.getStale());
    }

    @Test
    @DisplayName("An empty pool is not stale — there is nothing in it to go off")
    void emptyPoolIsNotStale() {
        var summary = TalentPoolSummaryResponse.from(List.of(
                pool("empty", true, true, null, 0)));

        assertEquals(0, summary.getStale());
        assertEquals(0, summary.getGrowingUnattended());
        assertEquals(1, summary.getAutoAdding());
        assertNull(summary.getOldestMedianDays());
    }

    @Test
    @DisplayName("A switched-off pool still counts, because it still holds people")
    void inactivePoolsStayVisible() {
        // isActive = false does not delete the entries. An inactive pool holding 200 people is a
        // retention question as much as a recruitment one.
        var summary = TalentPoolSummaryResponse.from(List.of(
                pool("off", false, false, 200L, 41),
                pool("on", true, false, 30L, 27)));

        assertEquals(2, summary.getPools());
        assertEquals(1, summary.getInactive());
        assertEquals(1, summary.getActive());
        assertEquals(68, summary.getEntriesHeld());
    }

    @Test
    @DisplayName("A pool with no isActive flag is read as active, not as switched off")
    void nullActiveIsActive() {
        TalentPoolResponse unset = pool("unset", true, false, 10L, 1);
        unset.setIsActive(null);

        var summary = TalentPoolSummaryResponse.from(List.of(unset));

        assertEquals(1, summary.getActive());
        assertEquals(0, summary.getInactive());
    }

    @Test
    @DisplayName("The worst pool is named so it can be acted on")
    void oldestMedianIsIdentified() {
        var summary = TalentPoolSummaryResponse.from(List.of(
                pool("recent", true, false, 60L, 10),
                pool("worst", true, true, 520L, 147),
                pool("middling", true, false, 240L, 30)));

        assertEquals(520L, summary.getOldestMedianDays());
        assertEquals("worst", summary.getOldestMedianPoolId());
    }

    @Test
    @DisplayName("No pools at all reports zeroes and no median")
    void emptySet() {
        var summary = TalentPoolSummaryResponse.from(List.of());

        assertEquals(0, summary.getPools());
        assertEquals(0, summary.getEntriesHeld());
        assertNull(summary.getOldestMedianDays());
        assertNull(summary.getOldestMedianPoolId());
    }
}
