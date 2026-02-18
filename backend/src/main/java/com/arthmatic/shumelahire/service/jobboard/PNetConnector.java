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
@ConditionalOnProperty(name = "job-boards.pnet.enabled", havingValue = "true")
public class PNetConnector implements JobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(PNetConnector.class);

    @Value("${job-boards.pnet.api-key:}")
    private String apiKey;

    @Autowired
    private JobBoardPostingRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public JobBoardType getSupportedType() {
        return JobBoardType.PNET;
    }

    @Override
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.PNET);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            headers.set("X-API-Key", apiKey);

            String xmlPayload = "<job><externalId>" + jobPostingId + "</externalId></job>";
            HttpEntity<String> request = new HttpEntity<>(xmlPayload, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.pnet.co.za/v1/jobs",
                HttpMethod.POST,
                request,
                String.class
            );

            String externalId = "PNET-" + UUID.randomUUID().toString().substring(0, 8);
            posting.setExternalPostId(externalId);
            posting.setExternalUrl("https://www.pnet.co.za/jobs/" + externalId);
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            logger.info("Posted job {} to PNet with ID {}", jobPostingId, externalId);
        } catch (Exception e) {
            posting.setStatus(PostingStatus.FAILED);
            posting.setErrorMessage(e.getMessage());
            logger.error("Failed to post job {} to PNet: {}", jobPostingId, e.getMessage());
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Posted job " + jobPostingId + " to PNet");
        return saved;
    }

    @Override
    public JobBoardPosting remove(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", apiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(
                "https://api.pnet.co.za/v1/jobs/" + posting.getExternalPostId(),
                HttpMethod.DELETE,
                request,
                Void.class
            );
        } catch (Exception e) {
            logger.warn("Failed to remove PNet posting {}: {}", postingId, e.getMessage());
        }

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId.toString(),
                "Removed PNet posting");
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
