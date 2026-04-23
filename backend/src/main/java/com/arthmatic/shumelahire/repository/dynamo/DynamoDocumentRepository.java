package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DocumentItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Document entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     DOCUMENT#{id}
 *   GSI1PK: DOCUMENT_TYPE#{type}              GSI1SK: DOCUMENT#{uploadedAt}
 *   GSI2PK: DOCUMENT_APP#{applicationId}      GSI2SK: DOCUMENT#{uploadedAt}
 *   GSI5PK: DOCUMENT_APPLICANT#{applicantId}  GSI5SK: DOCUMENT#{uploadedAt}
 * </pre>
 */
@Repository
public class DynamoDocumentRepository extends DynamoRepository<DocumentItem, Document>
        implements DocumentDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoDocumentRepository(DynamoDbClient dynamoDbClient,
                                     DynamoDbEnhancedClient enhancedClient,
                                     String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DocumentItem.class);
    }

    @Override
    protected String entityType() {
        return "DOCUMENT";
    }

    // -- DocumentDataRepository implementation --------------------------------

    @Override
    public List<Document> findByApplicantIdOrderByUploadedAtDesc(String applicantId) {
        return queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId).stream()
                .sorted(Comparator.comparing(Document::getUploadedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Document> findByApplicantIdAndType(String applicantId, DocumentType type) {
        return queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId).stream()
                .filter(d -> type.equals(d.getType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Document> findByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "DOCUMENT_APP#" + applicationId);
    }

    @Override
    public List<Document> findCvDocumentsByApplicant(String applicantId) {
        return queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId).stream()
                .filter(d -> d.getType() == DocumentType.CV)
                .sorted(Comparator.comparing(Document::getUploadedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Document> findSupportingDocumentsByApplicant(String applicantId) {
        return queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId).stream()
                .filter(d -> d.getType() == DocumentType.SUPPORT)
                .sorted(Comparator.comparing(Document::getUploadedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public long countByApplicantId(String applicantId) {
        return queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId).size();
    }

    @Override
    public long countByType(DocumentType type) {
        return queryGsiAll("GSI1", "DOCUMENT_TYPE#" + type.name()).size();
    }

    @Override
    public List<Document> findByApplicantIdAndApplicationId(String applicantId, String applicationId) {
        return queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId).stream()
                .filter(d -> d.getApplicationId() != null
                        && d.getApplicationId().equals(applicationId))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByApplicantId(String applicantId) {
        List<Document> docs = queryGsiAll("GSI5", "DOCUMENT_APPLICANT#" + applicantId);
        for (Document doc : docs) {
            if (doc.getId() != null) {
                deleteById(doc.getId());
            }
        }
    }

    // -- Conversion: DocumentItem <-> Document --------------------------------

    @Override
    protected Document toEntity(DocumentItem item) {
        var entity = new Document();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        if (item.getApplicationId() != null) {
            entity.setApplicationId(item.getApplicationId());
        }
        if (item.getType() != null) {
            entity.setType(DocumentType.valueOf(item.getType()));
        }
        entity.setFilename(item.getFilename());
        entity.setUrl(item.getUrl());
        entity.setFileSize(item.getFileSize());
        entity.setContentType(item.getContentType());
        if (item.getUploadedAt() != null) {
            entity.setUploadedAt(LocalDateTime.parse(item.getUploadedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected DocumentItem toItem(Document entity) {
        var item = new DocumentItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        String uploadedAtStr = entity.getUploadedAt() != null
                ? entity.getUploadedAt().format(ISO_FMT) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("DOCUMENT#" + id);

        // GSI1: Type index
        String typeStr = entity.getType() != null ? entity.getType().name() : "";
        item.setGsi1pk("DOCUMENT_TYPE#" + typeStr);
        item.setGsi1sk("DOCUMENT#" + uploadedAtStr);

        // GSI2: Application FK lookup
        String appId = "";
        if (entity.getApplicationId() != null) {
            appId = entity.getApplicationId();
        } else if (entity.getApplication() != null && entity.getApplication().getId() != null) {
            appId = entity.getApplication().getId();
        }
        item.setGsi2pk("DOCUMENT_APP#" + appId);
        item.setGsi2sk("DOCUMENT#" + uploadedAtStr);

        // GSI5: Applicant lookup
        String applicantId = "";
        if (entity.getApplicant() != null && entity.getApplicant().getId() != null) {
            applicantId = entity.getApplicant().getId();
        }
        item.setGsi5pk("DOCUMENT_APPLICANT#" + applicantId);
        item.setGsi5sk("DOCUMENT#" + uploadedAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setApplicantId(applicantId.isEmpty() ? null : applicantId);
        item.setApplicationId(appId.isEmpty() ? null : appId);
        item.setType(typeStr.isEmpty() ? null : typeStr);
        item.setFilename(entity.getFilename());
        item.setUrl(entity.getUrl());
        item.setFileSize(entity.getFileSize());
        item.setContentType(entity.getContentType());
        if (entity.getUploadedAt() != null) {
            item.setUploadedAt(uploadedAtStr);
        }

        return item;
    }
}
