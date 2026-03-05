package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import com.arthmatic.shumelahire.repository.JobAdRepository;
import com.arthmatic.shumelahire.repository.JobPostingRepository;
import com.arthmatic.shumelahire.service.JobAdSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * On startup, backfills JobAd records for any published JobPostings
 * that don't yet have a linked ad.
 */
@Component
public class JobAdSyncStartup {

    private static final Logger logger = LoggerFactory.getLogger(JobAdSyncStartup.class);

    private final JobPostingRepository jobPostingRepository;
    private final JobAdRepository jobAdRepository;
    private final JobAdSyncService jobAdSyncService;

    public JobAdSyncStartup(JobPostingRepository jobPostingRepository,
                            JobAdRepository jobAdRepository,
                            JobAdSyncService jobAdSyncService) {
        this.jobPostingRepository = jobPostingRepository;
        this.jobAdRepository = jobAdRepository;
        this.jobAdSyncService = jobAdSyncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void syncPublishedPostings() {
        List<JobPosting> published = jobPostingRepository
                .findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED);

        int synced = 0;
        for (JobPosting posting : published) {
            if (jobAdRepository.findByJobPostingId(posting.getId()).isEmpty()) {
                jobAdSyncService.onJobPostingPublished(posting);
                synced++;
            }
        }

        if (synced > 0) {
            logger.info("Backfilled {} JobAd records for published JobPostings", synced);
        }
    }
}
