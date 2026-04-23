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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@ConditionalOnProperty(name = "job-boards.pnet.enabled", havingValue = "true")
public class PNetConnector implements JobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(PNetConnector.class);

    private static final String PNET_API_BASE = "https://api.pnet.co.za/v1";

    @Value("${job-boards.pnet.api-key:}")
    private String apiKey;

    @Autowired
    private JobBoardPostingDataRepository repository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

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

    /**
     * Map EmploymentType to PNet's contract type code.
     */
    private String mapContractType(JobPosting jp) {
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
     * Map ExperienceLevel to PNet's experience years range.
     */
    private String mapExperienceYears(JobPosting jp) {
        if (jp.getExperienceLevel() == null) return "3-5";
        return switch (jp.getExperienceLevel()) {
            case ENTRY_LEVEL -> "0-2";
            case JUNIOR -> "1-3";
            case MID_LEVEL -> "3-5";
            case SENIOR -> "5-10";
            case LEAD -> "8-15";
            case EXECUTIVE -> "10+";
            case EXPERT -> "15+";
        };
    }

    /**
     * Escape special XML characters in text content.
     */
    private String escapeXml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    /**
     * Build a full XML payload for the PNet Jobs API.
     */
    private String buildXmlPayload(String jobPostingId, JobPosting jp) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<job>\n");
        xml.append("  <externalId>").append(escapeXml(jobPostingId)).append("</externalId>\n");
        xml.append("  <title>").append(escapeXml(jp.getTitle())).append("</title>\n");
        xml.append("  <department>").append(escapeXml(jp.getDepartment())).append("</department>\n");

        // Description — combine all text fields
        xml.append("  <description><![CDATA[").append(buildPNetDescription(jp)).append("]]></description>\n");

        // Location
        if (jp.getLocation() != null && !jp.getLocation().isBlank()) {
            xml.append("  <location>").append(escapeXml(jp.getLocation())).append("</location>\n");
        }
        xml.append("  <country>ZA</country>\n");

        // Contract / employment type
        xml.append("  <contractType>").append(escapeXml(mapContractType(jp))).append("</contractType>\n");

        // Experience level
        xml.append("  <experienceYears>").append(escapeXml(mapExperienceYears(jp))).append("</experienceYears>\n");

        // Remote work
        if (Boolean.TRUE.equals(jp.getRemoteWorkAllowed())) {
            xml.append("  <remote>true</remote>\n");
        }

        // Salary range
        if (jp.getSalaryMin() != null || jp.getSalaryMax() != null) {
            xml.append("  <salary>\n");
            xml.append("    <currency>").append(jp.getSalaryCurrency() != null ? jp.getSalaryCurrency() : "ZAR").append("</currency>\n");
            if (jp.getSalaryMin() != null) {
                xml.append("    <min>").append(jp.getSalaryMin().intValue()).append("</min>\n");
            }
            if (jp.getSalaryMax() != null) {
                xml.append("    <max>").append(jp.getSalaryMax().intValue()).append("</max>\n");
            }
            xml.append("    <period>Annual</period>\n");
            xml.append("  </salary>\n");
        }

        // Application deadline
        if (jp.getApplicationDeadline() != null) {
            xml.append("  <closingDate>").append(jp.getApplicationDeadline().format(DateTimeFormatter.ISO_LOCAL_DATE)).append("</closingDate>\n");
        }

        // Number of positions
        if (jp.getPositionsAvailable() != null && jp.getPositionsAvailable() > 0) {
            xml.append("  <positions>").append(jp.getPositionsAvailable()).append("</positions>\n");
        }

        xml.append("</job>");
        return xml.toString();
    }

    /**
     * Build a rich description for PNet from JobPosting fields.
     */
    private String buildPNetDescription(JobPosting jp) {
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

    /**
     * Extract a value from an XML response using a simple tag-based parser.
     */
    private String extractXmlValue(String xml, String tagName) {
        if (xml == null) return null;
        Pattern pattern = Pattern.compile("<" + tagName + ">([^<]*)</" + tagName + ">");
        Matcher matcher = pattern.matcher(xml);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(JobBoardType.PNET);
        posting.setBoardConfig(boardConfig);
        posting.setStatus(PostingStatus.PENDING);

        try {
            // Load full job posting data
            JobPosting jp = jobPostingRepository.findById(jobPostingId)
                    .orElseThrow(() -> new RuntimeException("Job posting not found: " + jobPostingId));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            headers.set("X-API-Key", apiKey);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_XML));

            String xmlPayload = buildXmlPayload(jobPostingId, jp);
            HttpEntity<String> request = new HttpEntity<>(xmlPayload, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    PNET_API_BASE + "/jobs",
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // Parse external ID from XML response
            String externalId = extractXmlValue(response.getBody(), "jobId");
            if (externalId == null) {
                externalId = extractXmlValue(response.getBody(), "id");
            }
            if (externalId == null) {
                externalId = "PNET-" + UUID.randomUUID().toString().substring(0, 8);
            }

            posting.setExternalPostId(externalId);
            posting.setExternalUrl("https://www.pnet.co.za/jobs/" + externalId);
            posting.setStatus(PostingStatus.POSTED);
            posting.setPostedAt(LocalDateTime.now());
            posting.setExpiresAt(LocalDateTime.now().plusDays(30));

            logger.info("Posted job {} to PNet with ID {} — title: '{}'", jobPostingId, externalId, jp.getTitle());
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
    public JobBoardPosting remove(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", apiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(
                    PNET_API_BASE + "/jobs/" + posting.getExternalPostId(),
                    HttpMethod.DELETE,
                    request,
                    Void.class
            );

            logger.info("Removed PNet posting {} (external: {})", postingId, posting.getExternalPostId());
        } catch (Exception e) {
            logger.warn("Failed to remove PNet posting {}: {}", postingId, e.getMessage());
        }

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId,
                "Removed PNet posting");
        return saved;
    }

    @Override
    public JobBoardPosting sync(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", apiKey);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_XML));
            HttpEntity<Void> request = new HttpEntity<>(headers);

            // Fetch posting status and analytics from PNet
            ResponseEntity<String> response = restTemplate.exchange(
                    PNET_API_BASE + "/jobs/" + posting.getExternalPostId(),
                    HttpMethod.GET,
                    request,
                    String.class
            );

            String body = response.getBody();
            if (body != null) {
                // Parse analytics from XML response
                String views = extractXmlValue(body, "views");
                String clicks = extractXmlValue(body, "clicks");
                String applications = extractXmlValue(body, "applications");

                if (views != null) posting.setViewCount(Integer.parseInt(views));
                if (clicks != null) posting.setClickCount(Integer.parseInt(clicks));
                if (applications != null) posting.setApplicationCount(Integer.parseInt(applications));

                // Check posting status
                String status = extractXmlValue(body, "status");
                if ("expired".equalsIgnoreCase(status) || "closed".equalsIgnoreCase(status)) {
                    posting.setStatus(PostingStatus.EXPIRED);
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to sync PNet posting {}: {}", postingId, e.getMessage());
        }

        // Check local expiry
        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        return repository.save(posting);
    }
}
