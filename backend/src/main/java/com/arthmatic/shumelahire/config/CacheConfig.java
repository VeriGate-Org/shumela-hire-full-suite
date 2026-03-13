package com.arthmatic.shumelahire.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

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

    @Configuration
    @Profile({"dev", "test", "hybrid"})
    static class DevCacheConfig {
        @Bean
        @Primary
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

    @Configuration
    @Profile({"cloud", "ppe", "prod"})
    static class RedisCacheConfig {
        @Bean
        @Primary
        public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
            RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofMinutes(30))
                    .disableCachingNullValues()
                    .serializeValuesWith(
                            RedisSerializationContext.SerializationPair.fromSerializer(
                                    new GenericJackson2JsonRedisSerializer()
                            )
                    );

            Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
            cacheConfigs.put(JOB_ADS_CACHE, defaultConfig.entryTtl(Duration.ofHours(1)));
            cacheConfigs.put(APPLICATIONS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(15)));
            cacheConfigs.put(USERS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(30)));
            cacheConfigs.put(TEMPLATES_CACHE, defaultConfig.entryTtl(Duration.ofHours(2)));
            cacheConfigs.put(ANALYTICS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(10)));
            cacheConfigs.put(REPORTS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(15)));
            cacheConfigs.put(SEARCH_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)));
            cacheConfigs.put(NOTIFICATIONS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)));
            cacheConfigs.put(EMPLOYEES_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(15)));

            return RedisCacheManager.builder(connectionFactory)
                    .cacheDefaults(defaultConfig)
                    .withInitialCacheConfigurations(cacheConfigs)
                    .build();
        }
    }
}
