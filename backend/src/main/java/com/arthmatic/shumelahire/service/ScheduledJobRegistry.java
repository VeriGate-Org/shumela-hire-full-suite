package com.arthmatic.shumelahire.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * The jobs an EventBridge rule may ask this application to run.
 *
 * <p>This registry used to live inside {@code ScheduledJobController}, which mapped
 * {@code /api/internal/scheduled/{jobName}} and could never be called: the security chain ends
 * {@code anyRequest().denyAll()} and nothing permits that path, so the endpoint was 403 to
 * everyone including the timer it was written for. The registry is the useful part, so it moved
 * here and the controller went — an unreachable endpoint that claims in its own javadoc to be how
 * scheduled jobs run is worse than none, because it answers the question wrongly.
 *
 * <p>Two ways of registering a job, and the difference is deliberate:
 *
 * <ul>
 *   <li><b>Injected</b> — a job this codebase owns. A missing bean fails startup.</li>
 *   <li><b>Looked up by name</b> — a job whose bean may legitimately be absent, because the
 *       integration behind it is optional. Absence is logged, and asking for it later is an
 *       error rather than a silent no-op.</li>
 * </ul>
 */
@Service
public class ScheduledJobRegistry {

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobRegistry.class);

    /** The report-schedule sweep. Named here because the EventBridge rule has to match it. */
    public static final String REPORT_SCHEDULES = "reportschedules";

    private final Map<String, Runnable> jobs = new HashMap<>();

    public ScheduledJobRegistry(ApplicationContext context, ReportScheduleRunner reportScheduleRunner) {
        // Owned by this codebase: registered directly, so it cannot quietly go missing.
        jobs.put(REPORT_SCHEDULES, reportScheduleRunner::sweep);

        registerIfPresent("metricscomputation", context, "metricsComputationScheduler", "computeMetrics");
        registerIfPresent("jobadexpiration", context, "jobAdExpirationScheduler", "expireStaleJobAds");
        registerIfPresent("saptransmissionretry", context, "sapTransmissionRetryScheduler", "retryFailedTransmissions");
        registerIfPresent("compliancereminders", context, "complianceReminderScheduler", "sendReminders");
        registerIfPresent("leavecarryforward", context, "leaveBalanceService", "processAnnualCarryForward");
        registerIfPresent("securitycleanup", context, "securityMonitoringService", "cleanupExpiredSessions");
        registerIfPresent("sagesync", context, "sageSyncEngine", "syncAll");
        registerIfPresent("attendancereconciliation", context, "attendanceService", "reconcile");
        registerIfPresent("performancecyclecheck", context, "performanceCycleService", "checkCycles");
        registerIfPresent("trainingreminders", context, "trainingEnrollmentService", "sendReminders");
        registerIfPresent("reportcleanup", context, "reportExportService", "cleanupExpired");
        registerIfPresent("documentretention", context, "documentRetentionService", "applyRetentionPolicies");
    }

    /** Job names this instance can actually run, sorted so the log reads the same way every time. */
    public Set<String> jobNames() {
        return Collections.unmodifiableSet(new TreeSet<>(jobs.keySet()));
    }

    /**
     * Run a job by name.
     *
     * @throws IllegalArgumentException if no such job is registered — the name is a contract with
     *         an EventBridge rule, and a typo in it must not look like a job that did nothing.
     */
    public void run(String jobName) {
        String key = jobName == null ? "" : jobName.trim().toLowerCase();
        Runnable job = jobs.get(key);
        if (job == null) {
            throw new IllegalArgumentException(
                    "No scheduled job named '" + jobName + "'. Registered: " + jobNames());
        }

        long start = System.currentTimeMillis();
        log.info("Running scheduled job {}", key);
        job.run();
        log.info("Scheduled job {} completed in {}ms", key, System.currentTimeMillis() - start);
    }

    private void registerIfPresent(String jobName, ApplicationContext context,
                                   String beanName, String methodName) {
        try {
            Object bean = context.getBean(beanName);
            var method = bean.getClass().getMethod(methodName);
            jobs.put(jobName, () -> {
                try {
                    method.invoke(bean);
                } catch (Exception e) {
                    throw new IllegalStateException("Failed to invoke " + beanName + "." + methodName, e);
                }
            });
        } catch (Exception e) {
            log.debug("Scheduled job '{}' not registered: bean '{}' is not available", jobName, beanName);
        }
    }
}
