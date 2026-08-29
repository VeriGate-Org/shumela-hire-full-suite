package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.ReportScheduleResponse;
import com.arthmatic.shumelahire.entity.ReportSchedule;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.service.integration.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * What the sweep must get right — each of these is a way the old silence could come back.
 */
class ReportScheduleRunnerTest {

    private TenantDataRepository tenants;
    private ReportScheduleService schedules;
    private ReportTemplateService templates;
    private EmailService email;
    private ReportScheduleRunner runner;

    /** Due schedules per tenant id, so a test can give each tenant its own work. */
    private Map<String, List<ReportScheduleResponse>> dueByTenant;

    @BeforeEach
    void setUp() {
        tenants = mock(TenantDataRepository.class);
        schedules = mock(ReportScheduleService.class);
        templates = mock(ReportTemplateService.class);
        email = mock(EmailService.class);
        dueByTenant = new java.util.HashMap<>();

        when(email.isDeliveryConfigured()).thenReturn(true);
        when(email.sendEmail(anyString(), anyString(), anyString())).thenReturn(true);
        // due() is tenant-scoped in production; here it answers from whatever context is set,
        // which is also how a test proves the context was set at all.
        when(schedules.due()).thenAnswer(i ->
                dueByTenant.getOrDefault(TenantContext.getCurrentTenant(), List.of()));

        runner = new ReportScheduleRunner(tenants, schedules, templates, email, "https://shumelahire.co.za");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Tenant tenant(String id, String subdomain, String status) {
        var t = new Tenant();
        t.setId(id);
        t.setSubdomain(subdomain);
        t.setStatus(status);
        return t;
    }

    private ReportScheduleResponse due(String id, String... recipients) {
        var e = new ReportSchedule();
        e.setId(id);
        e.setReportId("report-" + id);
        e.setReportName("Time to hire");
        e.setFrequency(ReportSchedule.Frequency.WEEKLY);
        e.setRecipients(new ArrayList<>(List.of(recipients)));
        return new ReportScheduleResponse(e);
    }

    @Test
    @DisplayName("a delivered report is recorded as run, and the report's run count moves with it")
    void recordsDelivery() {
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za")));

        var summary = runner.sweep();

        assertThat(summary.delivered()).isEqualTo(1);
        assertThat(summary.failed()).isZero();
        verify(email).sendEmail(eq("hr@idc.co.za"), anyString(), anyString());
        verify(templates).incrementRunCount("report-s1");
        verify(schedules).recordRun("s1", true, null);
    }

    @Test
    @DisplayName("with no email channel the run is recorded as FAILED, not as a quiet success")
    void refusesToClaimDeliveryWithoutAChannel() {
        // NoOpEmailService returns true from sendEmail while sending nothing. Trusting that is how
        // a report nobody received would be recorded as delivered.
        when(email.isDeliveryConfigured()).thenReturn(false);
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za")));

        var summary = runner.sweep();

        assertThat(summary.failed()).isEqualTo(1);
        var reason = ArgumentCaptor.forClass(String.class);
        verify(schedules).recordRun(eq("s1"), eq(false), reason.capture());
        assertThat(reason.getValue()).contains("no email channel");
        verify(email, never()).sendEmail(anyString(), anyString(), anyString());
        // Nothing reached anyone, so nothing may claim the report ran.
        verify(templates, never()).incrementRunCount(anyString());
    }

    @Test
    @DisplayName("a rejected recipient is named in the stored reason")
    void namesTheRecipientThatFailed() {
        when(email.sendEmail(eq("exco@idc.co.za"), anyString(), anyString())).thenReturn(false);
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za", "exco@idc.co.za")));

        runner.sweep();

        var reason = ArgumentCaptor.forClass(String.class);
        verify(schedules).recordRun(eq("s1"), eq(false), reason.capture());
        assertThat(reason.getValue()).contains("exco@idc.co.za").doesNotContain("hr@idc.co.za");
    }

    @Test
    @DisplayName("a schedule with nobody on it fails with that reason rather than reporting success")
    void refusesAScheduleWithNoRecipients() {
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1")));

        runner.sweep();

        var reason = ArgumentCaptor.forClass(String.class);
        verify(schedules).recordRun(eq("s1"), eq(false), reason.capture());
        assertThat(reason.getValue()).contains("no recipients");
    }

    @Test
    @DisplayName("one tenant blowing up does not end the sweep for the others")
    void oneBadTenantDoesNotStopTheRest() {
        when(tenants.findAll()).thenReturn(List.of(
                tenant("broken", "broken", "ACTIVE"),
                tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za")));
        // The broken tenant fails inside due(), before any schedule is reached.
        when(schedules.due()).thenAnswer(i -> {
            if ("broken".equals(TenantContext.getCurrentTenant())) {
                throw new IllegalStateException("table unavailable");
            }
            return dueByTenant.getOrDefault(TenantContext.getCurrentTenant(), List.of());
        });

        var summary = runner.sweep();

        assertThat(summary.tenantErrors()).isEqualTo(1);
        assertThat(summary.delivered()).isEqualTo(1);
        verify(schedules).recordRun("s1", true, null);
    }

    @Test
    @DisplayName("a paused or closed tenant is skipped")
    void skipsInactiveTenants() {
        when(tenants.findAll()).thenReturn(List.of(tenant("old", "old", "SUSPENDED")));
        dueByTenant.put("old", List.of(due("s1", "hr@old.co.za")));

        var summary = runner.sweep();

        assertThat(summary.tenants()).isZero();
        verify(schedules, never()).recordRun(anyString(), any(Boolean.class), any());
    }

    @Test
    @DisplayName("the sweep leaves the tenant context as it found it")
    void restoresTheTenantContext() {
        TenantContext.setCurrentTenant("caller");
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za")));

        runner.sweep();

        // Lambda reuses threads. Leaving "idc" behind would hand the next request another
        // tenant's data.
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("caller");
    }

    @Test
    @DisplayName("the link points at the recipient's own tenant, not the bare domain")
    void linksToTheTenantsOwnHost() {
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za")));

        runner.sweep();

        var body = ArgumentCaptor.forClass(String.class);
        verify(email).sendEmail(anyString(), anyString(), body.capture());
        assertThat(body.getValue()).contains("https://idc.shumelahire.co.za/reports");
    }

    @Test
    @DisplayName("no base URL means no link, rather than a link that goes nowhere")
    void omitsTheLinkWhenTheBaseUrlIsUnset() {
        runner = new ReportScheduleRunner(tenants, schedules, templates, email, "");
        when(tenants.findAll()).thenReturn(List.of(tenant("idc", "idc", "ACTIVE")));
        dueByTenant.put("idc", List.of(due("s1", "hr@idc.co.za")));

        runner.sweep();

        var body = ArgumentCaptor.forClass(String.class);
        verify(email).sendEmail(anyString(), anyString(), body.capture());
        assertThat(body.getValue()).doesNotContain("href");
        assertThat(body.getValue()).contains("Time to hire");
    }
}
