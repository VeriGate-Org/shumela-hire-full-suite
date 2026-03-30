package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.WorkflowExecution;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the WorkflowExecution entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaWorkflowExecutionDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoWorkflowExecutionRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface WorkflowExecutionDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<WorkflowExecution> findById(String id);

    WorkflowExecution save(WorkflowExecution entity);

    List<WorkflowExecution> saveAll(List<WorkflowExecution> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Executions for a specific workflow definition, ordered by startedAt descending. */
    List<WorkflowExecution> findByWorkflowDefinitionIdOrderByStartedAtDesc(String workflowDefinitionId);

    /** Executions with a given status, ordered by startedAt descending. */
    List<WorkflowExecution> findByStatusOrderByStartedAtDesc(String status);
}
