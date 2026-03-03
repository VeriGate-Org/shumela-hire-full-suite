package com.arthmatic.shumelahire.scheduler;

import com.arthmatic.shumelahire.service.AnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class MetricsComputationScheduler {

    private static final Logger log = LoggerFactory.getLogger(MetricsComputationScheduler.class);

    private final AnalyticsService analyticsService;

    public MetricsComputationScheduler(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void computeOnStartup() {
        log.info("Computing initial recruitment metrics...");
        try {
            analyticsService.calculateAndStoreMetrics(LocalDate.now(), null);
            log.info("Initial metrics computation complete");
        } catch (Exception e) {
            log.warn("Initial metrics computation failed: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRate = 7200000, initialDelay = 7200000)
    public void computePeriodically() {
        log.info("Running scheduled metrics computation...");
        try {
            analyticsService.calculateAndStoreMetrics(LocalDate.now(), null);
            log.info("Scheduled metrics computation complete");
        } catch (Exception e) {
            log.warn("Scheduled metrics computation failed: {}", e.getMessage());
        }
    }
}
