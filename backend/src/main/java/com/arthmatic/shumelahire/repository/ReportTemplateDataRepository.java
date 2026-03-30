package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ReportTemplate;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the ReportTemplate entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaReportTemplateDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoReportTemplateRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ReportTemplateDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<ReportTemplate> findById(String id);

    ReportTemplate save(ReportTemplate entity);

    List<ReportTemplate> saveAll(List<ReportTemplate> entities);

    void deleteById(String id);

    void delete(ReportTemplate entity);

    boolean existsById(String id);

    // -- Queries --------------------------------------------------------------

    /** Shared templates or templates created by a specific user, newest first. */
    List<ReportTemplate> findBySharedTrueOrCreatedByOrderByUpdatedAtDesc(String createdBy);

    /** System templates ordered by name. */
    List<ReportTemplate> findBySystemTrueOrderByNameAsc();

    /** Check if a template with the given name exists for the given creator. */
    boolean existsByNameAndCreatedBy(String name, String createdBy);
}
