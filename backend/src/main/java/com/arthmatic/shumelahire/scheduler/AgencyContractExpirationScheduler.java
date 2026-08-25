package com.arthmatic.shumelahire.scheduler;

import com.arthmatic.shumelahire.service.AgencyPortalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Suspends agencies whose contract end date has passed.
 *
 * <p>The counterpart to {@link JobAdExpirationScheduler}, which has been expiring job ads nightly
 * all along. Agencies had no equivalent: a contract could lapse and the agency kept its portal
 * login and went on submitting candidates, while {@code AgencyResponse} displayed the contract as
 * {@code LAPSED} on a screen nobody had to read.
 *
 * <p>Runs at 03:00 rather than 02:00 so it does not contend with the job-ad job.
 */
@Component
@ConditionalOnProperty(name = "agency.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class AgencyContractExpirationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AgencyContractExpirationScheduler.class);

    @Autowired
    private AgencyPortalService agencyPortalService;

    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    public void suspendExpiredAgencyContracts() {
        logger.info("Starting nightly agency contract expiration task");

        try {
            int suspended = agencyPortalService.suspendExpiredContracts(LocalDate.now());
            logger.info("Nightly agency contract expiration completed. Suspended {} agencies", suspended);
        } catch (Exception e) {
            // Logged rather than rethrown: an exception escaping a @Scheduled method is swallowed by
            // the executor, so this is the only place it would ever be seen.
            logger.error("Error during nightly agency contract expiration", e);
        }
    }
}
