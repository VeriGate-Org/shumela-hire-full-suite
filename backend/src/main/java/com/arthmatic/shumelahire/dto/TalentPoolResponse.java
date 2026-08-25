package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.entity.TalentPoolEntry;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A talent pool, described by what is actually in it.
 *
 * <p><b>There was no talent-pool DTO at all.</b> {@code GET /api/talent-pools} returned the raw
 * entity, so the JSON was the pool's own eleven fields and nothing about its contents. The front end
 * declared {@code entryCount?: number} and guarded it with {@code !== undefined}, which is why
 * nobody noticed: the guard was correct, the value never arrived, and the "N candidates" line has
 * never once rendered.
 *
 * <p><b>A pool's value is its freshness.</b> A shortlist of 147 people whose median entry is
 * seventeen months old is a mailing list, not a bench — most of those people have taken other jobs.
 * {@code addedAt} is on every entry and nothing has ever reported it, so age is what this DTO is
 * built around.
 *
 * <p><b>Deliberately absent: whether anyone is still available.</b> {@code isAvailable} exists on
 * {@code TalentPoolEntry}, defaults to {@code true}, and the only code that touches it is the
 * DynamoDB mapper reading and writing its own copy — no service sets it false, ever. Returning it
 * would assert that every person in every pool is available, including anyone hired two years ago.
 * It is the field this page most wants and the one thing it must not show until something maintains
 * it.
 */
public class TalentPoolResponse {

    private String id;
    private String poolName;
    private String description;
    private String department;
    private String skillsCriteria;
    private String experienceLevel;
    private Boolean isActive;
    private Boolean autoAddEnabled;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * People currently held — entries that have not been removed.
     *
     * <p>Removed entries are excluded because they are not in the pool any more. They are still
     * counted, separately, in {@link #removedCount}: an entry is soft-deleted with a
     * {@code removedAt} and a reason, and rolling the two together would either overstate the pool
     * or hide that anyone had ever been taken out of it.
     */
    private long entryCount;

    /** Entries removed from this pool. Not part of {@link #entryCount}. */
    private long removedCount;

    /**
     * How each person got in — {@code MANUAL}, {@code AUTO_REJECTED} or {@code AGENCY}.
     *
     * <p>This changes what the pool means. A pool that is 88% auto-added rejections is a rejection
     * log; one that is entirely hand-picked is a genuine bench. They deserve different trust, and
     * the field was never rendered.
     */
    private Map<String, Long> bySource = new LinkedHashMap<>();

    /**
     * Median age of the entries held, in days, or null if the pool is empty.
     *
     * <p>Median rather than mean: one candidate added three years ago should not drag the figure for
     * a pool that is otherwise current. Where there is an even number of entries this takes the
     * lower of the two central values rather than averaging them — the same convention as
     * {@code RequisitionSummaryResponse.medianDaysToApproval}, so the two cannot be read as
     * different kinds of median.
     */
    private Long medianEntryAgeDays;

    /** When the oldest person still held was added, or null if the pool is empty. */
    private LocalDateTime oldestEntryAt;

    /** When anyone was last added, or null if the pool is empty. */
    private LocalDateTime lastAddedAt;

    /** Entries carrying no {@code addedAt}, and so excluded from the age figures above. */
    private long entriesWithoutDate;

    public static TalentPoolResponse from(TalentPool pool, List<TalentPoolEntry> entries,
                                          LocalDateTime now) {
        TalentPoolResponse response = new TalentPoolResponse();
        response.id = pool.getId();
        response.poolName = pool.getPoolName();
        response.description = pool.getDescription();
        response.department = pool.getDepartment();
        response.skillsCriteria = pool.getSkillsCriteria();
        response.experienceLevel = pool.getExperienceLevel();
        response.isActive = pool.getIsActive();
        response.autoAddEnabled = pool.getAutoAddEnabled();
        response.createdBy = pool.getCreatedBy();
        response.createdAt = pool.getCreatedAt();
        response.updatedAt = pool.getUpdatedAt();

        if (entries == null) {
            return response;
        }

        List<LocalDateTime> addedDates = new ArrayList<>();

        for (TalentPoolEntry entry : entries) {
            if (entry.getRemovedAt() != null) {
                response.removedCount++;
                continue;
            }

            response.entryCount++;

            String source = entry.getSourceType() != null ? entry.getSourceType() : "UNKNOWN";
            response.bySource.merge(source, 1L, Long::sum);

            LocalDateTime addedAt = entry.getAddedAt();
            if (addedAt == null) {
                // Counted as held, but it cannot contribute to an age. Reported rather than treated
                // as brand new, which is what defaulting it to now would silently claim.
                response.entriesWithoutDate++;
                continue;
            }
            addedDates.add(addedAt);

            if (response.oldestEntryAt == null || addedAt.isBefore(response.oldestEntryAt)) {
                response.oldestEntryAt = addedAt;
            }
            if (response.lastAddedAt == null || addedAt.isAfter(response.lastAddedAt)) {
                response.lastAddedAt = addedAt;
            }
        }

        if (!addedDates.isEmpty()) {
            List<Long> ages = addedDates.stream()
                    .map(added -> Math.max(0, Duration.between(added, now).toDays()))
                    .sorted()
                    .toList();
            // Lower of the two central values on an even count — see the field comment.
            response.medianEntryAgeDays = ages.get((ages.size() - 1) / 2);
        }

        return response;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPoolName() { return poolName; }
    public void setPoolName(String poolName) { this.poolName = poolName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSkillsCriteria() { return skillsCriteria; }
    public void setSkillsCriteria(String skillsCriteria) { this.skillsCriteria = skillsCriteria; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getAutoAddEnabled() { return autoAddEnabled; }
    public void setAutoAddEnabled(Boolean autoAddEnabled) { this.autoAddEnabled = autoAddEnabled; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public long getEntryCount() { return entryCount; }
    public void setEntryCount(long entryCount) { this.entryCount = entryCount; }

    public long getRemovedCount() { return removedCount; }
    public void setRemovedCount(long removedCount) { this.removedCount = removedCount; }

    public Map<String, Long> getBySource() { return bySource; }
    public void setBySource(Map<String, Long> bySource) { this.bySource = bySource; }

    public Long getMedianEntryAgeDays() { return medianEntryAgeDays; }
    public void setMedianEntryAgeDays(Long medianEntryAgeDays) { this.medianEntryAgeDays = medianEntryAgeDays; }

    public LocalDateTime getOldestEntryAt() { return oldestEntryAt; }
    public void setOldestEntryAt(LocalDateTime oldestEntryAt) { this.oldestEntryAt = oldestEntryAt; }

    public LocalDateTime getLastAddedAt() { return lastAddedAt; }
    public void setLastAddedAt(LocalDateTime lastAddedAt) { this.lastAddedAt = lastAddedAt; }

    public long getEntriesWithoutDate() { return entriesWithoutDate; }
    public void setEntriesWithoutDate(long entriesWithoutDate) { this.entriesWithoutDate = entriesWithoutDate; }
}
