package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ReportSchedule;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the ReportSchedule entity.
 *
 * <p>Mirrors {@link ReportTemplateDataRepository}: IDs are {@code String} so a JPA backend could
 * be added later without changing callers.
 */
public interface ReportScheduleDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<ReportSchedule> findById(String id);
    ReportSchedule save(ReportSchedule entity);
    List<ReportSchedule> saveAll(List<ReportSchedule> entities);
    void deleteById(String id);
    void delete(ReportSchedule entity);
    boolean existsById(String id);

    // -- Queries --------------------------------------------------------------

    /** Every schedule in the current tenant, soonest next run first. */
    List<ReportSchedule> findAllOrderByNextRunAsc();

    /** Schedules attached to a given saved report. */
    List<ReportSchedule> findByReportId(String reportId);

    /** Enabled schedules whose next run has fallen due — what a runner asks for. */
    List<ReportSchedule> findDue(LocalDateTime asOf);
}
