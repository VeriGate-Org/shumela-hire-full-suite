package com.arthmatic.shumelahire.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@ConditionalOnMissingBean(SesEmailService.class)
public class NoOpEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(NoOpEmailService.class);

    @Override
    public boolean sendEmail(String to, String subject, String htmlBody) {
        logger.info("NoOp email: to={}, subject={}", to, subject);
        return true;
    }

    @Override
    public boolean sendTemplatedEmail(String to, String template, Map<String, String> data) {
        logger.info("NoOp templated email: to={}, template length={}", to, template.length());
        return true;
    }

    /**
     * False. Nothing here is sent anywhere.
     *
     * <p>The two methods above return {@code true} and have since this class was written; changing
     * that would make every caller treat a missing SES configuration as a per-message failure and
     * bury the real ones. This is the honest answer, asked once, by callers that need to know
     * whether a person will actually receive something — report schedules being the first.
     */
    @Override
    public boolean isDeliveryConfigured() {
        return false;
    }
}
