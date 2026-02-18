package com.arthmatic.shumelahire.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "microsoft.enabled", havingValue = "true")
public class MsTeamsService {

    private static final Logger logger = LoggerFactory.getLogger(MsTeamsService.class);

    @Value("${microsoft.teams.webhook-url:}")
    private String webhookUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean sendNotification(String title, String message, String actionUrl) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            logger.warn("MS Teams webhook URL not configured");
            return false;
        }

        try {
            Map<String, Object> card = buildAdaptiveCard(title, message, actionUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(card, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                webhookUrl,
                HttpMethod.POST,
                request,
                String.class
            );

            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                logger.info("MS Teams notification sent: {}", title);
            } else {
                logger.warn("MS Teams notification failed with status: {}", response.getStatusCode());
            }
            return success;
        } catch (Exception e) {
            logger.error("Failed to send MS Teams notification: {}", e.getMessage());
            return false;
        }
    }

    public boolean sendInterviewScheduledCard(String candidateName, String jobTitle,
                                               String interviewDate, String interviewerName, String actionUrl) {
        String message = String.format(
            "Interview scheduled for **%s** applying for **%s**\n\n" +
            "- Date: %s\n- Interviewer: %s",
            candidateName, jobTitle, interviewDate, interviewerName
        );
        return sendNotification("Interview Scheduled", message, actionUrl);
    }

    private Map<String, Object> buildAdaptiveCard(String title, String message, String actionUrl) {
        Map<String, Object> card = new HashMap<>();
        card.put("type", "message");
        card.put("summary", title);

        Map<String, Object> attachment = new HashMap<>();
        attachment.put("contentType", "application/vnd.microsoft.card.adaptive");

        Map<String, Object> content = new HashMap<>();
        content.put("$schema", "http://adaptivecards.io/schemas/adaptive-card.json");
        content.put("type", "AdaptiveCard");
        content.put("version", "1.4");

        Map<String, Object> titleBlock = new HashMap<>();
        titleBlock.put("type", "TextBlock");
        titleBlock.put("text", title);
        titleBlock.put("weight", "bolder");
        titleBlock.put("size", "medium");

        Map<String, Object> messageBlock = new HashMap<>();
        messageBlock.put("type", "TextBlock");
        messageBlock.put("text", message);
        messageBlock.put("wrap", true);

        content.put("body", List.of(titleBlock, messageBlock));

        if (actionUrl != null && !actionUrl.isBlank()) {
            Map<String, Object> action = new HashMap<>();
            action.put("type", "Action.OpenUrl");
            action.put("title", "View in ShumelaHire");
            action.put("url", actionUrl);
            content.put("actions", List.of(action));
        }

        attachment.put("content", content);
        card.put("attachments", List.of(attachment));

        return card;
    }
}
