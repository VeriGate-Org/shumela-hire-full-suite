package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.UserPreference;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the UserPreference entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaUserPreferenceDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoUserPreferenceRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface UserPreferenceDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<UserPreference> findById(String id);

    UserPreference save(UserPreference entity);

    List<UserPreference> saveAll(List<UserPreference> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find preferences for a specific user. */
    Optional<UserPreference> findByUserId(Long userId);
}
