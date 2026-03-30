package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ExportStatus;
import com.arthmatic.shumelahire.entity.ReportExportJob;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the ReportExportJob entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaReportExportJobDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoReportExportJobRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ReportExportJobDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<ReportExportJob> findById(String id);

    ReportExportJob save(ReportExportJob entity);

    List<ReportExportJob> saveAll(List<ReportExportJob> entities);

    void deleteById(String id);

    boolean existsById(String id);

    /** All export jobs for the current tenant. */
    List<ReportExportJob> findAll();

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Jobs requested by a specific employee, ordered by creation date descending. */
    List<ReportExportJob> findByRequestedByIdOrderByCreatedAtDesc(String employeeId);

    /** Jobs with a given export status. */
    List<ReportExportJob> findByStatus(ExportStatus status);

    /** Jobs for a given report type, ordered by creation date descending. */
    List<ReportExportJob> findByReportTypeOrderByCreatedAtDesc(String reportType);
}
