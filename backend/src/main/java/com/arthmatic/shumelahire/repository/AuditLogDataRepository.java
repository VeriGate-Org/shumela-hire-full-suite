package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.AuditLog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the AuditLog entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaAuditLogDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoAuditLogRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface AuditLogDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<AuditLog> findById(String id);

    AuditLog save(AuditLog entity);

    List<AuditLog> saveAll(List<AuditLog> entities);

    void deleteById(String id);

    boolean existsById(String id);

    /** All audit logs for the current tenant. */
    List<AuditLog> findAll();

    /** All audit logs (paginated with Spring Data Page). */
    Page<AuditLog> findAll(Pageable pageable);

    // -- User queries ---------------------------------------------------------

    /** All audit logs for a user, newest first. */
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);

    // -- Entity queries -------------------------------------------------------

    /** Audit logs for a specific entity type and ID, newest first. */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);

    /** Recent logs for a specific entity (same as above, alias for custom query). */
    List<AuditLog> findRecentLogsByEntity(String entityType, String entityId);

    /** Audit logs by entity type with cursor pagination. */
    CursorPage<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, int page, int pageSize);

    /** Audit logs by entity type (paginated with Spring Data Page). */
    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    // -- Action queries -------------------------------------------------------

    /** Audit logs by action, newest first. */
    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    /** Count of audit logs by action. */
    long countByAction(String action);

    // -- Time range queries ---------------------------------------------------

    /** Audit logs within a time range, newest first. */
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startTime, LocalDateTime endTime);
}
