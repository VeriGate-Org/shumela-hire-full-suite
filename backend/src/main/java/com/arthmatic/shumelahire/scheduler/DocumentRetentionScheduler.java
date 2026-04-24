package com.arthmatic.shumelahire.scheduler;

import com.arthmatic.shumelahire.service.DocumentRetentionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "document.retention.scheduler.enabled", havingValue = "true", matchIfMissing = false)
public class DocumentRetentionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(DocumentRetentionScheduler.class);

    @Autowired
    private DocumentRetentionService documentRetentionService;

    @Scheduled(cron = "0 0 3 * * *") // Daily at 3 AM UTC
    public void applyRetentionPolicies() {
        logger.info("Document retention scheduler triggered");
        documentRetentionService.applyRetentionPolicies();
    }
}
