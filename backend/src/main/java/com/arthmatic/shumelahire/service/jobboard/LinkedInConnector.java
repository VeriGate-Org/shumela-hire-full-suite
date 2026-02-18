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
@ConditionalOnProperty(name = "job-boards.linkedin.enabled", havingValue = "true")
public class LinkedInConnector implements JobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(LinkedInConnector.class);

    @Value("${job-boards.linkedin.api-key:}")
    private String apiKey;

    @Value("${job-boards.linkedin.api-secret:}")
    private String apiSecret;

    @Value("${job-boards.linkedin.org-id:}")
    private String orgId;

    @Autowired
    private JobBoardPostingRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public JobBoardType getSupportedType() {
        return JobBoardType.LINKEDIN;
    }

    @Override
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.LINKEDIN);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("author", "urn:li:organization:" + orgId);
            body.put("externalJobPostingId", jobPostingId);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.linkedin.com/v2/simpleJobPostings",
                HttpMethod.POST,
                request,
                Map.class
            );

            String externalId = response.getHeaders().getFirst("x-restli-id");
            if (externalId == null) {
                externalId = "LI-" + UUID.randomUUID().toString().substring(0, 12);
            }

            posting.setExternalPostId(externalId);
            posting.setExternalUrl("https://www.linkedin.com/jobs/view/" + externalId);
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            logger.info("Posted job {} to LinkedIn with ID {}", jobPostingId, externalId);
        } catch (Exception e) {
            posting.setStatus(PostingStatus.FAILED);
            posting.setErrorMessage(e.getMessage());
            logger.error("Failed to post job {} to LinkedIn: {}", jobPostingId, e.getMessage());
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Posted job " + jobPostingId + " to LinkedIn");
        return saved;
    }

    @Override
    public JobBoardPosting remove(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(
                "https://api.linkedin.com/v2/simpleJobPostings/" + posting.getExternalPostId(),
                HttpMethod.DELETE,
                request,
                Void.class
            );
        } catch (Exception e) {
            logger.warn("Failed to remove LinkedIn posting {}: {}", postingId, e.getMessage());
        }

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId.toString(),
                "Removed LinkedIn posting " + posting.getExternalPostId());
        return saved;
    }

    @Override
    public JobBoardPosting sync(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.linkedin.com/v2/simpleJobPostings/" + posting.getExternalPostId() + "/analytics",
                HttpMethod.GET,
                request,
                Map.class
            );

            Map<String, Object> analytics = response.getBody();
            if (analytics != null) {
                if (analytics.get("viewCount") instanceof Number n) posting.setViewCount(n.intValue());
                if (analytics.get("clickCount") instanceof Number n) posting.setClickCount(n.intValue());
                if (analytics.get("applicationCount") instanceof Number n) posting.setApplicationCount(n.intValue());
            }
        } catch (Exception e) {
            logger.warn("Failed to sync LinkedIn posting {}: {}", postingId, e.getMessage());
        }

        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        return repository.save(posting);
    }
}
