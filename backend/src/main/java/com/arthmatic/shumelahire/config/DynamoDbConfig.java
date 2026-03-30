package com.arthmatic.shumelahire.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

/**
 * DynamoDB client configuration.
 * Active in cloud/ppe/prod/lambda profiles — not in dev (unless DynamoDB Local is running).
 */
@Configuration
public class DynamoDbConfig {

    @Value("${dynamodb.table-name:#{null}}")
    private String tableName;

    @Value("${dynamodb.endpoint:#{null}}")
    private String endpoint;

    @Value("${aws.region:af-south-1}")
    private String region;

    @Bean
    @Profile({"cloud", "prod", "lambda"})
    public DynamoDbClient dynamoDbClient() {
        var builder = DynamoDbClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create());

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }

    @Bean
    @Profile("dev")
    public DynamoDbClient devDynamoDbClient() {
        // Use DynamoDB Local for development
        return DynamoDbClient.builder()
                .region(Region.of(region))
                .endpointOverride(URI.create("http://localhost:8000"))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Bean
    @ConditionalOnBean(DynamoDbClient.class)
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }

    @Bean
    public String dynamoDbTableName() {
        return tableName != null ? tableName : "shumelahire-data";
    }
}
