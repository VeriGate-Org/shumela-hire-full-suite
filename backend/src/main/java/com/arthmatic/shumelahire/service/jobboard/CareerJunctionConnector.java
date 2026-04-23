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
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@ConditionalOnProperty(name = "job-boards.career-junction.enabled", havingValue = "true")
public class CareerJunctionConnector implements JobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(CareerJunctionConnector.class);

    private static final String CJ_API_BASE = "https://api.careerjunction.co.za/v2";

    @Value("${job-boards.career-junction.api-key:}")
    private String apiKey;

    @Value("${job-boards.career-junction.partner-id:}")
    private String partnerId;

    @Autowired
    private JobBoardPostingDataRepository repository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public JobBoardType getSupportedType() {
        return JobBoardType.CAREER_JUNCTION;
    }

    @Override
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Map EmploymentType to CareerJunction's employment type string.
     */
    private String mapEmploymentType(JobPosting jp) {
        if (jp.getEmploymentType() == null) return "Permanent";
        return switch (jp.getEmploymentType()) {
            case FULL_TIME -> "Permanent";
            case PART_TIME -> "Part-Time";
            case CONTRACT -> "Contract";
            case TEMPORARY -> "Temporary";
            case INTERNSHIP -> "Internship";
            case FREELANCE -> "Freelance";
            default -> "Permanent";
        };
    }

    /**
     * Map ExperienceLevel to CareerJunction's seniority level string.
     */
    private String mapSeniorityLevel(JobPosting jp) {
        if (jp.getExperienceLevel() == null) return "Mid";
        return switch (jp.getExperienceLevel()) {
            case ENTRY_LEVEL -> "Entry";
            case JUNIOR -> "Junior";
            case MID_LEVEL -> "Mid";
            case SENIOR -> "Senior";
            case LEAD -> "Lead";
            case EXECUTIVE -> "Executive";
            case EXPERT -> "Expert";
        };
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.CAREER_JUNCTION);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            // Load full job posting data
            JobPosting jp = jobPostingRepository.findById(jobPostingId)
                    .orElseThrow(() -> new RuntimeException("Job posting not found: " + jobPostingId));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-Key", apiKey);
            headers.set("X-Partner-Id", partnerId);

            // Build enriched CareerJunction job payload
            Map<String, Object> body = new HashMap<>();
            body.put("externalId", jobPostingId);
            body.put("partnerId", partnerId);
            body.put("title", jp.getTitle());
            body.put("description", buildCareerJunctionDescription(jp));
            body.put("department", jp.getDepartment());
            body.put("employmentType", mapEmploymentType(jp));
            body.put("seniorityLevel", mapSeniorityLevel(jp));

            // Location
            Map<String, Object> location = new HashMap<>();
            location.put("country", "South Africa");
            if (jp.getLocation() != null && !jp.getLocation().isBlank()) {
                location.put("city", jp.getLocation());
            }
            if (Boolean.TRUE.equals(jp.getRemoteWorkAllowed())) {
                location.put("workFromHome", true);
            }
            body.put("location", location);

            // Salary range
            if (jp.getSalaryMin() != null || jp.getSalaryMax() != null) {
                Map<String, Object> salary = new HashMap<>();
                if (jp.getSalaryMin() != null) {
                    salary.put("min", jp.getSalaryMin().intValue());
                }
                if (jp.getSalaryMax() != null) {
                    salary.put("max", jp.getSalaryMax().intValue());
                }
                salary.put("currency", jp.getSalaryCurrency() != null ? jp.getSalaryCurrency() : "ZAR");
                salary.put("frequency", "Annual");
                body.put("salary", salary);
            }

            // Application deadline
            if (jp.getApplicationDeadline() != null) {
                body.put("closingDate", jp.getApplicationDeadline().format(DateTimeFormatter.ISO_LOCAL_DATE));
            }

            // Number of positions
            if (jp.getPositionsAvailable() != null && jp.getPositionsAvailable() > 0) {
                body.put("numberOfPositions", jp.getPositionsAvailable());
            }

            // Travel requirement
            if (Boolean.TRUE.equals(jp.getTravelRequired())) {
                body.put("travelRequired", true);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    CJ_API_BASE + "/jobs",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            String externalId = (String) response.getBody().get("jobId");
            if (externalId == null) {
                externalId = "CJ-" + UUID.randomUUID().toString().substring(0, 8);
            }

            posting.setExternalPostId(externalId);
            posting.setExternalUrl("https://www.careerjunction.co.za/jobs/" + externalId);
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            logger.info("Posted job {} to CareerJunction with ID {} — title: '{}'", jobPostingId, externalId, jp.getTitle());
        } catch (Exception e) {
            posting.setStatus(PostingStatus.FAILED);
            posting.setErrorMessage(e.getMessage());
            logger.error("Failed to post job {} to CareerJunction: {}", jobPostingId, e.getMessage());
        }

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId().toString(),
                "Posted job " + jobPostingId + " to CareerJunction");
        return saved;
    }

    /**
     * Build a rich description for CareerJunction from JobPosting fields.
     */
    private String buildCareerJunctionDescription(JobPosting jp) {
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
    public JobBoardPosting remove(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", apiKey);
            headers.set("X-Partner-Id", partnerId);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(
                    CJ_API_BASE + "/jobs/" + posting.getExternalPostId(),
                    HttpMethod.DELETE,
                    request,
                    Void.class
            );

            logger.info("Removed CareerJunction posting {} (external: {})", postingId, posting.getExternalPostId());
        } catch (Exception e) {
            logger.warn("Failed to remove CareerJunction posting {}: {}", postingId, e.getMessage());
        }

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId,
                "Removed CareerJunction posting");
        return saved;
    }

    @Override
    public JobBoardPosting sync(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", apiKey);
            headers.set("X-Partner-Id", partnerId);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            // Fetch posting analytics from CareerJunction
            ResponseEntity<Map> response = restTemplate.exchange(
                    CJ_API_BASE + "/jobs/" + posting.getExternalPostId() + "/analytics",
                    HttpMethod.GET,
                    request,
                    Map.class
            );

            Map<String, Object> analytics = response.getBody();
            if (analytics != null) {
                if (analytics.get("views") instanceof Number n) posting.setViewCount(n.intValue());
                if (analytics.get("clicks") instanceof Number n) posting.setClickCount(n.intValue());
                if (analytics.get("applications") instanceof Number n) posting.setApplicationCount(n.intValue());
            }

            // Check posting status from CareerJunction
            try {
                ResponseEntity<Map> statusResponse = restTemplate.exchange(
                        CJ_API_BASE + "/jobs/" + posting.getExternalPostId(),
                        HttpMethod.GET,
                        request,
                        Map.class
                );

                Map<String, Object> postingData = statusResponse.getBody();
                if (postingData != null) {
                    String status = (String) postingData.get("status");
                    if ("expired".equalsIgnoreCase(status) || "closed".equalsIgnoreCase(status)) {
                        posting.setStatus(PostingStatus.EXPIRED);
                    }
                }
            } catch (Exception e) {
                logger.debug("Could not fetch CareerJunction posting status for {}: {}", postingId, e.getMessage());
            }
        } catch (Exception e) {
            logger.warn("Failed to sync CareerJunction posting {}: {}", postingId, e.getMessage());
        }

        // Check local expiry
        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        return repository.save(posting);
    }
}
