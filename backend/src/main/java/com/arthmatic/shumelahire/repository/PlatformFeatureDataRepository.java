package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.PlatformFeature;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the PlatformFeature entity.
 * <p>
 * PlatformFeature is a global (non-tenant-scoped) entity — it represents features
 * available on the platform itself.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaPlatformFeatureDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoPlatformFeatureRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 */
public interface PlatformFeatureDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<PlatformFeature> findById(String id);

    PlatformFeature save(PlatformFeature entity);

    List<PlatformFeature> saveAll(List<PlatformFeature> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find a feature by its unique code. */
    Optional<PlatformFeature> findByCode(String code);

    /** All active features. */
    List<PlatformFeature> findByIsActiveTrue();

    /** Features filtered by category. */
    List<PlatformFeature> findByCategory(String category);

    /** Check whether a feature with the given code already exists. */
    boolean existsByCode(String code);

    /** Return all platform features. */
    List<PlatformFeature> findAll();
}
