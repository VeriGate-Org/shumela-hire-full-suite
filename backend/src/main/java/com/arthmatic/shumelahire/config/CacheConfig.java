package com.arthmatic.shumelahire.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String JOB_ADS_CACHE = "jobAds";
    public static final String APPLICATIONS_CACHE = "applications";
    public static final String USERS_CACHE = "users";
    public static final String TEMPLATES_CACHE = "templates";
    public static final String ANALYTICS_CACHE = "analytics";
    public static final String REPORTS_CACHE = "reports";
    public static final String SEARCH_CACHE = "search";
    public static final String NOTIFICATIONS_CACHE = "notifications";
    public static final String EMPLOYEES_CACHE = "employees";

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(Arrays.asList(
            JOB_ADS_CACHE, APPLICATIONS_CACHE, USERS_CACHE, TEMPLATES_CACHE,
            ANALYTICS_CACHE, REPORTS_CACHE, SEARCH_CACHE, NOTIFICATIONS_CACHE,
            EMPLOYEES_CACHE
        ));
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}
