package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.LinkedInOrgConnection;
import com.arthmatic.shumelahire.repository.LinkedInOrgConnectionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LinkedInOrgConnectionItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DynamoLinkedInOrgConnectionRepository extends DynamoRepository<LinkedInOrgConnectionItem, LinkedInOrgConnection>
        implements LinkedInOrgConnectionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoLinkedInOrgConnectionRepository(DynamoDbClient dynamoDbClient,
                                                  DynamoDbEnhancedClient enhancedClient,
                                                  String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, LinkedInOrgConnectionItem.class);
    }

    @Override
    protected String entityType() {
        return "LINKEDIN_ORG";
    }

    @Override
    public Optional<LinkedInOrgConnection> findByTenantId(String tenantId) {
        // Query PK=TENANT#{tenantId}, SK begins_with LINKEDIN_ORG#
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s("TENANT#" + tenantId).build(),
                        ":skPrefix", AttributeValue.builder().s("LINKEDIN_ORG#").build()
                ))
                .limit(1)
                .build());

        return response.items().stream()
                .findFirst()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity);
    }

    @Override
    public void deleteByTenantId(String tenantId) {
        findByTenantId(tenantId).ifPresent(conn ->
                deleteById(String.valueOf(conn.getId())));
    }

    @Override
    protected LinkedInOrgConnection toEntity(LinkedInOrgConnectionItem item) {
        var entity = new LinkedInOrgConnection();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setAccessToken(item.getAccessToken());
        entity.setRefreshToken(item.getRefreshToken());
        if (item.getTokenExpiresAt() != null) {
            entity.setTokenExpiresAt(LocalDateTime.parse(item.getTokenExpiresAt(), ISO_FMT));
        }
        entity.setOrganizationId(item.getOrganizationId());
        entity.setOrganizationName(item.getOrganizationName());
        entity.setConnectedByUserId(item.getConnectedByUserId());
        if (item.getConnectedAt() != null) {
            entity.setConnectedAt(LocalDateTime.parse(item.getConnectedAt(), ISO_FMT));
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected LinkedInOrgConnectionItem toItem(LinkedInOrgConnection entity) {
        var item = new LinkedInOrgConnectionItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("LINKEDIN_ORG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setAccessToken(entity.getAccessToken());
        item.setRefreshToken(entity.getRefreshToken());
        if (entity.getTokenExpiresAt() != null) {
            item.setTokenExpiresAt(entity.getTokenExpiresAt().format(ISO_FMT));
        }
        item.setOrganizationId(entity.getOrganizationId());
        item.setOrganizationName(entity.getOrganizationName());
        item.setConnectedByUserId(entity.getConnectedByUserId());
        if (entity.getConnectedAt() != null) {
            item.setConnectedAt(entity.getConnectedAt().format(ISO_FMT));
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
