package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.entity.TalentPoolEntry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * What a talent pool contains.
 *
 * <p>None of this was ever on the wire: the endpoint returned the raw entity, so a pool's own eleven
 * fields and nothing about the people in it. These pin the two figures the page is organised
 * around — how many are held, and how old they are.
 */
class TalentPoolResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 25, 12, 0);

    private static TalentPool pool() {
        TalentPool pool = new TalentPool();
        pool.setId("p1");
        pool.setPoolName("Rejected — Investment Analyst");
        pool.setIsActive(true);
        pool.setAutoAddEnabled(true);
        return pool;
    }

    private static TalentPoolEntry entry(String source, LocalDateTime addedAt) {
        TalentPoolEntry entry = new TalentPoolEntry();
        entry.setSourceType(source);
        entry.setAddedAt(addedAt);
        return entry;
    }

    private static TalentPoolEntry removed(LocalDateTime addedAt, LocalDateTime removedAt) {
        TalentPoolEntry entry = entry("MANUAL", addedAt);
        entry.setRemovedAt(removedAt);
        return entry;
    }

    @Test
    @DisplayName("Counts the people held and splits them by how they got in")
    void countsAndSourceSplit() {
        var response = TalentPoolResponse.from(pool(), List.of(
                entry("AUTO_REJECTED", NOW.minusDays(30)),
                entry("AUTO_REJECTED", NOW.minusDays(60)),
                entry("MANUAL", NOW.minusDays(10)),
                entry("AGENCY", NOW.minusDays(5))), NOW);

        assertEquals(4, response.getEntryCount());
        assertEquals(2L, response.getBySource().get("AUTO_REJECTED"));
        assertEquals(1L, response.getBySource().get("MANUAL"));
        assertEquals(1L, response.getBySource().get("AGENCY"));
    }

    @Test
    @DisplayName("A removed entry is not held, and is not silently forgotten either")
    void removedEntriesAreSeparate() {
        // Soft-deleted with a removedAt and a reason. Rolling the two together would either
        // overstate the pool or hide that anyone was ever taken out of it.
        var response = TalentPoolResponse.from(pool(), List.of(
                entry("MANUAL", NOW.minusDays(10)),
                removed(NOW.minusDays(400), NOW.minusDays(5))), NOW);

        assertEquals(1, response.getEntryCount());
        assertEquals(1, response.getRemovedCount());
        // The removed entry's age must not drag the median of what is actually held.
        assertEquals(10L, response.getMedianEntryAgeDays());
    }

    @Test
    @DisplayName("The median takes the lower of two central values, not their average")
    void medianOnAnEvenCount() {
        // Same convention as RequisitionSummaryResponse.medianDaysToApproval, so the two cannot be
        // read as different kinds of median.
        var response = TalentPoolResponse.from(pool(), List.of(
                entry("MANUAL", NOW.minusDays(10)),
                entry("MANUAL", NOW.minusDays(20)),
                entry("MANUAL", NOW.minusDays(30)),
                entry("MANUAL", NOW.minusDays(40))), NOW);

        assertEquals(20L, response.getMedianEntryAgeDays());
    }

    @Test
    @DisplayName("One very old entry does not drag a current pool's median")
    void medianResistsAnOutlier() {
        var response = TalentPoolResponse.from(pool(), List.of(
                entry("MANUAL", NOW.minusDays(5)),
                entry("MANUAL", NOW.minusDays(7)),
                entry("MANUAL", NOW.minusDays(1200))), NOW);

        assertEquals(7L, response.getMedianEntryAgeDays());
        assertEquals(NOW.minusDays(1200), response.getOldestEntryAt());
    }

    @Test
    @DisplayName("An empty pool reports no median rather than a zero")
    void emptyPoolHasNoMedian() {
        // Zero days would read as "everyone was added today", which is the opposite of the truth.
        var response = TalentPoolResponse.from(pool(), List.of(), NOW);

        assertEquals(0, response.getEntryCount());
        assertNull(response.getMedianEntryAgeDays());
        assertNull(response.getOldestEntryAt());
        assertNull(response.getLastAddedAt());
    }

    @Test
    @DisplayName("An entry with no added date is held but counted out of the age figures")
    void entriesWithoutADateAreReported() {
        // Defaulting a missing date to now would claim the person was added today.
        var response = TalentPoolResponse.from(pool(), List.of(
                entry("MANUAL", null),
                entry("MANUAL", NOW.minusDays(90))), NOW);

        assertEquals(2, response.getEntryCount());
        assertEquals(1, response.getEntriesWithoutDate());
        assertEquals(90L, response.getMedianEntryAgeDays());
    }

    @Test
    @DisplayName("An entry with no source type is counted as unknown, not dropped")
    void missingSourceIsUnknown() {
        var response = TalentPoolResponse.from(pool(),
                List.of(entry(null, NOW.minusDays(3))), NOW);

        assertEquals(1, response.getEntryCount());
        assertEquals(1L, response.getBySource().get("UNKNOWN"));
    }

    @Test
    @DisplayName("Oldest and newest bracket the pool")
    void oldestAndNewestAreReported() {
        var response = TalentPoolResponse.from(pool(), List.of(
                entry("MANUAL", NOW.minusDays(500)),
                entry("MANUAL", NOW.minusDays(2)),
                entry("MANUAL", NOW.minusDays(100))), NOW);

        assertEquals(NOW.minusDays(500), response.getOldestEntryAt());
        assertEquals(NOW.minusDays(2), response.getLastAddedAt());
    }

    @Test
    @DisplayName("Whether anyone is still available is not returned at all")
    void availabilityIsNotExposed() {
        // isAvailable defaults to true and no service ever sets it false, so returning it would
        // assert that everyone in every pool is available. Asserted here so that anyone adding it
        // later has to delete a test that says why not.
        var methods = java.util.Arrays.stream(TalentPoolResponse.class.getMethods())
                .map(java.lang.reflect.Method::getName)
                .filter(name -> name.toLowerCase().contains("available"))
                .toList();

        assertEquals(List.of(), methods);
    }
}
