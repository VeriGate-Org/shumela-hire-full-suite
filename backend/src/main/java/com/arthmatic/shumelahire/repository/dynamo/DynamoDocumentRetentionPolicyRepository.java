package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.DocumentRetentionPolicy;
import com.arthmatic.shumelahire.repository.DocumentRetentionPolicyDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DocumentRetentionPolicyItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class DynamoDocumentRetentionPolicyRepository
        extends DynamoRepository<DocumentRetentionPolicyItem, DocumentRetentionPolicy>
        implements DocumentRetentionPolicyDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoDocumentRetentionPolicyRepository(DynamoDbClient dynamoDbClient,
                                                     DynamoDbEnhancedClient enhancedClient,
                                                     String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DocumentRetentionPolicyItem.class);
    }

    @Override
    protected String entityType() {
        return "RETPOL";
    }

    @Override
    public List<DocumentRetentionPolicy> findActive() {
        return findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DocumentRetentionPolicy> findByDocumentTypeCode(String documentTypeCode) {
        return findAll().stream()
                .filter(p -> documentTypeCode.equals(p.getDocumentTypeCode()))
                .findFirst();
    }

    @Override
    protected DocumentRetentionPolicy toEntity(DocumentRetentionPolicyItem item) {
        var pol = new DocumentRetentionPolicy();
        pol.setId(item.getId());
        pol.setTenantId(item.getTenantId());
        pol.setDocumentTypeCode(item.getDocumentTypeCode());
        pol.setRetentionDays(item.getRetentionDays());
        pol.setAction(item.getAction());
        pol.setIsActive(item.getIsActive());
        pol.setNotifyDaysBeforeAction(item.getNotifyDaysBeforeAction());
        if (item.getCreatedAt() != null) {
            pol.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        pol.setCreatedBy(item.getCreatedBy());
        return pol;
    }

    @Override
    protected DocumentRetentionPolicyItem toItem(DocumentRetentionPolicy entity) {
        var item = new DocumentRetentionPolicyItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        item.setPk("TENANT#" + tenantId);
        item.setSk("RETPOL#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setDocumentTypeCode(entity.getDocumentTypeCode());
        item.setRetentionDays(entity.getRetentionDays());
        item.setAction(entity.getAction());
        item.setIsActive(entity.getIsActive());
        item.setNotifyDaysBeforeAction(entity.getNotifyDaysBeforeAction());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        item.setCreatedBy(entity.getCreatedBy());

        return item;
    }
}
