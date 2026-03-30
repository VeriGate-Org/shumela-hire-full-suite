package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the AgencyProfile entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaAgencyProfileDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoAgencyProfileRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface AgencyProfileDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<AgencyProfile> findById(String id);

    AgencyProfile save(AgencyProfile entity);

    List<AgencyProfile> saveAll(List<AgencyProfile> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find an agency profile by its unique contact email. */
    Optional<AgencyProfile> findByContactEmail(String contactEmail);

    /** Find agency profiles by status. */
    List<AgencyProfile> findByStatus(AgencyStatus status);

    /** Find all active (APPROVED) agencies. */
    List<AgencyProfile> findActiveAgencies();

    /** All agency profiles for the current tenant. */
    List<AgencyProfile> findAll();
}
