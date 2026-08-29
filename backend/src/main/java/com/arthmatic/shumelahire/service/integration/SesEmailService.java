package com.arthmatic.shumelahire.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.util.Arrays;
import java.util.List;
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

    /**
     * Domains this deployment is allowed to send to. Empty means everywhere.
     *
     * <p>Not a security control — a guard against seeded data. The IDC tenant carries 58 demo
     * applicants at gmail, outlook and yahoo addresses that were invented for the demo. Any status
     * change or interview booking on that data emails a mailbox that does not exist, and hard
     * bounces at Gmail are the fastest way to have SES pause sending on a freshly verified domain.
     *
     * <p>A blocked address is <em>logged and reported as a failure</em>, never quietly dropped: a
     * caller that thinks it delivered is the defect this whole area has been about. Widen or empty
     * this list when the tenant's data is real.
     */
    @Value("${ses.allowed-recipient-domains:}")
    private String allowedRecipientDomains;

    public SesEmailService(SesClient sesClient) {
        this.sesClient = sesClient;
    }

    @Override
    public boolean sendEmail(String to, String subject, String htmlBody) {
        if (!isAllowed(to)) {
            logger.warn("Not sending to {}: its domain is not in ses.allowed-recipient-domains ({})",
                    to, allowedRecipientDomains);
            return false;
        }
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

    /**
     * True: this bean only exists when {@code ses.enabled} is true, and SES is a real channel.
     *
     * <p>It says nothing about whether the from-address is a verified identity — SES answers that
     * per send, and a rejection surfaces as {@code sendEmail} returning false.
     */
    @Override
    public boolean isDeliveryConfigured() {
        return true;
    }

    /**
     * Whether this deployment may send to that address.
     *
     * <p>Matches the domain exactly, and subdomains of it, so {@code arthmatic.co.za} covers
     * {@code info@arthmatic.co.za} and {@code hr@mail.arthmatic.co.za} but never
     * {@code notarthmatic.co.za}.
     */
    boolean isAllowed(String recipient) {
        List<String> allowed = Arrays.stream(allowedRecipientDomains == null ? new String[0]
                        : allowedRecipientDomains.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .toList();
        if (allowed.isEmpty()) {
            return true;
        }
        if (recipient == null || !recipient.contains("@")) {
            return false;
        }
        String domain = recipient.substring(recipient.lastIndexOf('@') + 1).trim().toLowerCase();
        return allowed.stream().anyMatch(a -> domain.equals(a) || domain.endsWith("." + a));
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
