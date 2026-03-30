package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.TalentPoolEntry;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the TalentPoolEntry entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaTalentPoolEntryDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoTalentPoolEntryRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface TalentPoolEntryDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<TalentPoolEntry> findById(String id);

    TalentPoolEntry save(TalentPoolEntry entity);

    List<TalentPoolEntry> saveAll(List<TalentPoolEntry> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find available (not removed, is available) candidates in a pool, ordered by rating descending. */
    List<TalentPoolEntry> findAvailableCandidates(String poolId);

    /** Count active (not removed) entries in a pool. */
    long countActive(String poolId);

    /** Find all active (not removed) entries by talent pool ID. */
    List<TalentPoolEntry> findByTalentPoolId(String poolId);

    /** Find all entries for a specific applicant across all pools. */
    List<TalentPoolEntry> findByApplicantId(String applicantId);

    /** All talent pool entries for the current tenant. */
    List<TalentPoolEntry> findAll();
}
