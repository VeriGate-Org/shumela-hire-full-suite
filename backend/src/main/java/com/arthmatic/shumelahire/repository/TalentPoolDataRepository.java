package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.TalentPool;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the TalentPool entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaTalentPoolDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoTalentPoolRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface TalentPoolDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<TalentPool> findById(String id);

    TalentPool save(TalentPool entity);

    List<TalentPool> saveAll(List<TalentPool> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find a talent pool by its unique pool name. */
    Optional<TalentPool> findByPoolName(String poolName);

    /** Find all active talent pools. */
    List<TalentPool> findByIsActiveTrue();

    /** Find pools that have auto-add enabled and are active. */
    List<TalentPool> findAutoAddPools();

    /** All talent pools for the current tenant. */
    List<TalentPool> findAll();
}
