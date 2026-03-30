package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.WorkflowDefinition;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the WorkflowDefinition entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaWorkflowDefinitionDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoWorkflowDefinitionRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface WorkflowDefinitionDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<WorkflowDefinition> findById(String id);

    WorkflowDefinition save(WorkflowDefinition entity);

    List<WorkflowDefinition> saveAll(List<WorkflowDefinition> entities);

    void deleteById(String id);

    void delete(WorkflowDefinition entity);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** All active workflow definitions. */
    List<WorkflowDefinition> findByIsActiveTrue();

    /** Workflow definitions filtered by category. */
    List<WorkflowDefinition> findByCategory(String category);

    /** All workflow definitions ordered by updatedAt descending. */
    List<WorkflowDefinition> findAllByOrderByUpdatedAtDesc();
}
