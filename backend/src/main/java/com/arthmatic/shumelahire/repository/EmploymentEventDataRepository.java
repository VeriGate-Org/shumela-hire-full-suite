package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.entity.EmploymentEventType;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the EmploymentEvent entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaEmploymentEventDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoEmploymentEventRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface EmploymentEventDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<EmploymentEvent> findById(String id);

    EmploymentEvent save(EmploymentEvent entity);

    List<EmploymentEvent> saveAll(List<EmploymentEvent> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** All events for an employee, ordered by event date descending. */
    List<EmploymentEvent> findByEmployeeOrderByEventDateDesc(String employeeId);

    /** Events for an employee with cursor-based pagination. */
    CursorPage<EmploymentEvent> findByEmployee(String employeeId, String cursor, int pageSize);

    /** Events for an employee filtered by event type. */
    List<EmploymentEvent> findByEmployeeAndEventType(String employeeId, EmploymentEventType eventType);
}
