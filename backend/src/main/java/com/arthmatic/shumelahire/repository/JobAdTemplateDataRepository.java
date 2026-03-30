package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.JobAdTemplate;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the JobAdTemplate entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaJobAdTemplateDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoJobAdTemplateRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface JobAdTemplateDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<JobAdTemplate> findById(String id);

    JobAdTemplate save(JobAdTemplate entity);

    List<JobAdTemplate> saveAll(List<JobAdTemplate> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find non-archived templates ordered by createdAt DESC. */
    List<JobAdTemplate> findByIsArchivedFalseOrderByCreatedAtDesc();

    /** Find all templates ordered by createdAt DESC. */
    List<JobAdTemplate> findAllOrderByCreatedAtDesc();

    /** Search templates with filters. */
    List<JobAdTemplate> findWithFilters(String search, String employmentType,
                                        String location, String createdBy,
                                        boolean showArchived);

    /** Count all templates. */
    long count();

    /** Count non-archived templates. */
    long countByIsArchivedFalse();

    /** Count archived templates. */
    long countByIsArchivedTrue();

    /** Find the most-used non-archived template. */
    Optional<JobAdTemplate> findMostUsedActiveTemplate();

    /** Find the most-used non-archived template (alias for findMostUsedActiveTemplate). */
    Optional<JobAdTemplate> findFirstByIsArchivedFalseOrderByUsageCountDesc();

    /** Find recently created non-archived templates. */
    List<JobAdTemplate> findRecentlyCreated();
}
