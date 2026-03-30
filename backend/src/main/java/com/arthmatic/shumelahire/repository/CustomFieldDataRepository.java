package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.CustomField;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the CustomField entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaCustomFieldDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoCustomFieldRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface CustomFieldDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<CustomField> findById(String id);

    CustomField save(CustomField entity);

    List<CustomField> saveAll(List<CustomField> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Active custom fields for a given entity type, ordered by display order ascending. */
    List<CustomField> findByEntityTypeAndActive(CustomFieldEntityType entityType);

    /** Find a custom field by its unique field name and entity type combination. */
    Optional<CustomField> findByFieldNameAndEntityType(String fieldName, CustomFieldEntityType entityType);

    /** Check whether a custom field with the given field name and entity type already exists. */
    boolean existsByFieldNameAndEntityType(String fieldName, CustomFieldEntityType entityType);

    /** All custom fields for a given entity type (including inactive), ordered by display order ascending. */
    List<CustomField> findByEntityType(CustomFieldEntityType entityType);
}
