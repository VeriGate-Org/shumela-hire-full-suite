package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the JobAd entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaJobAdDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoJobAdRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface JobAdDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<JobAd> findById(String id);

    JobAd save(JobAd entity);

    List<JobAd> saveAll(List<JobAd> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find a job ad by its unique slug. */
    Optional<JobAd> findBySlug(String slug);

    /** Find job ads by status. */
    List<JobAd> findByStatus(JobAdStatus status);

    /** Find job ads by status (paginated). */
    CursorPage<JobAd> findByStatusPaginated(JobAdStatus status, String cursor, int pageSize);

    /** Find job ads published on the internal channel. */
    List<JobAd> findByInternalChannel();

    /** Find job ads published on the external channel. */
    List<JobAd> findByExternalChannel();

    /** Find job ads by requisition ID. */
    List<JobAd> findByRequisitionId(String requisitionId);

    /** Find a job ad by job posting ID (for sync). */
    Optional<JobAd> findByJobPostingId(String jobPostingId);

    /** Search job ads with filters (paginated). */
    CursorPage<JobAd> findWithFilters(JobAdStatus status, Boolean channelInternal,
                                       Boolean channelExternal, String searchQuery,
                                       String cursor, int pageSize);

    /** Find published external ads that are not expired. */
    List<JobAd> findActiveExternalAds(LocalDate currentDate);

    /** Find published internal ads that are not expired. */
    List<JobAd> findActiveInternalAds(LocalDate currentDate);

    /** Find published internal ads (paginated). */
    CursorPage<JobAd> findActiveInternalAdsPaged(LocalDate currentDate, String cursor, int pageSize);

    /** Find ads that should be marked as expired. */
    List<JobAd> findAdsToExpire(LocalDate currentDate);

    /** Bulk-mark expired ads. Returns count of updated records. */
    int markExpiredAds(LocalDate currentDate);

    /** Check if slug exists. */
    boolean existsBySlug(String slug);

    /** Find job ads by creator (paginated). */
    CursorPage<JobAd> findByCreatedBy(String createdBy, String cursor, int pageSize);

    /** Count job ads by status. */
    long countByStatus(JobAdStatus status);

    /** Find recent job ads (paginated). */
    CursorPage<JobAd> findRecentAds(String cursor, int pageSize);
}
