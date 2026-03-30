package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.JobAdDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Synchronises JobAd records with their source JobPosting.
 *
 * When a JobPosting is published, a corresponding JobAd is auto-created
 * (or updated if one already exists) with both internal and external
 * channels enabled. Updates and lifecycle transitions on the posting
 * are reflected on the ad automatically.
 */
@Service
@Transactional
public class JobAdSyncService {

    private static final Logger logger = LoggerFactory.getLogger(JobAdSyncService.class);

    private final JobAdDataRepository jobAdRepository;
    private final SlugGeneratorService slugGeneratorService;

    public JobAdSyncService(JobAdDataRepository jobAdRepository, SlugGeneratorService slugGeneratorService) {
        this.jobAdRepository = jobAdRepository;
        this.slugGeneratorService = slugGeneratorService;
    }

    /**
     * Create or update a JobAd when a JobPosting is published.
     */
    public void onJobPostingPublished(JobPosting posting) {
        JobAd ad = jobAdRepository.findByJobPostingId(String.valueOf(posting.getId())).orElse(null);

        if (ad == null) {
            ad = new JobAd();
            ad.setJobPostingId(posting.getId());
            ad.setCreatedBy(String.valueOf(posting.getPublishedBy() != null ? posting.getPublishedBy() : posting.getCreatedBy()));
            ad.setTenantId(posting.getTenantId());
        }

        syncFields(ad, posting);
        ad.setStatus(JobAdStatus.PUBLISHED);
        ad.setChannelInternal(true);
        ad.setChannelExternal(true);

        // Generate slug if not set
        if (ad.getSlug() == null || ad.getSlug().isBlank()) {
            String slug = slugGeneratorService.generateUniqueSlug(
                    posting.getTitle(),
                    jobAdRepository::existsBySlug
            );
            ad.setSlug(slug);
        }

        jobAdRepository.save(ad);
        logger.info("Synced JobAd for JobPosting {} (ad id={})", posting.getId(), ad.getId());
    }

    /**
     * Update the linked JobAd when a published JobPosting is edited.
     */
    public void onJobPostingUpdated(JobPosting posting) {
        jobAdRepository.findByJobPostingId(String.valueOf(posting.getId())).ifPresent(ad -> {
            syncFields(ad, posting);
            jobAdRepository.save(ad);
            logger.info("Updated JobAd {} from JobPosting {}", ad.getId(), posting.getId());
        });
    }

    /**
     * Unpublish the linked JobAd when a JobPosting is unpublished.
     */
    public void onJobPostingUnpublished(JobPosting posting) {
        jobAdRepository.findByJobPostingId(String.valueOf(posting.getId())).ifPresent(ad -> {
            if (ad.isPublished()) {
                ad.setStatus(JobAdStatus.UNPUBLISHED);
                jobAdRepository.save(ad);
                logger.info("Unpublished JobAd {} for JobPosting {}", ad.getId(), posting.getId());
            }
        });
    }

    /**
     * Unpublish the linked JobAd when a JobPosting is closed.
     */
    public void onJobPostingClosed(JobPosting posting) {
        jobAdRepository.findByJobPostingId(String.valueOf(posting.getId())).ifPresent(ad -> {
            if (ad.isPublished()) {
                ad.setStatus(JobAdStatus.UNPUBLISHED);
                jobAdRepository.save(ad);
                logger.info("Closed JobAd {} for JobPosting {}", ad.getId(), posting.getId());
            }
        });
    }

    /**
     * Re-publish the linked JobAd when a previously unpublished JobPosting is re-published.
     */
    public void onJobPostingRepublished(JobPosting posting) {
        onJobPostingPublished(posting);
    }

    /**
     * Copy relevant fields from the JobPosting to the JobAd.
     */
    private void syncFields(JobAd ad, JobPosting posting) {
        ad.setTitle(posting.getTitle());
        ad.setHtmlBody(buildHtmlBody(posting));
        ad.setDepartment(posting.getDepartment());
        ad.setLocation(posting.getLocation());
        ad.setEmploymentType(posting.getEmploymentType() != null ? posting.getEmploymentType().name() : null);
        ad.setSalaryRangeMin(posting.getSalaryMin());
        ad.setSalaryRangeMax(posting.getSalaryMax());
        ad.setSalaryCurrency(posting.getSalaryCurrency());

        // Map application deadline to closing date
        LocalDateTime deadline = posting.getApplicationDeadline();
        ad.setClosingDate(deadline != null ? deadline.toLocalDate() : null);
    }

    /**
     * Generate a structured HTML body from the JobPosting's fields.
     */
    private String buildHtmlBody(JobPosting posting) {
        StringBuilder html = new StringBuilder();

        appendSection(html, null, posting.getDescription());
        appendSection(html, "Responsibilities", posting.getResponsibilities());
        appendSection(html, "Requirements", posting.getRequirements());
        appendSection(html, "Qualifications", posting.getQualifications());
        appendSection(html, "Benefits", posting.getBenefits());

        // Salary line
        if (posting.getSalaryMin() != null || posting.getSalaryMax() != null) {
            html.append("<p><strong>Salary:</strong> ").append(posting.getSalaryRange()).append("</p>\n");
        }

        // Location & type
        StringBuilder meta = new StringBuilder();
        if (posting.getLocation() != null) meta.append(posting.getLocation());
        if (posting.getEmploymentType() != null) {
            if (meta.length() > 0) meta.append(" · ");
            meta.append(posting.getEmploymentType().getDisplayName());
        }
        if (Boolean.TRUE.equals(posting.getRemoteWorkAllowed())) {
            if (meta.length() > 0) meta.append(" · ");
            meta.append("Remote work available");
        }
        if (meta.length() > 0) {
            html.append("<p>").append(meta).append("</p>\n");
        }

        return html.toString();
    }

    private void appendSection(StringBuilder html, String heading, String content) {
        if (content == null || content.isBlank()) return;
        if (heading != null) {
            html.append("<h3>").append(heading).append("</h3>\n");
        }
        html.append("<p>").append(content.replace("\n", "<br/>")).append("</p>\n");
    }
}
