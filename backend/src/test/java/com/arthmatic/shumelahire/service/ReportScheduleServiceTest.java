package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.ReportSchedule;
import com.arthmatic.shumelahire.entity.ReportTemplate;
import com.arthmatic.shumelahire.repository.ReportScheduleDataRepository;
import com.arthmatic.shumelahire.repository.ReportTemplateDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Report scheduling — the behaviour that is not obvious from the field names.
 */
class ReportScheduleServiceTest {

    private ReportScheduleDataRepository repository;
    private ReportTemplateDataRepository reportRepository;
    private ReportScheduleService service;

    @BeforeEach
    void setUp() {
        repository = mock(ReportScheduleDataRepository.class);
        reportRepository = mock(ReportTemplateDataRepository.class);
        service = new ReportScheduleService(repository, reportRepository, mock(AuditLogService.class));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private ReportSchedule stored(String id) {
        var s = new ReportSchedule();
        s.setId(id);
        s.setReportId("report-1");
        s.setReportName("Time to hire");
        s.setFrequency(ReportSchedule.Frequency.WEEKLY);
        s.setRecipients(List.of("hr@idc.co.za"));
        s.setEnabled(true);
        when(repository.findById(id)).thenReturn(Optional.of(s));
        return s;
    }

    @Test
    @DisplayName("a new schedule takes its name from the report, so it still reads if the report goes")
    void denormalisesReportName() {
        var template = new ReportTemplate();
        template.setName("Pipeline by department");
        when(reportRepository.findById("report-1")).thenReturn(Optional.of(template));

        var created = service.create(Map.of("reportId", "report-1", "frequency", "daily"), "admin@idc.co.za");

        assertThat(created.getReportName()).isEqualTo("Pipeline by department");
    }

    @Test
    @DisplayName("a schedule without a report is refused, and the message says which field")
    void requiresReportId() {
        assertThatThrownBy(() -> service.create(Map.of("frequency", "daily"), "admin@idc.co.za"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reportId");
    }

    @Test
    @DisplayName("an unknown cadence names the ones that work rather than silently defaulting")
    void rejectsUnknownFrequency() {
        assertThatThrownBy(() -> service.create(
                Map.of("reportId", "report-1", "frequency", "fortnightly"), "admin@idc.co.za"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("daily, weekly or monthly");
    }

    @Test
    @DisplayName("recipients are trimmed and de-duplicated")
    void cleansRecipients() {
        var created = service.create(Map.of(
                "reportId", "report-1",
                "recipients", List.of(" hr@idc.co.za ", "hr@idc.co.za", "", "exco@idc.co.za")
        ), "admin@idc.co.za");

        assertThat(created.getRecipients()).containsExactly("hr@idc.co.za", "exco@idc.co.za");
    }

    @Test
    @DisplayName("a new schedule is pending with a next run, not silently idle")
    void startsPendingWithANextRun() {
        var created = service.create(Map.of("reportId", "report-1"), "admin@idc.co.za");

        assertThat(created.getLastStatus()).isEqualTo("pending");
        assertThat(created.getRunCount()).isZero();
        assertThat(created.getNextRun()).isNotNull();
    }

    @Test
    @DisplayName("a failed run is recorded with its reason and stays scheduled")
    void recordsFailureAndKeepsRunning() {
        stored("sched-1");

        var after = service.recordRun("sched-1", false, "SMTP timeout");

        // The status is the whole point: it is what lets the page say somebody did not get their
        // report. A failure that only logged would be invisible.
        assertThat(after.getLastStatus()).isEqualTo("failed");
        assertThat(after.getErrorMessage()).isEqualTo("SMTP timeout");
        assertThat(after.isEnabled()).isTrue();
        assertThat(after.getNextRun()).isNotNull();
        assertThat(after.getRunCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("a success clears the previous failure's message")
    void successClearsError() {
        var s = stored("sched-1");
        s.setLastStatus(ReportSchedule.Status.FAILED);
        s.setErrorMessage("SMTP timeout");

        var after = service.recordRun("sched-1", true, null);

        assertThat(after.getLastStatus()).isEqualTo("success");
        assertThat(after.getErrorMessage()).isNull();
    }

    @Test
    @DisplayName("resuming a paused schedule does not fire for every run it missed")
    void resumingRebasesTheNextRun() {
        var s = stored("sched-1");
        s.setEnabled(false);
        s.setNextRun(LocalDateTime.now().minusDays(30));

        var after = service.setEnabled("sched-1", true);

        assertThat(after.isEnabled()).isTrue();
        assertThat(LocalDateTime.parse(after.getNextRun())).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("changing the cadence re-bases the pending run rather than leaving it stale")
    void changingFrequencyRecomputesNextRun() {
        var s = stored("sched-1");
        s.setNextRun(LocalDateTime.now().plusDays(7));

        var after = service.update("sched-1", Map.of("frequency", "daily"));

        assertThat(after.getFrequency()).isEqualTo("daily");
        assertThat(LocalDateTime.parse(after.getNextRun()))
                .isBefore(LocalDateTime.now().plusDays(2));
    }

    @Test
    @DisplayName("a missing schedule is a clear error, not a null")
    void unknownIdIsRejected() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.recordRun("nope", true, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("runs are placed at 06:00 so a daily report is waiting, not interrupting")
    void dailyRunsAtSix() {
        var s = new ReportSchedule();
        s.setFrequency(ReportSchedule.Frequency.DAILY);

        var next = s.computeNextRun(LocalDateTime.of(2026, 8, 28, 14, 30));

        assertThat(next.getHour()).isEqualTo(6);
        assertThat(next.toLocalDate()).isEqualTo(java.time.LocalDate.of(2026, 8, 29));
    }
}
