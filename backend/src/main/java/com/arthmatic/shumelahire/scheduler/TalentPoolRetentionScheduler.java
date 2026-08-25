package com.arthmatic.shumelahire.scheduler;

import com.arthmatic.shumelahire.service.TalentPoolRetentionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Ages candidates out of talent pools, once somebody has decided how long they should stay.
 *
 * <p><b>Off unless explicitly switched on</b>, and off again at the service level unless a retention
 * period is configured. That is two switches for one job, deliberately: this is the only scheduled
 * task in the system that destroys personal data, and the cost of it running early is unrecoverable
 * while the cost of it running late is a compliance gap somebody can still close.
 *
 * <p>Follows {@link DocumentRetentionScheduler}, which is also {@code matchIfMissing = false} — the
 * agency and job-ad schedulers default to on, because suspending an agency or expiring an advert
 * can be undone.
 *
 * <p>Runs at 04:00, after the job-ad (02:00) and agency (03:00) jobs.
 */
@Component
@ConditionalOnProperty(name = "talent-pool.retention.scheduler.enabled",
        havingValue = "true", matchIfMissing = false)
public class TalentPoolRetentionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(TalentPoolRetentionScheduler.class);

    @Autowired
    private TalentPoolRetentionService retentionService;

    @Scheduled(cron = "0 0 4 * * *", zone = "UTC")
    public void applyTalentPoolRetention() {
        if (!retentionService.isConfigured()) {
            // Said every run rather than returning quietly: the scheduler being enabled while no
            // period is set is a half-finished rollout, and it should not look like a working one.
            logger.info("Talent pool retention scheduler is enabled but no retention period is set "
                    + "(shumelahire.retention.talent-pool-months). Nothing to do.");
            return;
        }

        LocalDate today = LocalDate.now();
        try {
            int notified = retentionService.sendRetentionNotices(today);
            int deleted = retentionService.purgeExpiredEntries(today);
            logger.info("Talent pool retention completed. Notices sent: {}, entries deleted: {}",
                    notified, deleted);
        } catch (Exception e) {
            // An exception escaping a @Scheduled method is swallowed by the executor, so this is
            // the only place it would ever be seen.
            logger.error("Error during talent pool retention", e);
        }
    }
}
