package com.arthmatic.shumelahire.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@Profile("!lambda")
public class SchedulingConfig {
    // Disabled in Lambda — scheduled tasks are triggered via EventBridge instead.
}