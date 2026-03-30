package com.arthmatic.shumelahire.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.athena.AthenaClient;

/**
 * Configuration for AWS Athena analytics queries.
 * Only active in cloud deployment profiles.
 */
@Configuration
@Profile({"cloud", "prod", "lambda"})
public class AthenaConfig {

    @Value("${aws.region:af-south-1}")
    private String region;

    @Value("${athena.workgroup:shumelahire-analytics}")
    private String workgroupName;

    @Value("${athena.output-location:}")
    private String outputLocation;

    @Value("${athena.database:shumelahire_analytics}")
    private String databaseName;

    @Bean
    public AthenaClient athenaClient() {
        return AthenaClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Bean
    public String athenaWorkgroupName() {
        return workgroupName;
    }

    @Bean
    public String athenaOutputLocation() {
        return outputLocation;
    }

    @Bean
    public String athenaDatabaseName() {
        return databaseName;
    }
}
