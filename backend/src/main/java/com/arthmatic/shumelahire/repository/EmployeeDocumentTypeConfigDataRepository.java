package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.EmployeeDocumentTypeConfig;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the EmployeeDocumentTypeConfig entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaEmployeeDocumentTypeConfigDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoEmployeeDocumentTypeConfigRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface EmployeeDocumentTypeConfigDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<EmployeeDocumentTypeConfig> findById(String id);

    EmployeeDocumentTypeConfig save(EmployeeDocumentTypeConfig entity);

    List<EmployeeDocumentTypeConfig> saveAll(List<EmployeeDocumentTypeConfig> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** All active document type configurations. */
    List<EmployeeDocumentTypeConfig> findActive();

    /** All required document type configurations. */
    List<EmployeeDocumentTypeConfig> findRequired();

    /** Find a document type configuration by its unique code. */
    Optional<EmployeeDocumentTypeConfig> findByCode(String code);
}
