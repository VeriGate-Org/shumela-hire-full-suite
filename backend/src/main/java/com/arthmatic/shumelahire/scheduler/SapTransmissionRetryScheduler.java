package com.arthmatic.shumelahire.scheduler;

import com.arthmatic.shumelahire.entity.SapPayrollTransmission;
import com.arthmatic.shumelahire.entity.TransmissionStatus;
import com.arthmatic.shumelahire.repository.SapPayrollTransmissionDataRepository;
import com.arthmatic.shumelahire.service.SapPayrollService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job that automatically retries failed SAP payroll transmissions.
 * Runs every 15 minutes when SAP payroll integration is enabled.
 *
 * Also checks for stale "TRANSMITTED" records that haven't been confirmed
 * within 24 hours and re-polls SAP for their status.
 */
@Component
@ConditionalOnProperty(name = "sap.payroll.enabled", havingValue = "true")
public class SapTransmissionRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(SapTransmissionRetryScheduler.class);

    @Autowired
    private SapPayrollTransmissionDataRepository transmissionRepository;

    @Autowired
    private SapPayrollService sapPayrollService;

    /**
     * Retry failed transmissions every 15 minutes.
     * Only retries transmissions that haven't exceeded their max retry count
     * and whose nextRetryAt has passed.
     */
    @Scheduled(fixedDelay = 900_000) // 15 minutes
    public void retryFailedTransmissions() {
        List<SapPayrollTransmission> retryable = transmissionRepository.findRetryable(LocalDateTime.now());

        if (retryable.isEmpty()) {
            return;
        }

        log.info("SAP retry scheduler: found {} retryable transmissions", retryable.size());

        for (SapPayrollTransmission transmission : retryable) {
            try {
                log.info("Retrying SAP transmission {} (attempt {}/{})",
                        transmission.getTransmissionId(),
                        transmission.getRetryCount() + 1,
                        transmission.getMaxRetries());

                sapPayrollService.retryFailedTransmission(
                        transmission.getTransmissionId(),
                        transmission.getInitiatedBy() != null ? transmission.getInitiatedBy() : 0L);

            } catch (Exception e) {
                log.error("Scheduled retry failed for transmission {}: {}",
                        transmission.getTransmissionId(), e.getMessage());
            }
        }
    }

    /**
     * Check stale transmissions every hour.
     * If a transmission has been in TRANSMITTED state for over 24 hours
     * without SAP confirmation, poll SAP for its status.
     */
    @Scheduled(fixedDelay = 3_600_000) // 1 hour
    public void checkStaleTransmissions() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<SapPayrollTransmission> stale = transmissionRepository.findStaleTransmissions(cutoff);

        if (stale.isEmpty()) {
            return;
        }

        log.info("SAP stale check: found {} transmissions awaiting confirmation for >24h", stale.size());

        for (SapPayrollTransmission transmission : stale) {
            try {
                sapPayrollService.getTransmissionStatus(transmission.getTransmissionId());
            } catch (Exception e) {
                log.warn("Stale check failed for transmission {}: {}",
                        transmission.getTransmissionId(), e.getMessage());
            }
        }
    }
}
