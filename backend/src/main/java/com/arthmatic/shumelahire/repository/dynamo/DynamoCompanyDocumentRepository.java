package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.CompanyDocument;
import com.arthmatic.shumelahire.entity.CompanyDocumentCategory;
import com.arthmatic.shumelahire.repository.CompanyDocumentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CompanyDocumentItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class DynamoCompanyDocumentRepository extends DynamoRepository<CompanyDocumentItem, CompanyDocument>
        implements CompanyDocumentDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoCompanyDocumentRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, CompanyDocumentItem.class);
    }

    @Override
    protected String entityType() {
        return "COMDOC";
    }

    @Override
    public List<CompanyDocument> findPublished() {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "COMDOC_PUB#" + tenantId + "#true").stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .sorted(Comparator.comparing(CompanyDocument::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<CompanyDocument> findByCategory(CompanyDocumentCategory category) {
        return findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .filter(d -> category.equals(d.getCategory()))
                .sorted(Comparator.comparing(CompanyDocument::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    protected CompanyDocument toEntity(CompanyDocumentItem item) {
        var doc = new CompanyDocument();
        doc.setId(item.getId());
        doc.setTenantId(item.getTenantId());
        doc.setTitle(item.getTitle());
        doc.setDescription(item.getDescription());
        if (item.getCategory() != null) {
            doc.setCategory(CompanyDocumentCategory.valueOf(item.getCategory()));
        }
        doc.setFilename(item.getFilename());
        doc.setFileUrl(item.getFileUrl());
        if (item.getFileSize() != null) {
            doc.setFileSize(Long.valueOf(item.getFileSize()));
        }
        doc.setContentType(item.getContentType());
        doc.setVersion(item.getVersion());
        doc.setIsPublished(item.getIsPublished());
        doc.setIsActive(item.getIsActive());
        doc.setRequiresAcknowledgement(item.getRequiresAcknowledgement());
        doc.setUploadedBy(item.getUploadedBy());
        if (item.getCreatedAt() != null) {
            doc.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            doc.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getPublishedAt() != null) {
            doc.setPublishedAt(LocalDateTime.parse(item.getPublishedAt(), ISO_FMT));
        }
        return doc;
    }

    @Override
    protected CompanyDocumentItem toItem(CompanyDocument entity) {
        var item = new CompanyDocumentItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        item.setPk("TENANT#" + tenantId);
        item.setSk("COMDOC#" + id);

        item.setGsi1pk("COMDOC_PUB#" + tenantId + "#" + entity.getIsPublished());
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        item.setGsi1sk("COMDOC#" + (entity.getCategory() != null ? entity.getCategory().name() : "") + "#" + createdAtStr);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setTitle(entity.getTitle());
        item.setDescription(entity.getDescription());
        if (entity.getCategory() != null) {
            item.setCategory(entity.getCategory().name());
        }
        item.setFilename(entity.getFilename());
        item.setFileUrl(entity.getFileUrl());
        if (entity.getFileSize() != null) {
            item.setFileSize(entity.getFileSize().toString());
        }
        item.setContentType(entity.getContentType());
        item.setVersion(entity.getVersion());
        item.setIsPublished(entity.getIsPublished());
        item.setIsActive(entity.getIsActive());
        item.setRequiresAcknowledgement(entity.getRequiresAcknowledgement());
        item.setUploadedBy(entity.getUploadedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getPublishedAt() != null) {
            item.setPublishedAt(entity.getPublishedAt().format(ISO_FMT));
        }

        return item;
    }
}
