package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Component
@ConditionalOnProperty(name = "job-boards.linkedin.enabled", havingValue = "true")
public class LinkedInConnector implements JobBoardConnector {

  private static final Logger logger = LoggerFactory.getLogger(LinkedInConnector.class);

  private static final String LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
  private static final String LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

  @Value("${job-boards.linkedin.api-key:}")
  private String apiKey;

  @Value("${job-boards.linkedin.api-secret:}")
  private String apiSecret;

  @Value("${job-boards.linkedin.org-id:}")
  private String orgId;

  @Autowired private JobBoardPostingDataRepository repository;

  @Autowired private JobPostingDataRepository jobPostingRepository;

  @Autowired private AuditLogService auditLogService;

  private final RestTemplate restTemplate = new RestTemplate();

  // OAuth 2.0 token cache
  private String cachedAccessToken;
  private LocalDateTime tokenExpiresAt;

  @Override
  public JobBoardType getSupportedType() {
    return JobBoardType.LINKEDIN;
  }

  @Override
  public boolean isEnabled() {
    return apiKey != null && !apiKey.isBlank();
  }

  /**
   * Acquire an OAuth 2.0 access token using client credentials grant. Caches the token and
   * refreshes it 5 minutes before expiry.
   */
  private String getAccessToken() {
    if (cachedAccessToken != null
        && tokenExpiresAt != null
        && LocalDateTime.now().isBefore(tokenExpiresAt.minus(5, ChronoUnit.MINUTES))) {
      return cachedAccessToken;
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("grant_type", "client_credentials");
    params.add("client_id", apiKey);
    params.add("client_secret", apiSecret);

    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

    try {
      ResponseEntity<Map> response =
          restTemplate.exchange(LINKEDIN_TOKEN_URL, HttpMethod.POST, request, Map.class);

      Map<String, Object> body = response.getBody();
      if (body != null) {
        cachedAccessToken = (String) body.get("access_token");
        int expiresIn = body.get("expires_in") instanceof Number n ? n.intValue() : 3600;
        tokenExpiresAt = LocalDateTime.now().plusSeconds(expiresIn);
        logger.info("LinkedIn OAuth token acquired, expires in {} seconds", expiresIn);
      }
    } catch (Exception e) {
      logger.error("Failed to acquire LinkedIn OAuth token: {}", e.getMessage());
      // Fall back to API key as bearer token for backwards compatibility
      return apiKey;
    }

    return cachedAccessToken != null ? cachedAccessToken : apiKey;
  }

  /** Map EmploymentType enum to LinkedIn's job type code. */
  private String mapEmploymentType(JobPosting jp) {
    if (jp.getEmploymentType() == null) return "F";
    return switch (jp.getEmploymentType()) {
      case FULL_TIME -> "F";
      case PART_TIME -> "P";
      case CONTRACT -> "C";
      case TEMPORARY -> "T";
      case INTERNSHIP -> "I";
      default -> "O";
    };
  }

  /** Map ExperienceLevel enum to LinkedIn's seniority code. */
  private String mapExperienceLevel(JobPosting jp) {
    if (jp.getExperienceLevel() == null) return "MID_SENIOR_LEVEL";
    return switch (jp.getExperienceLevel()) {
      case ENTRY_LEVEL -> "ENTRY_LEVEL";
      case JUNIOR -> "ASSOCIATE";
      case MID_LEVEL -> "MID_SENIOR_LEVEL";
      case SENIOR -> "MID_SENIOR_LEVEL";
      case LEAD -> "DIRECTOR";
      case EXECUTIVE -> "EXECUTIVE";
      case EXPERT -> "EXECUTIVE";
    };
  }

  @Override
  public JobBoardPosting post(String jobPostingId, String boardConfig) {
    JobBoardPosting posting = new JobBoardPosting();
    posting.setJobPostingId(jobPostingId);
    posting.setBoardType(JobBoardType.LINKEDIN);
    posting.setBoardConfig(boardConfig);
    posting.setStatus(PostingStatus.PENDING);

    try {
      // Load full job posting data
      JobPosting jp =
          jobPostingRepository
              .findById(jobPostingId)
              .orElseThrow(() -> new RuntimeException("Job posting not found: " + jobPostingId));

      String accessToken = getAccessToken();

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.setBearerAuth(accessToken);
      headers.set("LinkedIn-Version", "202402");
      headers.set("X-Restli-Protocol-Version", "2.0.0");

      // Build enriched LinkedIn job posting payload
      Map<String, Object> body = new HashMap<>();
      body.put("author", "urn:li:organization:" + orgId);
      body.put("externalJobPostingId", jobPostingId);
      body.put("title", jp.getTitle());
      body.put("description", buildLinkedInDescription(jp));

      // Location
      Map<String, Object> location = new HashMap<>();
      location.put("country", "ZA");
      if (jp.getLocation() != null && !jp.getLocation().isBlank()) {
        location.put("city", jp.getLocation());
      }
      body.put("location", location);

      // Job type & experience level
      body.put("employmentStatus", mapEmploymentType(jp));
      body.put("seniorityLevel", mapExperienceLevel(jp));

      // Remote work setting
      if (Boolean.TRUE.equals(jp.getRemoteWorkAllowed())) {
        body.put("workplaceType", "REMOTE");
      } else {
        body.put("workplaceType", "ON_SITE");
      }

      // Salary information
      if (jp.getSalaryMin() != null || jp.getSalaryMax() != null) {
        Map<String, Object> compensation = new HashMap<>();
        if (jp.getSalaryMin() != null) {
          compensation.put("minAmount", jp.getSalaryMin().intValue());
        }
        if (jp.getSalaryMax() != null) {
          compensation.put("maxAmount", jp.getSalaryMax().intValue());
        }
        compensation.put(
            "currencyCode", jp.getSalaryCurrency() != null ? jp.getSalaryCurrency() : "ZAR");
        compensation.put("payPeriod", "YEARLY");
        body.put("compensation", compensation);
      }

      // Application deadline
      if (jp.getApplicationDeadline() != null) {
        body.put("expireAt", jp.getApplicationDeadline().toString());
      }

      // Number of openings
      if (jp.getPositionsAvailable() != null && jp.getPositionsAvailable() > 0) {
        body.put("numberOfOpenings", jp.getPositionsAvailable());
      }

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

      ResponseEntity<Map> response =
          restTemplate.exchange(
              LINKEDIN_API_BASE + "/simpleJobPostings", HttpMethod.POST, request, Map.class);

      // LinkedIn returns the posting ID in the x-restli-id header
      String externalId = response.getHeaders().getFirst("x-restli-id");
      if (externalId == null && response.getBody() != null) {
        externalId = (String) response.getBody().get("id");
      }
      if (externalId == null) {
        externalId = "LI-" + UUID.randomUUID().toString().substring(0, 12);
      }

      posting.setExternalPostId(externalId);
      posting.setExternalUrl("https://www.linkedin.com/jobs/view/" + externalId);
      posting.setStatus(PostingStatus.POSTED);
      posting.setPostedAt(LocalDateTime.now());
      posting.setExpiresAt(LocalDateTime.now().plusDays(30));

      logger.info(
          "Posted job {} to LinkedIn with ID {} — title: '{}'",
          jobPostingId,
          externalId,
          jp.getTitle());
    } catch (Exception e) {
      posting.setStatus(PostingStatus.FAILED);
      posting.setErrorMessage(e.getMessage());
      logger.error("Failed to post job {} to LinkedIn: {}", jobPostingId, e.getMessage());
    }

    JobBoardPosting saved = repository.save(posting);
    auditLogService.saveLog(
        "SYSTEM",
        "POST_TO_BOARD",
        "JOB_BOARD_POSTING",
        saved.getId().toString(),
        "Posted job " + jobPostingId + " to LinkedIn");
    return saved;
  }

  /** Build a rich HTML description for LinkedIn from the JobPosting fields. */
  private String buildLinkedInDescription(JobPosting jp) {
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
    JobBoardPosting posting =
        repository
            .findById(postingId)
            .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

    try {
      String accessToken = getAccessToken();

      HttpHeaders headers = new HttpHeaders();
      headers.setBearerAuth(accessToken);
      headers.set("LinkedIn-Version", "202402");
      headers.set("X-Restli-Protocol-Version", "2.0.0");
      HttpEntity<Void> request = new HttpEntity<>(headers);

      restTemplate.exchange(
          LINKEDIN_API_BASE + "/simpleJobPostings/" + posting.getExternalPostId(),
          HttpMethod.DELETE,
          request,
          Void.class);

      logger.info(
          "Removed LinkedIn posting {} (external: {})", postingId, posting.getExternalPostId());
    } catch (Exception e) {
      logger.warn("Failed to remove LinkedIn posting {}: {}", postingId, e.getMessage());
    }

    posting.setStatus(PostingStatus.REMOVED);
    JobBoardPosting saved = repository.save(posting);
    auditLogService.saveLog(
        "SYSTEM",
        "REMOVE_POSTING",
        "JOB_BOARD_POSTING",
        postingId,
        "Removed LinkedIn posting " + posting.getExternalPostId());
    return saved;
  }

  @Override
  public JobBoardPosting sync(String postingId) {
    JobBoardPosting posting =
        repository
            .findById(postingId)
            .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

    try {
      String accessToken = getAccessToken();

      HttpHeaders headers = new HttpHeaders();
      headers.setBearerAuth(accessToken);
      headers.set("LinkedIn-Version", "202402");
      headers.set("X-Restli-Protocol-Version", "2.0.0");
      HttpEntity<Void> request = new HttpEntity<>(headers);

      // Fetch posting analytics
      ResponseEntity<Map> response =
          restTemplate.exchange(
              LINKEDIN_API_BASE
                  + "/simpleJobPostings/"
                  + posting.getExternalPostId()
                  + "/analytics",
              HttpMethod.GET,
              request,
              Map.class);

      Map<String, Object> analytics = response.getBody();
      if (analytics != null) {
        if (analytics.get("viewCount") instanceof Number n) posting.setViewCount(n.intValue());
        if (analytics.get("clickCount") instanceof Number n) posting.setClickCount(n.intValue());
        if (analytics.get("applicationCount") instanceof Number n)
          posting.setApplicationCount(n.intValue());
      }

      // Also check posting status from LinkedIn
      try {
        ResponseEntity<Map> statusResponse =
            restTemplate.exchange(
                LINKEDIN_API_BASE + "/simpleJobPostings/" + posting.getExternalPostId(),
                HttpMethod.GET,
                request,
                Map.class);

        Map<String, Object> postingData = statusResponse.getBody();
        if (postingData != null && "CLOSED".equals(postingData.get("status"))) {
          posting.setStatus(PostingStatus.EXPIRED);
        }
      } catch (Exception e) {
        logger.debug(
            "Could not fetch LinkedIn posting status for {}: {}", postingId, e.getMessage());
      }
    } catch (Exception e) {
      logger.warn("Failed to sync LinkedIn posting {}: {}", postingId, e.getMessage());
    }

    // Check local expiry
    if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
      posting.setStatus(PostingStatus.EXPIRED);
    }

    return repository.save(posting);
  }
}
