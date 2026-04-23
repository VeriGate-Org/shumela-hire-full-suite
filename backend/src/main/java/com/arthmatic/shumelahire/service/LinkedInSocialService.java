package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.LinkedInSocialConfig;
import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.LinkedInConnectionStatus;
import com.arthmatic.shumelahire.dto.LinkedInPostResponse;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.LinkedInOrgConnection;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.LinkedInOrgConnectionDataRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@ConditionalOnProperty(name = "linkedin.social.enabled", havingValue = "true")
public class LinkedInSocialService {

    private static final Logger logger = LoggerFactory.getLogger(LinkedInSocialService.class);

    private static final String LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
    private static final String LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
    private static final String LINKEDIN_API_BASE = "https://api.linkedin.com";
    private static final String SCOPES = "w_organization_social r_organization_social";

    @Autowired
    private LinkedInSocialConfig config;

    @Autowired
    private LinkedInOrgConnectionDataRepository connectionRepository;

    @Autowired
    private DataEncryptionService encryptionService;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateAuthorizationUrl(String tenantId) {
        String state = tenantId + "|" + UUID.randomUUID();
        return LINKEDIN_AUTH_URL
                + "?response_type=code"
                + "&client_id=" + URLEncoder.encode(config.getClientId(), StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(config.getRedirectUri(), StandardCharsets.UTF_8)
                + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8)
                + "&scope=" + URLEncoder.encode(SCOPES, StandardCharsets.UTF_8);
    }

    @Transactional
    public String handleOAuthCallback(String code, String state) {
        // Parse tenant from state
        String[] parts = state.split("\\|", 2);
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid OAuth state parameter");
        }
        String tenantId = parts[0];

        // Exchange code for tokens
        Map<String, Object> tokenResponse = exchangeCodeForTokens(code);
        String accessToken = (String) tokenResponse.get("access_token");
        String refreshToken = (String) tokenResponse.get("refresh_token");
        int expiresIn = tokenResponse.get("expires_in") instanceof Number n ? n.intValue() : 3600;

        // Fetch organization info
        Map<String, String> orgInfo = fetchOrganizationInfo(accessToken);

        // Encrypt tokens
        String encryptedAccessToken = encryptionService.encrypt(accessToken);
        String encryptedRefreshToken = refreshToken != null ? encryptionService.encrypt(refreshToken) : null;

        // Store or update connection
        LinkedInOrgConnection connection = connectionRepository.findByTenantId(tenantId)
                .orElse(new LinkedInOrgConnection());

        connection.setTenantId(tenantId);
        connection.setAccessToken(encryptedAccessToken);
        connection.setRefreshToken(encryptedRefreshToken);
        connection.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
        connection.setOrganizationId(orgInfo.getOrDefault("id", ""));
        connection.setOrganizationName(orgInfo.get("name"));
        connection.setConnectedByUserId("SYSTEM"); // Will be set properly once we have the user context
        connection.setConnectedAt(LocalDateTime.now());

        connectionRepository.save(connection);

        auditLogService.saveLog(
                "SYSTEM",
                "LINKEDIN_SOCIAL_CONNECT",
                "LINKEDIN_ORG_CONNECTION",
                tenantId,
                "Connected LinkedIn organization: " + orgInfo.get("name"));

        logger.info("LinkedIn organization connected for tenant {}: {}", tenantId, orgInfo.get("name"));

        return tenantId;
    }

    public LinkedInConnectionStatus getConnectionStatus(String tenantId) {
        return connectionRepository.findByTenantId(tenantId)
                .map(conn -> new LinkedInConnectionStatus(
                        true,
                        conn.getOrganizationName(),
                        conn.getOrganizationId(),
                        conn.getConnectedAt(),
                        conn.getTokenExpiresAt().isBefore(LocalDateTime.now())
                ))
                .orElse(LinkedInConnectionStatus.disconnected());
    }

    @Transactional
    public void disconnectOrganization(String tenantId, String userId) {
        connectionRepository.deleteByTenantId(tenantId);

        auditLogService.saveLog(
                userId,
                "LINKEDIN_SOCIAL_DISCONNECT",
                "LINKEDIN_ORG_CONNECTION",
                tenantId,
                "Disconnected LinkedIn organization");

        logger.info("LinkedIn organization disconnected for tenant {} by user {}", tenantId, userId);
    }

    @Transactional
    public LinkedInPostResponse postJobToCompanyPage(String jobPostingId, String customText, String userId) {
        String tenantId = TenantContext.requireCurrentTenant();

        LinkedInOrgConnection connection = connectionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("LinkedIn organization not connected. Ask your admin to connect the company LinkedIn page."));

        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Job posting not found: " + jobPostingId));

        // Refresh token if needed
        refreshTokenIfNeeded(connection);

        String accessToken = encryptionService.decrypt(connection.getAccessToken());
        String orgId = connection.getOrganizationId();

        // Build job URL
        String jobUrl = buildJobUrl(jobPosting);

        // Build post text
        String postText = customText != null && !customText.isBlank()
                ? customText
                : buildJobPostContent(jobPosting, jobUrl);

        // Build LinkedIn Posts API payload
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("author", "urn:li:organization:" + orgId);
        payload.put("commentary", postText);
        payload.put("visibility", "PUBLIC");
        payload.put("distribution", Map.of("feedDistribution", "MAIN_FEED"));

        // Article content with job link
        Map<String, Object> article = new LinkedHashMap<>();
        article.put("source", jobUrl);
        article.put("title", jobPosting.getTitle());
        String description = jobPosting.getDescription();
        if (description != null && description.length() > 200) {
            description = description.substring(0, 200) + "...";
        }
        article.put("description", description != null ? description : "");
        payload.put("content", Map.of("article", article));

        payload.put("lifecycleState", "PUBLISHED");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            headers.set("LinkedIn-Version", "202402");
            headers.set("X-Restli-Protocol-Version", "2.0.0");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    LINKEDIN_API_BASE + "/rest/posts",
                    HttpMethod.POST,
                    request,
                    Map.class);

            String postId = response.getHeaders().getFirst("x-restli-id");
            String postUrl = postId != null
                    ? "https://www.linkedin.com/feed/update/" + postId
                    : null;

            auditLogService.saveLog(
                    userId,
                    "LINKEDIN_SOCIAL_POST",
                    "JOB_POSTING",
                    jobPostingId,
                    "Posted job to LinkedIn company page: " + jobPosting.getTitle());

            logger.info("Posted job {} to LinkedIn company page for tenant {}", jobPostingId, tenantId);

            return new LinkedInPostResponse(true, postUrl, "Successfully posted to LinkedIn");

        } catch (Exception e) {
            logger.error("Failed to post job {} to LinkedIn: {}", jobPostingId, e.getMessage());
            return new LinkedInPostResponse(false, null, "Failed to post to LinkedIn: " + e.getMessage());
        }
    }

    String buildJobPostContent(JobPosting jobPosting, String jobUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("We're hiring! ").append(jobPosting.getTitle()).append("\n\n");

        List<String> details = new ArrayList<>();
        if (jobPosting.getLocation() != null && !jobPosting.getLocation().isBlank()) {
            details.add(jobPosting.getLocation());
        }
        if (jobPosting.getEmploymentType() != null) {
            details.add(jobPosting.getEmploymentType().name().replace('_', ' '));
        }
        if (!details.isEmpty()) {
            sb.append(String.join(" | ", details)).append("\n\n");
        }

        if (jobPosting.getDescription() != null) {
            String desc = jobPosting.getDescription();
            if (desc.length() > 200) {
                desc = desc.substring(0, 200) + "...";
            }
            sb.append(desc).append("\n\n");
        }

        sb.append("Apply now: ").append(jobUrl).append("\n\n");

        sb.append("#Hiring");
        if (jobPosting.getDepartment() != null && !jobPosting.getDepartment().isBlank()) {
            String dept = jobPosting.getDepartment().replaceAll("[^a-zA-Z0-9]", "");
            sb.append(" #").append(dept);
        }
        sb.append(" #JobOpening");

        return sb.toString();
    }

    private String buildJobUrl(JobPosting jobPosting) {
        // Use the slug if available, otherwise fall back to ID-based URL
        if (jobPosting.getSlug() != null && !jobPosting.getSlug().isBlank()) {
            return "https://shumelahire.co.za/jobs/" + jobPosting.getSlug();
        }
        return "https://shumelahire.co.za/jobs/" + jobPosting.getId();
    }

    private void refreshTokenIfNeeded(LinkedInOrgConnection connection) {
        if (connection.getTokenExpiresAt().isAfter(LocalDateTime.now().plus(5, ChronoUnit.MINUTES))) {
            return; // Token still valid
        }

        if (connection.getRefreshToken() == null) {
            throw new RuntimeException("LinkedIn access token expired and no refresh token available. Please reconnect.");
        }

        String refreshToken = encryptionService.decrypt(connection.getRefreshToken());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("refresh_token", refreshToken);
        params.add("client_id", config.getClientId());
        params.add("client_secret", config.getClientSecret());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    LINKEDIN_TOKEN_URL, HttpMethod.POST, request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null) {
                String newAccessToken = (String) body.get("access_token");
                String newRefreshToken = (String) body.get("refresh_token");
                int expiresIn = body.get("expires_in") instanceof Number n ? n.intValue() : 3600;

                connection.setAccessToken(encryptionService.encrypt(newAccessToken));
                if (newRefreshToken != null) {
                    connection.setRefreshToken(encryptionService.encrypt(newRefreshToken));
                }
                connection.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                connectionRepository.save(connection);

                logger.info("LinkedIn token refreshed for tenant {}", connection.getTenantId());
            }
        } catch (Exception e) {
            logger.error("Failed to refresh LinkedIn token: {}", e.getMessage());
            throw new RuntimeException("Failed to refresh LinkedIn token. Please reconnect.", e);
        }
    }

    private Map<String, Object> exchangeCodeForTokens(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("code", code);
        params.add("redirect_uri", config.getRedirectUri());
        params.add("client_id", config.getClientId());
        params.add("client_secret", config.getClientSecret());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                LINKEDIN_TOKEN_URL, HttpMethod.POST, request, Map.class);

        Map<String, Object> body = response.getBody();
        if (body == null || !body.containsKey("access_token")) {
            throw new RuntimeException("Failed to exchange authorization code for tokens");
        }

        return body;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> fetchOrganizationInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("LinkedIn-Version", "202402");
        headers.set("X-Restli-Protocol-Version", "2.0.0");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    LINKEDIN_API_BASE + "/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))",
                    HttpMethod.GET,
                    request,
                    Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.get("elements") instanceof List<?> elements && !elements.isEmpty()) {
                Map<String, Object> firstElement = (Map<String, Object>) elements.get(0);
                Map<String, Object> org = (Map<String, Object>) firstElement.get("organization~");
                if (org != null) {
                    Map<String, String> result = new HashMap<>();
                    result.put("id", String.valueOf(org.get("id")));
                    result.put("name", (String) org.get("localizedName"));
                    return result;
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch organization info: {}", e.getMessage());
        }

        return Map.of("id", "unknown", "name", "Unknown Organization");
    }
}
