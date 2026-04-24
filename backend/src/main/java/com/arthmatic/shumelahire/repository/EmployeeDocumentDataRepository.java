package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the EmployeeDocument entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaEmployeeDocumentDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoEmployeeDocumentRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface EmployeeDocumentDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<EmployeeDocument> findById(String id);

    EmployeeDocument save(EmployeeDocument entity);

    List<EmployeeDocument> saveAll(List<EmployeeDocument> entities);

    void deleteById(String id);

    boolean existsById(String id);

    List<EmployeeDocument> findAll();

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Active documents for an employee, ordered by creation date descending. */
    List<EmployeeDocument> findActiveByEmployee(String employeeId);

    /** Active documents of a specific type for an employee. */
    List<EmployeeDocument> findActiveByEmployeeAndType(String employeeId, EmployeeDocumentType documentType);

    /** All active documents expiring on or before the given date. */
    List<EmployeeDocument> findExpiringDocuments(LocalDate date);

    /** Active documents for a specific employee expiring on or before the given date. */
    List<EmployeeDocument> findExpiringDocumentsByEmployee(String employeeId, LocalDate date);

    /** Latest version of a document type for an employee (active only, ordered by version desc). */
    List<EmployeeDocument> findLatestByEmployeeAndType(String employeeId, EmployeeDocumentType type);
}
