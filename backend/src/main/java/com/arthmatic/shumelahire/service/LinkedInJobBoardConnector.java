package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@ConditionalOnProperty(name = "job-boards.linkedin.enabled", havingValue = "true", matchIfMissing = false)
public class LinkedInJobBoardConnector implements JobBoardService {

    private static final Logger logger = LoggerFactory.getLogger(LinkedInJobBoardConnector.class);

    private final JobBoardPostingRepository repository;
    private final AuditLogService auditLogService;

    @Value("${job-boards.linkedin.org-id:}")
    private String linkedInOrgId;

    @Autowired
    public LinkedInJobBoardConnector(JobBoardPostingRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    @Override
    public JobBoardPosting postToBoard(String jobPostingId, JobBoardType boardType, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.LINKEDIN);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            // Stub: In production, this would call the LinkedIn Jobs Posting API
            // POST https://api.linkedin.com/v2/simpleJobPostings
            String externalId = "LI-" + UUID.randomUUID().toString().substring(0, 12);
            posting.setExternalPostId(externalId);
            posting.setExternalUrl("https://www.linkedin.com/jobs/view/" + externalId);
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            logger.info("Posted job {} to LinkedIn with external ID {}", jobPostingId, externalId);
        } catch (Exception e) {
            posting.setStatus(PostingStatus.FAILED);
            posting.setErrorMessage(e.getMessage());
            logger.error("Failed to post job {} to LinkedIn", jobPostingId, e);
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Posted job " + jobPostingId + " to LinkedIn");
        return saved;
    }

    @Override
    public JobBoardPosting removePosting(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        // Stub: Would call LinkedIn API to remove the posting
        posting.setStatus(PostingStatus.REMOVED);

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId.toString(),
                "Removed LinkedIn posting " + posting.getExternalPostId());
        return saved;
    }

    @Override
    public JobBoardPosting syncPosting(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        // Stub: Would call LinkedIn API to fetch stats
        // In production, would pull view count, click count, application count
        posting.setViewCount(posting.getViewCount() + (int)(Math.random() * 50));
        posting.setClickCount(posting.getClickCount() + (int)(Math.random() * 10));
        posting.setApplicationCount(posting.getApplicationCount() + (int)(Math.random() * 3));

        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        return repository.save(posting);
    }

    @Override
    public List<JobBoardPosting> getPostingsByJob(String jobPostingId) {
        return repository.findByJobPostingId(jobPostingId);
    }
}
