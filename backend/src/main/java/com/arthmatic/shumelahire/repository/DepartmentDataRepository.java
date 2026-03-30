package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Department;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Department entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaDepartmentDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoDepartmentRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface DepartmentDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Department> findById(String id);

    Department save(Department entity);

    List<Department> saveAll(List<Department> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** All departments ordered by name ascending. */
    List<Department> findAllOrderByName();

    /** Active departments ordered by name ascending. */
    List<Department> findActiveOrderByName();

    /** Find a department by its unique name. */
    Optional<Department> findByName(String name);

    /** Find a department by its unique code. */
    Optional<Department> findByCode(String code);

    /** Check whether a department with the given name already exists. */
    boolean existsByName(String name);

    /** Check whether a department with the given code already exists. */
    boolean existsByCode(String code);

    /** Return just the names of all active departments, sorted alphabetically. */
    List<String> findActiveNames();
}
