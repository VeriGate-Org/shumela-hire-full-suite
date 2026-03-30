package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Requisition entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaRequisitionDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoRequisitionRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface RequisitionDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Requisition> findById(String id);

    Requisition save(Requisition entity);

    List<Requisition> saveAll(List<Requisition> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find requisitions by status, ordered by creation date descending. */
    List<Requisition> findByStatusOrderByCreatedAtDesc(RequisitionStatus status);

    /** Find requisitions created by a specific user. */
    List<Requisition> findByCreatedBy(String createdBy);

    /** Count requisitions with a given status. */
    long countByStatus(RequisitionStatus status);

    /** All requisitions for the current tenant. */
    List<Requisition> findAll();

    // ── Page-based queries (JPA compatibility) ───────────────────────────────

    /** All requisitions (paginated with Spring Data Page). */
    Page<Requisition> findAll(Pageable pageable);

    /** Find requisitions by status (paginated with Spring Data Page). */
    Page<Requisition> findByStatus(RequisitionStatus status, Pageable pageable);
}
