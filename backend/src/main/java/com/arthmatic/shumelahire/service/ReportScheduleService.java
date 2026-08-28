package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ReportScheduleResponse;
import com.arthmatic.shumelahire.entity.ReportSchedule;
import com.arthmatic.shumelahire.repository.ReportScheduleDataRepository;
import com.arthmatic.shumelahire.repository.ReportTemplateDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Report schedules — create, amend, enable, and record what happened when one ran.
 *
 * <p>This service deliberately does not send anything. Running a report and delivering it are
 * separate concerns, and wiring delivery in here would have made every schedule change depend on
 * the mail path being healthy. {@link #recordRun} is the seam a runner calls.
 */
@Service
public class ReportScheduleService {

    private static final Logger logger = LoggerFactory.getLogger(ReportScheduleService.class);

    private final ReportScheduleDataRepository repository;
    private final ReportTemplateDataRepository reportRepository;
    private final AuditLogService auditLogService;

    public ReportScheduleService(ReportScheduleDataRepository repository,
                                 ReportTemplateDataRepository reportRepository,
                                 AuditLogService auditLogService) {
        this.repository = repository;
        this.reportRepository = reportRepository;
        this.auditLogService = auditLogService;
    }

    public List<ReportScheduleResponse> list() {
        return repository.findAllOrderByNextRunAsc().stream()
                .map(ReportScheduleResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReportScheduleResponse create(Map<String, Object> config, String createdBy) {
        String reportId = str(config.get("reportId"));
        if (reportId == null || reportId.isBlank()) {
            throw new IllegalArgumentException("reportId is required");
        }

        var schedule = new ReportSchedule();
        schedule.setReportId(reportId);
        // Denormalised at creation so the schedule still names something if the report is deleted.
        schedule.setReportName(reportRepository.findById(reportId)
                .map(r -> r.getName())
                .orElse(str(config.getOrDefault("reportName", "Report"))));
        schedule.setFrequency(frequency(config.get("frequency")));
        schedule.setRecipients(recipients(config.get("recipients")));
        schedule.setEnabled(!Boolean.FALSE.equals(config.get("enabled")));
        schedule.setCreatedBy(createdBy);

        LocalDateTime now = LocalDateTime.now();
        schedule.setCreatedAt(now);
        schedule.setUpdatedAt(now);
        schedule.setRunCount(0);
        schedule.setLastStatus(ReportSchedule.Status.PENDING);
        schedule.setNextRun(schedule.computeNextRun(now));

        var saved = repository.save(schedule);
        auditLogService.logSystemAction("CREATE", "REPORT_SCHEDULE",
                "Scheduled '" + saved.getReportName() + "' " + saved.getFrequency().name().toLowerCase()
                        + " to " + saved.getRecipients().size() + " recipient(s)");
        return new ReportScheduleResponse(saved);
    }

    @Transactional
    public ReportScheduleResponse update(String id, Map<String, Object> updates) {
        var schedule = require(id);

        if (updates.containsKey("frequency")) {
            schedule.setFrequency(frequency(updates.get("frequency")));
            // The cadence changed, so the pending run is stale.
            schedule.setNextRun(schedule.computeNextRun(LocalDateTime.now()));
        }
        if (updates.containsKey("recipients")) {
            schedule.setRecipients(recipients(updates.get("recipients")));
        }
        if (updates.containsKey("enabled")) {
            schedule.setEnabled(Boolean.TRUE.equals(updates.get("enabled")));
        }
        schedule.setUpdatedAt(LocalDateTime.now());
        return new ReportScheduleResponse(repository.save(schedule));
    }

    @Transactional
    public ReportScheduleResponse setEnabled(String id, boolean enabled) {
        var schedule = require(id);
        schedule.setEnabled(enabled);
        if (enabled) {
            // Re-enabling something that was paused for a week should not fire immediately for
            // every run it missed; it picks up from now.
            schedule.setNextRun(schedule.computeNextRun(LocalDateTime.now()));
        }
        schedule.setUpdatedAt(LocalDateTime.now());
        var saved = repository.save(schedule);
        auditLogService.logSystemAction(enabled ? "ENABLE" : "DISABLE", "REPORT_SCHEDULE",
                "'" + saved.getReportName() + "' " + (enabled ? "resumed" : "paused"));
        return new ReportScheduleResponse(saved);
    }

    @Transactional
    public void delete(String id) {
        var schedule = require(id);
        repository.deleteById(id);
        auditLogService.logSystemAction("DELETE", "REPORT_SCHEDULE",
                "Removed the schedule for '" + schedule.getReportName() + "'");
    }

    /**
     * Record the outcome of a run.
     *
     * <p>The seam a runner calls. A failure stores its reason and <em>keeps</em> the schedule
     * enabled with a next run: a report that failed once should try again, and the stored status is
     * what lets the Reports page say somebody is waiting on something that did not arrive.
     */
    @Transactional
    public ReportScheduleResponse recordRun(String id, boolean succeeded, String errorMessage) {
        var schedule = require(id);
        LocalDateTime now = LocalDateTime.now();

        schedule.setLastRun(now);
        schedule.setRunCount(schedule.getRunCount() + 1);
        schedule.setLastStatus(succeeded ? ReportSchedule.Status.SUCCESS : ReportSchedule.Status.FAILED);
        schedule.setErrorMessage(succeeded ? null : errorMessage);
        schedule.setNextRun(schedule.computeNextRun(now));
        schedule.setUpdatedAt(now);

        if (!succeeded) {
            logger.warn("Report schedule {} ('{}') failed: {}", id, schedule.getReportName(), errorMessage);
        }
        auditLogService.logSystemAction(succeeded ? "RUN" : "RUN_FAILED", "REPORT_SCHEDULE",
                "'" + schedule.getReportName() + "'" + (succeeded ? " ran" : " failed: " + errorMessage));
        return new ReportScheduleResponse(repository.save(schedule));
    }

    /** Enabled schedules whose next run has fallen due. */
    public List<ReportScheduleResponse> due() {
        return repository.findDue(LocalDateTime.now()).stream()
                .map(ReportScheduleResponse::new)
                .collect(Collectors.toList());
    }

    private ReportSchedule require(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report schedule not found: " + id));
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static ReportSchedule.Frequency frequency(Object raw) {
        if (raw == null) return ReportSchedule.Frequency.WEEKLY;
        try {
            return ReportSchedule.Frequency.valueOf(String.valueOf(raw).trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "frequency must be daily, weekly or monthly — got '" + raw + "'");
        }
    }

    @SuppressWarnings("unchecked")
    private static List<String> recipients(Object raw) {
        if (raw instanceof List<?> list) {
            return list.stream()
                    .map(String::valueOf)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    /** Exposed for the runner and for tests that need the entity rather than the wire shape. */
    public Optional<ReportSchedule> findEntity(String id) {
        return repository.findById(id);
    }
}
