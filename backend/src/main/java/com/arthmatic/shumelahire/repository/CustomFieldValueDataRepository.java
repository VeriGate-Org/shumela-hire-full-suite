package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import com.arthmatic.shumelahire.entity.CustomFieldValue;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the CustomFieldValue entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaCustomFieldValueDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoCustomFieldValueRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 * <p>
 * Note: The JPA entity uses a {@code @ManyToOne} relationship with CustomField.
 * This interface uses {@code customFieldId} (as a String) to decouple from JPA relationships.
 */
public interface CustomFieldValueDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<CustomFieldValue> findById(String id);

    CustomFieldValue save(CustomFieldValue entity);

    List<CustomFieldValue> saveAll(List<CustomFieldValue> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find all custom field values for a given entity (e.g. all values for employee #42). */
    List<CustomFieldValue> findByEntityIdAndEntityType(Long entityId, CustomFieldEntityType entityType);

    /** Find a specific custom field value by custom field ID, entity ID, and entity type. */
    Optional<CustomFieldValue> findByCustomFieldIdAndEntityIdAndEntityType(
            Long customFieldId, Long entityId, CustomFieldEntityType entityType);

    /** Delete all custom field values for a given entity (e.g. when deleting an employee). */
    void deleteByEntityIdAndEntityType(Long entityId, CustomFieldEntityType entityType);
}
