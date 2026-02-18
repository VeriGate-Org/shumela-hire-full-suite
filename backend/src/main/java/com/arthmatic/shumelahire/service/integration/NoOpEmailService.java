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
}
