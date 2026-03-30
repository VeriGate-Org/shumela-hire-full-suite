package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
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

    private static final String INDEED_API_BASE = "https://apis.indeed.com/v1";

    @Value("${job-boards.indeed.employer-id:}")
    private String employerId;

    @Value("${job-boards.indeed.api-token:}")
    private String apiToken;

    @Autowired
    private JobBoardPostingDataRepository repository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

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

    /**
     * Map EmploymentType enum to Indeed's job type string.
     */
    private String mapJobType(JobPosting jp) {
        if (jp.getEmploymentType() == null) return "FULLTIME";
        return switch (jp.getEmploymentType()) {
            case FULL_TIME -> "FULLTIME";
            case PART_TIME -> "PARTTIME";
            case CONTRACT -> "CONTRACT";
            case TEMPORARY -> "TEMPORARY";
            case INTERNSHIP -> "INTERN";
            case FREELANCE -> "CONTRACT";
            default -> "FULLTIME";
        };
    }

    /**
     * Map ExperienceLevel enum to Indeed's experience level string.
     */
    private String mapExperienceLevel(JobPosting jp) {
        if (jp.getExperienceLevel() == null) return "MID_LEVEL";
        return switch (jp.getExperienceLevel()) {
            case ENTRY_LEVEL -> "ENTRY_LEVEL";
            case JUNIOR -> "ENTRY_LEVEL";
            case MID_LEVEL -> "MID_LEVEL";
            case SENIOR -> "SENIOR_LEVEL";
            case LEAD -> "SENIOR_LEVEL";
            case EXECUTIVE -> "EXECUTIVE";
            case EXPERT -> "EXECUTIVE";
        };
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.INDEED);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            // Load full job posting data
            JobPosting jp = jobPostingRepository.findById(jobPostingId)
                    .orElseThrow(() -> new RuntimeException("Job posting not found: " + jobPostingId));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiToken);
            headers.set("Indeed-Employer-Id", employerId);

            // Build enriched Indeed job payload
            Map<String, Object> body = new HashMap<>();
            body.put("externalId", jobPostingId);
            body.put("employerId", employerId);
            body.put("title", jp.getTitle());
            body.put("description", buildIndeedDescription(jp));
            body.put("jobType", mapJobType(jp));
            body.put("experienceLevel", mapExperienceLevel(jp));

            // Location
            Map<String, Object> location = new HashMap<>();
            location.put("country", "ZA");
            if (jp.getLocation() != null && !jp.getLocation().isBlank()) {
                location.put("city", jp.getLocation());
            }
            if (Boolean.TRUE.equals(jp.getRemoteWorkAllowed())) {
                location.put("remoteType", "FULLY_REMOTE");
            }
            body.put("location", location);

            // Department
            if (jp.getDepartment() != null && !jp.getDepartment().isBlank()) {
                body.put("department", jp.getDepartment());
            }

            // Salary
            if (jp.getSalaryMin() != null || jp.getSalaryMax() != null) {
                Map<String, Object> salary = new HashMap<>();
                if (jp.getSalaryMin() != null) {
                    salary.put("min", jp.getSalaryMin().doubleValue());
                }
                if (jp.getSalaryMax() != null) {
                    salary.put("max", jp.getSalaryMax().doubleValue());
                }
                salary.put("currency", jp.getSalaryCurrency() != null ? jp.getSalaryCurrency() : "ZAR");
                salary.put("period", "YEAR");
                body.put("salary", salary);
            }

            // Application deadline
            if (jp.getApplicationDeadline() != null) {
                body.put("applicationDeadline", jp.getApplicationDeadline().toString());
            }

            // Number of openings
            if (jp.getPositionsAvailable() != null && jp.getPositionsAvailable() > 0) {
                body.put("openings", jp.getPositionsAvailable());
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    INDEED_API_BASE + "/employer/" + employerId + "/jobs",
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

            logger.info("Posted job {} to Indeed with key {} — title: '{}'", jobPostingId, externalId, jp.getTitle());
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

    /**
     * Build a rich description for Indeed from the JobPosting fields.
     */
    private String buildIndeedDescription(JobPosting jp) {
        StringBuilder sb = new StringBuilder();
        sb.append(jp.getDescription());

        if (jp.getResponsibilities() != null && !jp.getResponsibilities().isBlank()) {
            sb.append("\n\nKey Responsibilities:\n").append(jp.getResponsibilities());
        }
        if (jp.getRequirements() != null && !jp.getRequirements().isBlank()) {
            sb.append("\n\nRequirements:\n").append(jp.getRequirements());
        }
        if (jp.getQualifications() != null && !jp.getQualifications().isBlank()) {
            sb.append("\n\nQualifications:\n").append(jp.getQualifications());
        }
        if (jp.getBenefits() != null && !jp.getBenefits().isBlank()) {
            sb.append("\n\nBenefits:\n").append(jp.getBenefits());
        }

        return sb.toString();
    }

    @Override
    public JobBoardPosting remove(Long postingId) {
        JobBoardPosting posting = repository.findById(String.valueOf(postingId))
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiToken);
            headers.set("Indeed-Employer-Id", employerId);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(
                    INDEED_API_BASE + "/employer/" + employerId + "/jobs/" + posting.getExternalPostId(),
                    HttpMethod.DELETE,
                    request,
                    Void.class
            );

            logger.info("Removed Indeed posting {} (external: {})", postingId, posting.getExternalPostId());
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
        JobBoardPosting posting = repository.findById(String.valueOf(postingId))
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiToken);
            headers.set("Indeed-Employer-Id", employerId);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            // Fetch posting analytics from Indeed
            ResponseEntity<Map> response = restTemplate.exchange(
                    INDEED_API_BASE + "/employer/" + employerId + "/jobs/" + posting.getExternalPostId() + "/analytics",
                    HttpMethod.GET,
                    request,
                    Map.class
            );

            Map<String, Object> analytics = response.getBody();
            if (analytics != null) {
                if (analytics.get("impressions") instanceof Number n) posting.setViewCount(n.intValue());
                if (analytics.get("clicks") instanceof Number n) posting.setClickCount(n.intValue());
                if (analytics.get("applies") instanceof Number n) posting.setApplicationCount(n.intValue());
            }

            // Check posting status from Indeed
            try {
                ResponseEntity<Map> statusResponse = restTemplate.exchange(
                        INDEED_API_BASE + "/employer/" + employerId + "/jobs/" + posting.getExternalPostId(),
                        HttpMethod.GET,
                        request,
                        Map.class
                );

                Map<String, Object> postingData = statusResponse.getBody();
                if (postingData != null) {
                    String status = (String) postingData.get("status");
                    if ("EXPIRED".equals(status) || "CLOSED".equals(status)) {
                        posting.setStatus(PostingStatus.EXPIRED);
                    }
                }
            } catch (Exception e) {
                logger.debug("Could not fetch Indeed posting status for {}: {}", postingId, e.getMessage());
            }
        } catch (Exception e) {
            logger.warn("Failed to sync Indeed posting {}: {}", postingId, e.getMessage());
        }

        // Check local expiry
        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        return repository.save(posting);
    }
}
