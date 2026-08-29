package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.scheduler.AgencyContractExpirationScheduler;
import com.arthmatic.shumelahire.scheduler.DocumentRetentionScheduler;
import com.arthmatic.shumelahire.scheduler.JobAdExpirationScheduler;
import com.arthmatic.shumelahire.scheduler.MetricsComputationScheduler;
import com.arthmatic.shumelahire.scheduler.SapTransmissionRetryScheduler;
import com.arthmatic.shumelahire.scheduler.TalentPoolRetentionScheduler;
import com.arthmatic.shumelahire.service.compliance.ComplianceReminderScheduler;
import com.arthmatic.shumelahire.service.integration.sage.SageSyncEngine;
import com.arthmatic.shumelahire.service.leave.LeaveBalanceService;
import com.arthmatic.shumelahire.service.leave.LeaveEscalationService;
import com.arthmatic.shumelahire.service.training.CertificationRenewalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduledJobRegistryTest {

    /**
     * The names every EventBridge rule uses.
     *
     * <p>This set is the contract with {@code infra/cdk/ShumelaHireServerlessStack.cs}. Renaming a
     * job here without renaming its rule leaves a timer firing at a name nothing answers to, which
     * is a silent daily failure — the exact shape of the defect this whole area started with. The
     * test is the only place the two lists meet, so it fails loudly on purpose.
     */
    private static final List<String> EXPECTED_JOBS = List.of(
            "agencycontractexpiration",
            "certificationrenewal",
            "complianceexpiries",
            "complianceoverdue",
            "compliancereminders",
            "documentretention",
            "jobadexpiration",
            "leavecarryforward",
            "leaveescalation",
            "metricscomputation",
            "reportschedules",
            "sagesync",
            "sapstaletransmissions",
            "saptransmissionretry",
            "talentpoolretention");

    private MetricsComputationScheduler metrics;
    private ComplianceReminderScheduler compliance;
    private SageSyncEngine sage;
    private JobAdExpirationScheduler jobAds;
    private ReportScheduleRunner reportRunner;
    private ScheduledJobRegistry registry;

    /** An ObjectProvider that has the bean. */
    @SuppressWarnings("unchecked")
    private <T> ObjectProvider<T> present(T bean) {
        ObjectProvider<T> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(bean);
        return provider;
    }

    /** An ObjectProvider for a bean that is switched off in this environment. */
    @SuppressWarnings("unchecked")
    private <T> ObjectProvider<T> absent() {
        ObjectProvider<T> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    @BeforeEach
    void setUp() {
        var tenants = mock(TenantDataRepository.class);
        var idc = new Tenant();
        idc.setId("idc");
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of(idc));
        when(tenants.findByStatus("TRIAL")).thenReturn(List.of());

        metrics = mock(MetricsComputationScheduler.class);
        compliance = mock(ComplianceReminderScheduler.class);
        sage = mock(SageSyncEngine.class);
        jobAds = mock(JobAdExpirationScheduler.class);
        reportRunner = mock(ReportScheduleRunner.class);

        registry = new ScheduledJobRegistry(
                new TenantSweep(tenants),
                reportRunner,
                metrics,
                compliance,
                sage,
                mock(LeaveEscalationService.class),
                mock(LeaveBalanceService.class),
                mock(CertificationRenewalService.class),
                present(jobAds),
                present(mock(AgencyContractExpirationScheduler.class)),
                absent(),   // SAP — sap.payroll.enabled is off
                absent(),   // document retention — deletes things, opt-in
                absent());  // talent-pool retention — deletes personal data, opt-in
    }

    @Test
    @DisplayName("the registered names are exactly the ones the EventBridge rules use")
    void namesMatchTheRules() {
        assertThat(registry.jobNames()).containsExactlyInAnyOrderElementsOf(EXPECTED_JOBS);
    }

    @Test
    @DisplayName("a job runs its bean's real method, once per live tenant")
    void runsThePerTenantWork() {
        registry.run("metricscomputation");

        verify(metrics).computePeriodically();
    }

    @Test
    @DisplayName("each compliance job is its own entry, because each was its own @Scheduled method")
    void keepsTheThreeComplianceJobsApart() {
        registry.run("compliancereminders");
        registry.run("complianceoverdue");
        registry.run("complianceexpiries");

        verify(compliance).processDueReminders();
        verify(compliance).markOverdueReminders();
        verify(compliance).scanUpcomingExpiries();
    }

    @Test
    @DisplayName("the name is matched case-insensitively, since it is typed into a CDK rule")
    void matchesTheNameLoosely() {
        registry.run("  SageSync ");

        verify(sage).checkAndExecuteDueSchedules();
    }

    @Test
    @DisplayName("a switched-off job names the property that would enable it")
    void explainsWhyAJobIsUnavailable() {
        assertThat(registry.jobNames()).contains("talentpoolretention");
        assertThat(registry.isAvailable("talentpoolretention")).isFalse();

        assertThatThrownBy(() -> registry.run("talentpoolretention"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("talent-pool.retention.scheduler.enabled");
    }

    @Test
    @DisplayName("a job whose bean is present reports itself available")
    void reportsAvailability() {
        assertThat(registry.isAvailable("jobadexpiration")).isTrue();

        registry.run("jobadexpiration");

        verify(jobAds).expireJobAds();
    }

    @Test
    @DisplayName("an unknown job is an error naming what is registered, not a silent no-op")
    void unknownJobFailsLoudly() {
        // The old registry skipped anything it could not resolve, which is how ten jobs pointing at
        // methods that do not exist went unnoticed.
        assertThatThrownBy(() -> registry.run("securitycleanup"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("securitycleanup")
                .hasMessageContaining("reportschedules");
    }

    @Test
    @DisplayName("a job that throws propagates, so Lambda records the failure")
    void failuresPropagate() {
        // The sweep swallows a single tenant's failure by design; a job that cannot run at all is
        // different and must reach the caller.
        assertThatThrownBy(() -> registry.run("documentretention"))
                .isInstanceOf(IllegalStateException.class);
    }
}
