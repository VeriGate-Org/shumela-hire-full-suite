package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@ConditionalOnMissingBean(LinkedInJobBoardConnector.class)
public class GenericJobBoardConnector implements JobBoardService {

    private static final Logger logger = LoggerFactory.getLogger(GenericJobBoardConnector.class);

    private final JobBoardPostingRepository repository;
    private final AuditLogService auditLogService;

    @Autowired
    public GenericJobBoardConnector(JobBoardPostingRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    @Override
    public JobBoardPosting postToBoard(String jobPostingId, JobBoardType boardType, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(boardType);
        posting.setBoardConfig(boardConfig);

        if (boardType.isRequiresApiIntegration()) {
            // API-based boards: create as pending (would integrate with actual API)
            posting.setStatus(PostingStatus.PENDING);
            String externalId = boardType.name() + "-" + UUID.randomUUID().toString().substring(0, 8);
            posting.setExternalPostId(externalId);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));
            posting.setStatus(PostingStatus.POSTED);
        } else {
            // Non-API boards (PNet, CareerJunction): track manual posting
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            // Set board-specific URLs for manual posting
            switch (boardType) {
                case PNET:
                    posting.setExternalUrl("https://www.pnet.co.za/employers/post-a-job");
                    break;
                case CAREER_JUNCTION:
                    posting.setExternalUrl("https://www.careerjunction.co.za/employers/post-job");
                    break;
                default:
                    break;
            }
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Posted job " + jobPostingId + " to " + boardType.getDisplayName());
        logger.info("Posted job {} to {}", jobPostingId, boardType.getDisplayName());
        return saved;
    }

    @Override
    public JobBoardPosting removePosting(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId.toString(),
                "Removed " + posting.getBoardType().getDisplayName() + " posting");
        return saved;
    }

    @Override
    public JobBoardPosting syncPosting(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        // For non-API boards, sync just checks expiration
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
