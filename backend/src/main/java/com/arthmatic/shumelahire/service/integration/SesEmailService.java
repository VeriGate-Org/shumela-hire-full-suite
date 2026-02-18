package com.arthmatic.shumelahire.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.util.Map;

@Service
@ConditionalOnProperty(name = "ses.enabled", havingValue = "true")
public class SesEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(SesEmailService.class);

    private final SesClient sesClient;

    @Value("${ses.from-email:noreply@shumelahire.co.za}")
    private String fromEmail;

    @Value("${ses.from-name:ShumelaHire}")
    private String fromName;

    public SesEmailService(SesClient sesClient) {
        this.sesClient = sesClient;
    }

    @Override
    public boolean sendEmail(String to, String subject, String htmlBody) {
        try {
            SendEmailRequest request = SendEmailRequest.builder()
                .source(fromName + " <" + fromEmail + ">")
                .destination(Destination.builder()
                    .toAddresses(to)
                    .build())
                .message(Message.builder()
                    .subject(Content.builder().data(subject).charset("UTF-8").build())
                    .body(Body.builder()
                        .html(Content.builder().data(htmlBody).charset("UTF-8").build())
                        .text(Content.builder().data(stripHtml(htmlBody)).charset("UTF-8").build())
                        .build())
                    .build())
                .build();

            SendEmailResponse response = sesClient.sendEmail(request);
            logger.info("SES email sent to {}: messageId={}", to, response.messageId());
            return true;
        } catch (SesException e) {
            logger.error("Failed to send SES email to {}: {}", to, e.awsErrorDetails().errorMessage());
            return false;
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean sendTemplatedEmail(String to, String template, Map<String, String> data) {
        String htmlBody = applyTemplate(template, data);
        String subject = data.getOrDefault("subject", "Notification from ShumelaHire");
        return sendEmail(to, subject, htmlBody);
    }

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]*>", "").replaceAll("\\s+", " ").trim();
    }

    private String applyTemplate(String template, Map<String, String> data) {
        String result = template;
        for (Map.Entry<String, String> entry : data.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }
}
