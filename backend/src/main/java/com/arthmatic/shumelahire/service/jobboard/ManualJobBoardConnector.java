package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ManualJobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(ManualJobBoardConnector.class);

    @Autowired
    private JobBoardPostingRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    public JobBoardPosting post(String jobPostingId, JobBoardType boardType, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(boardType);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.POSTED);
        posting.setPostedAt(LocalDateTime.now());
        posting.setExpiresAt(LocalDateTime.now().plusDays(30));

        String portalUrl = getEmployerPortalUrl(boardType);
        if (portalUrl != null) {
            posting.setExternalUrl(portalUrl);
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Manual posting: job " + jobPostingId + " to " + boardType.getDisplayName());
        logger.info("Manual posting created for job {} on {}", jobPostingId, boardType.getDisplayName());
        return saved;
    }

    public JobBoardPosting remove(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));
        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId.toString(),
                "Removed manual " + posting.getBoardType().getDisplayName() + " posting");
        return saved;
    }

    public JobBoardPosting sync(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));
        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }
        return repository.save(posting);
    }

    private String getEmployerPortalUrl(JobBoardType boardType) {
        return switch (boardType) {
            case INTERNAL_PORTAL -> "/internal/jobs";
            case PUBLIC_WEBSITE -> "/jobs";
            case PNET -> "https://www.pnet.co.za/employers/post-a-job";
            case CAREER_JUNCTION -> "https://www.careerjunction.co.za/employers/post-job";
            case INDEED -> "https://employers.indeed.com/jobs";
            case LINKEDIN -> "https://www.linkedin.com/talent/post-a-job";
            default -> null;
        };
    }
}
