package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Component
@ConditionalOnProperty(name = "job-boards.indeed.enabled", havingValue = "true")
public class IndeedConnector implements JobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(IndeedConnector.class);

    @Value("${job-boards.indeed.employer-id:}")
    private String employerId;

    @Value("${job-boards.indeed.api-token:}")
    private String apiToken;

    @Autowired
    private JobBoardPostingRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public JobBoardType getSupportedType() {
        return JobBoardType.INDEED;
    }

    @Override
    public boolean isEnabled() {
        return apiToken != null && !apiToken.isBlank();
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.INDEED);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiToken);
            headers.set("Indeed-Employer-Id", employerId);

            Map<String, Object> body = new HashMap<>();
            body.put("externalId", jobPostingId);
            body.put("employerId", employerId);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                "https://apis.indeed.com/v1/employer/" + employerId + "/jobs",
                HttpMethod.POST,
                request,
                Map.class
            );

            String externalId = (String) response.getBody().get("jobKey");
            if (externalId == null) {
                externalId = "IND-" + UUID.randomUUID().toString().substring(0, 12);
            }

            posting.setExternalPostId(externalId);
            posting.setExternalUrl("https://www.indeed.com/viewjob?jk=" + externalId);
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            logger.info("Posted job {} to Indeed with key {}", jobPostingId, externalId);
        } catch (Exception e) {
            posting.setStatus(PostingStatus.FAILED);
            posting.setErrorMessage(e.getMessage());
            logger.error("Failed to post job {} to Indeed: {}", jobPostingId, e.getMessage());
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Posted job " + jobPostingId + " to Indeed");
        return saved;
    }

    @Override
    public JobBoardPosting remove(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(
                "https://apis.indeed.com/v1/employer/" + employerId + "/jobs/" + posting.getExternalPostId(),
                HttpMethod.DELETE,
                request,
                Void.class
            );
        } catch (Exception e) {
            logger.warn("Failed to remove Indeed posting {}: {}", postingId, e.getMessage());
        }

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId.toString(),
                "Removed Indeed posting");
        return saved;
    }

    @Override
    public JobBoardPosting sync(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        return repository.save(posting);
    }
}
