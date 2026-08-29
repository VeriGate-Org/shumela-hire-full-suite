package com.arthmatic.shumelahire.service;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Consumer;

/**
 * The jobs an EventBridge rule may ask this application to run.
 *
 * <p><b>Every entry is a real method, checked by the compiler.</b> The previous version looked its
 * beans up by name and its methods by reflection, and ten of its twelve entries named a method that
 * does not exist — {@code computeMetrics} for a class whose method is {@code computePeriodically},
 * {@code syncAll} for {@code checkAndExecuteDueSchedules}, {@code cleanupExpired} on a service with
 * no cleanup method at all. Reflection turned each of those into a debug line nobody read. Now a
 * wrong name will not compile.
 *
 * <p><b>Every job runs once per live tenant.</b> These jobs all reach tenant-scoped repositories and
 * a scheduled invocation carries no tenant context, which is why the first live run of the report
 * sweep threw. {@link TenantSweep} sets it, per tenant, and keeps going past a tenant that fails.
 *
 * <p><b>A job whose bean is switched off is an error, not a silence.</b> Several schedulers are
 * {@code @ConditionalOnProperty} — SAP retries need {@code sap.payroll.enabled}, document retention
 * and talent-pool retention are off unless asked for, because they delete things. Asking for one of
 * those fails with the property that would turn it on, rather than reporting an unknown job.
 *
 * <p>The names below are a contract with {@code infra/cdk/ShumelaHireServerlessStack.cs}. A test
 * pins the set, so renaming one here without renaming the rule fails the build rather than the
 * timer.
 */
@Service
public class ScheduledJobRegistry {

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobRegistry.class);

    private final Map<String, Job> jobs = new LinkedHashMap<>();

    /** A registered job: either something to run, or the reason it cannot be. */
    private record Job(Consumer<String> run, String unavailableBecause) {
        static Job of(Consumer<String> run) {
            return new Job(run, null);
        }

        static Job unavailable(String property) {
            return new Job(null, property);
        }
    }

    public ScheduledJobRegistry(
            TenantSweep sweep,
            ReportScheduleRunner reportScheduleRunner,
            MetricsComputationScheduler metrics,
            ComplianceReminderScheduler compliance,
            SageSyncEngine sage,
            LeaveEscalationService leaveEscalation,
            LeaveBalanceService leaveBalance,
            CertificationRenewalService certifications,
            // Conditional beans. ObjectProvider rather than a nullable dependency, so the absence
            // is a fact this class can report rather than a NullPointerException at 02:00.
            ObjectProvider<JobAdExpirationScheduler> jobAds,
            ObjectProvider<AgencyContractExpirationScheduler> agencyContracts,
            ObjectProvider<SapTransmissionRetryScheduler> sapRetries,
            ObjectProvider<DocumentRetentionScheduler> documentRetention,
            ObjectProvider<TalentPoolRetentionScheduler> talentPoolRetention) {

        // Always present.
        perTenant(sweep, "reportschedules", t -> reportScheduleRunner.runDueForCurrentTenant(t));
        perTenant(sweep, "metricscomputation", t -> metrics.computePeriodically());
        perTenant(sweep, "compliancereminders", t -> compliance.processDueReminders());
        perTenant(sweep, "complianceoverdue", t -> compliance.markOverdueReminders());
        perTenant(sweep, "complianceexpiries", t -> compliance.scanUpcomingExpiries());
        perTenant(sweep, "sagesync", t -> sage.checkAndExecuteDueSchedules());
        perTenant(sweep, "leaveescalation", t -> leaveEscalation.escalatePendingRequests());
        perTenant(sweep, "leavecarryforward", t -> leaveBalance.processCarryForward());
        perTenant(sweep, "certificationrenewal", t -> certifications.checkExpiringCertifications());

        // Present unless switched off.
        conditional(sweep, "jobadexpiration", jobAds, "job-ad.scheduler.enabled",
                (bean, t) -> bean.expireJobAds());
        conditional(sweep, "agencycontractexpiration", agencyContracts, "agency.scheduler.enabled",
                (bean, t) -> bean.suspendExpiredAgencyContracts());

        // Off unless switched on.
        conditional(sweep, "saptransmissionretry", sapRetries, "sap.payroll.enabled",
                (bean, t) -> bean.retryFailedTransmissions());
        conditional(sweep, "sapstaletransmissions", sapRetries, "sap.payroll.enabled",
                (bean, t) -> bean.checkStaleTransmissions());
        conditional(sweep, "documentretention", documentRetention, "document.retention.scheduler.enabled",
                (bean, t) -> bean.applyRetentionPolicies());
        conditional(sweep, "talentpoolretention", talentPoolRetention,
                "talent-pool.retention.scheduler.enabled",
                (bean, t) -> bean.applyTalentPoolRetention());

        // Deliberately NOT registered: SecurityMonitoringService.cleanupSecurityEvents. It trims
        // in-memory maps of failed login attempts held by one JVM. Triggering that from EventBridge
        // would hand a fresh Lambda container its own empty maps to clean, which is not the job the
        // name promises. It stays an @Scheduled task for long-lived processes.
    }

    /** Job names this instance knows, sorted so the log reads the same way every time. */
    public Set<String> jobNames() {
        return Collections.unmodifiableSet(new TreeSet<>(jobs.keySet()));
    }

    /** Whether this job can run here, as opposed to being known but switched off. */
    public boolean isAvailable(String jobName) {
        Job job = jobs.get(normalise(jobName));
        return job != null && job.run() != null;
    }

    /**
     * Run a job by name.
     *
     * @throws IllegalArgumentException if no such job is registered — the name is a contract with
     *         an EventBridge rule, and a typo in it must not look like a job that did nothing
     * @throws IllegalStateException if the job exists but its bean is switched off, naming the
     *         property that would enable it
     */
    public void run(String jobName) {
        String key = normalise(jobName);
        Job job = jobs.get(key);
        if (job == null) {
            throw new IllegalArgumentException(
                    "No scheduled job named '" + jobName + "'. Registered: " + jobNames());
        }
        if (job.run() == null) {
            throw new IllegalStateException("Scheduled job '" + key + "' is switched off in this "
                    + "environment: set " + job.unavailableBecause() + "=true to enable it");
        }

        long start = System.currentTimeMillis();
        log.info("Running scheduled job {}", key);
        job.run().accept(key);
        log.info("Scheduled job {} completed in {}ms", key, System.currentTimeMillis() - start);
    }

    private void perTenant(TenantSweep sweep, String jobName,
                           Consumer<com.arthmatic.shumelahire.entity.Tenant> work) {
        jobs.put(jobName, Job.of(label -> sweep.forEachLiveTenant(label, work)));
    }

    private <T> void conditional(TenantSweep sweep, String jobName, ObjectProvider<T> provider,
                                 String property, BeanWork<T> work) {
        T bean = provider.getIfAvailable();
        if (bean == null) {
            log.info("Scheduled job '{}' is unavailable: {} is not enabled", jobName, property);
            jobs.put(jobName, Job.unavailable(property));
            return;
        }
        jobs.put(jobName, Job.of(label -> sweep.forEachLiveTenant(label, t -> work.run(bean, t))));
    }

    private interface BeanWork<T> {
        void run(T bean, com.arthmatic.shumelahire.entity.Tenant tenant);
    }

    private static String normalise(String jobName) {
        return jobName == null ? "" : jobName.trim().toLowerCase();
    }
}
