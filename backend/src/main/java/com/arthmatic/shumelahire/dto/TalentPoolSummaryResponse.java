package com.arthmatic.shumelahire.dto;

import java.util.List;

/**
 * Counts across every talent pool.
 *
 * <p>The failure this exists to catch is specific: <b>a pool that fills itself and nobody reads</b>.
 * {@code autoAddEnabled} means the pool grows on every rejection without anyone deciding to add
 * someone; combined with an old median entry age, that is a shortlist accumulating people who have
 * long since taken other jobs, presented as a bench.
 */
public class TalentPoolSummaryResponse {

    /**
     * How old a pool's median entry may be before the pool is called stale.
     *
     * <p>Twelve months. A year-old shortlist is a mailing list: the people in it have moved, their
     * salary expectations have moved, and several are no longer looking. One constant so changing
     * the judgement is one edit rather than a search.
     */
    public static final int STALE_POOL_DAYS = 365;

    /** Pools on file, active or not. */
    private long pools;

    /** {@code isActive} true. A pool switched off still holds its people — see {@link #inactive}. */
    private long active;

    /**
     * Switched off, still holding candidate data.
     *
     * <p>Kept visible on purpose. {@code isActive = false} does not delete the entries, so an
     * inactive pool is a retention question as much as a recruitment one.
     */
    private long inactive;

    /** {@code autoAddEnabled} true — grows on every matching rejection, unattended. */
    private long autoAdding;

    /** Median entry age at or past {@link #STALE_POOL_DAYS}. */
    private long stale;

    /**
     * Auto-adding <b>and</b> stale — filling itself while nobody reads it.
     *
     * <p>The headline. Either condition alone is a choice; together they are a pool quietly turning
     * into a rejection log.
     */
    private long growingUnattended;

    /**
     * Entries held across all pools.
     *
     * <p><b>Entries, not people.</b> Somebody in three pools is three entries here. Counting
     * distinct applicants would need every entry's applicant id compared across pools, which the
     * pool-level aggregate does not carry — so this is named for what it actually measures rather
     * than labelled "people held" and quietly overstated.
     */
    private long entriesHeld;

    /** The oldest median across the pools, in days, or null if no pool holds anybody. */
    private Long oldestMedianDays;

    /** That pool's id, so a caller can link straight to it. */
    private String oldestMedianPoolId;

    public static TalentPoolSummaryResponse from(List<TalentPoolResponse> pools) {
        TalentPoolSummaryResponse summary = new TalentPoolSummaryResponse();
        if (pools == null) {
            return summary;
        }

        for (TalentPoolResponse pool : pools) {
            summary.pools++;

            // A null isActive is treated as active: the column defaults to true on the entity, and
            // reading absence as "switched off" would hide a live pool.
            if (Boolean.FALSE.equals(pool.getIsActive())) {
                summary.inactive++;
            } else {
                summary.active++;
            }

            boolean autoAdding = Boolean.TRUE.equals(pool.getAutoAddEnabled());
            if (autoAdding) {
                summary.autoAdding++;
            }

            summary.entriesHeld += pool.getEntryCount();

            Long median = pool.getMedianEntryAgeDays();
            if (median == null) {
                // An empty pool has no median and is not stale — there is nothing in it to go off.
                continue;
            }

            if (median >= STALE_POOL_DAYS) {
                summary.stale++;
                if (autoAdding) {
                    summary.growingUnattended++;
                }
            }

            if (summary.oldestMedianDays == null || median > summary.oldestMedianDays) {
                summary.oldestMedianDays = median;
                summary.oldestMedianPoolId = pool.getId();
            }
        }

        return summary;
    }

    public long getPools() { return pools; }
    public void setPools(long pools) { this.pools = pools; }

    public long getActive() { return active; }
    public void setActive(long active) { this.active = active; }

    public long getInactive() { return inactive; }
    public void setInactive(long inactive) { this.inactive = inactive; }

    public long getAutoAdding() { return autoAdding; }
    public void setAutoAdding(long autoAdding) { this.autoAdding = autoAdding; }

    public long getStale() { return stale; }
    public void setStale(long stale) { this.stale = stale; }

    public long getGrowingUnattended() { return growingUnattended; }
    public void setGrowingUnattended(long growingUnattended) { this.growingUnattended = growingUnattended; }

    public long getEntriesHeld() { return entriesHeld; }
    public void setEntriesHeld(long entriesHeld) { this.entriesHeld = entriesHeld; }

    public Long getOldestMedianDays() { return oldestMedianDays; }
    public void setOldestMedianDays(Long oldestMedianDays) { this.oldestMedianDays = oldestMedianDays; }

    public String getOldestMedianPoolId() { return oldestMedianPoolId; }
    public void setOldestMedianPoolId(String oldestMedianPoolId) { this.oldestMedianPoolId = oldestMedianPoolId; }
}
