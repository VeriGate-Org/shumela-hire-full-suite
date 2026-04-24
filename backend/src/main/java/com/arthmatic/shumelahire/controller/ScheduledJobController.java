package com.arthmatic.shumelahire.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Internal controller for scheduled job invocations via EventBridge → Lambda.
 *
 * When running in Lambda, @Scheduled annotations are disabled (thread pool size = 0).
 * Instead, EventBridge rules invoke the Lambda function with HTTP requests routed here
 * through the Lambda Web Adapter.
 *
 * This controller is only active in the "lambda" profile.
 */
@RestController
@RequestMapping("/api/internal/scheduled")
@Profile("lambda")
public class ScheduledJobController {

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobController.class);

    // Inject the actual scheduler/service beans that contain the business logic
    private final Map<String, Runnable> jobRegistry;

    public ScheduledJobController(
            org.springframework.context.ApplicationContext context) {
        // Build a registry of job names to their execution methods.
        // Each entry maps an EventBridge rule name to the corresponding scheduler method.
        this.jobRegistry = new java.util.HashMap<>();

        tryRegister("metricscomputation", context, "metricsComputationScheduler", "computeMetrics");
        tryRegister("jobadexpiration", context, "jobAdExpirationScheduler", "expireStaleJobAds");
        tryRegister("saptransmissionretry", context, "sapTransmissionRetryScheduler", "retryFailedTransmissions");
        tryRegister("compliancereminders", context, "complianceReminderScheduler", "sendReminders");
        tryRegister("leavecarryforward", context, "leaveBalanceService", "processAnnualCarryForward");
        tryRegister("securitycleanup", context, "securityMonitoringService", "cleanupExpiredSessions");
        tryRegister("sagesync", context, "sageSyncEngine", "syncAll");
        tryRegister("attendancereconciliation", context, "attendanceService", "reconcile");
        tryRegister("performancecyclecheck", context, "performanceCycleService", "checkCycles");
        tryRegister("trainingreminders", context, "trainingEnrollmentService", "sendReminders");
        tryRegister("reportcleanup", context, "reportExportService", "cleanupExpired");
        tryRegister("documentretention", context, "documentRetentionService", "applyRetentionPolicies");
    }

    @PostMapping("/{jobName}")
    public ResponseEntity<Map<String, String>> executeJob(@PathVariable String jobName) {
        log.info("Executing scheduled job: {}", jobName);
        long start = System.currentTimeMillis();

        Runnable job = jobRegistry.get(jobName.toLowerCase());
        if (job == null) {
            log.warn("Unknown scheduled job: {}", jobName);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unknown job: " + jobName));
        }

        try {
            job.run();
            long elapsed = System.currentTimeMillis() - start;
            log.info("Scheduled job {} completed in {}ms", jobName, elapsed);
            return ResponseEntity.ok(Map.of(
                    "job", jobName,
                    "status", "completed",
                    "durationMs", String.valueOf(elapsed)
            ));
        } catch (Exception e) {
            log.error("Scheduled job {} failed: {}", jobName, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage(), "job", jobName));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "registeredJobs", jobRegistry.keySet()
        ));
    }

    private void tryRegister(String jobName, org.springframework.context.ApplicationContext context,
                              String beanName, String methodName) {
        try {
            Object bean = context.getBean(beanName);
            var method = bean.getClass().getMethod(methodName);
            jobRegistry.put(jobName, () -> {
                try {
                    method.invoke(bean);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to invoke " + beanName + "." + methodName, e);
                }
            });
        } catch (Exception e) {
            log.debug("Skipping job registration for '{}': bean '{}' not available", jobName, beanName);
        }
    }
}
