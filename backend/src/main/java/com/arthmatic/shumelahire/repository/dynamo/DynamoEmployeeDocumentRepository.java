package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;
import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmployeeDocumentItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the EmployeeDocument entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     EMPDOC#{id}
 *   GSI1PK: EMPDOC_ACTIVE#{tenantId}#{isActive}   GSI1SK: EMPDOC#{documentType}#{createdAt}
 *   GSI2PK: EMPDOC_EMP#{tenantId}#{employeeId}    GSI2SK: EMPDOC#{createdAt}
 *   GSI6PK: EMPDOC_EXPIRY#{tenantId}              GSI6SK: #{expiryDate}#{id}
 * </pre>
 */
@Repository
public class DynamoEmployeeDocumentRepository extends DynamoRepository<EmployeeDocumentItem, EmployeeDocument>
        implements EmployeeDocumentDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoEmployeeDocumentRepository(DynamoDbClient dynamoDbClient,
                                             DynamoDbEnhancedClient enhancedClient,
                                             String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, EmployeeDocumentItem.class);
    }

    @Override
    protected String entityType() {
        return "EMPDOC";
    }

    // ── EmployeeDocumentDataRepository implementation ────────────────────────

    @Override
    public List<EmployeeDocument> findActiveByEmployee(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "EMPDOC_EMP#" + tenantId + "#" + employeeId).stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .sorted(Comparator.comparing(EmployeeDocument::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<EmployeeDocument> findActiveByEmployeeAndType(String employeeId, EmployeeDocumentType documentType) {
        return findActiveByEmployee(employeeId).stream()
                .filter(d -> documentType.equals(d.getDocumentType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<EmployeeDocument> findExpiringDocuments(LocalDate date) {
        String tenantId = currentTenantId();
        // Query GSI6 for documents with expiry date up to the given date
        return queryGsiAll("GSI6", "EMPDOC_EXPIRY#" + tenantId).stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .filter(d -> d.getExpiryDate() != null && !d.getExpiryDate().isAfter(date))
                .collect(Collectors.toList());
    }

    @Override
    public List<EmployeeDocument> findExpiringDocumentsByEmployee(String employeeId, LocalDate date) {
        return findActiveByEmployee(employeeId).stream()
                .filter(d -> d.getExpiryDate() != null && !d.getExpiryDate().isAfter(date))
                .collect(Collectors.toList());
    }

    @Override
    public List<EmployeeDocument> findLatestByEmployeeAndType(String employeeId, EmployeeDocumentType type) {
        return findActiveByEmployeeAndType(employeeId, type).stream()
                .sorted(Comparator.comparing(EmployeeDocument::getVersion, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    // ── Conversion: EmployeeDocumentItem <-> EmployeeDocument ────────────────

    @Override
    protected EmployeeDocument toEntity(EmployeeDocumentItem item) {
        var doc = new EmployeeDocument();
        if (item.getId() != null) {
            doc.setId(item.getId());
        }
        doc.setTenantId(item.getTenantId());
        // Employee is a relationship — store only the ID; service layer hydrates
        if (item.getEmployeeId() != null) {
            var emp = new Employee();
            emp.setId(item.getEmployeeId());
            doc.setEmployee(emp);
        }
        if (item.getDocumentType() != null) {
            doc.setDocumentType(EmployeeDocumentType.valueOf(item.getDocumentType()));
        }
        doc.setTitle(item.getTitle());
        doc.setDescription(item.getDescription());
        doc.setFilename(item.getFilename());
        doc.setFileUrl(item.getFileUrl());
        if (item.getFileSize() != null) {
            doc.setFileSize(Long.valueOf(item.getFileSize()));
        }
        doc.setContentType(item.getContentType());
        doc.setVersion(item.getVersion());
        if (item.getExpiryDate() != null) {
            doc.setExpiryDate(LocalDate.parse(item.getExpiryDate(), DATE_FMT));
        }
        doc.setIsActive(item.getIsActive());
        doc.setUploadedBy(item.getUploadedBy());
        if (item.getCreatedAt() != null) {
            doc.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            doc.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        doc.setIsVerified(item.getIsVerified());
        doc.setVerifiedBy(item.getVerifiedBy());
        if (item.getVerifiedAt() != null) {
            doc.setVerifiedAt(LocalDateTime.parse(item.getVerifiedAt(), ISO_FMT));
        }
        // E-Signature fields
        doc.setESignatureEnvelopeId(item.getESignatureEnvelopeId());
        doc.setESignatureStatus(item.getESignatureStatus());
        if (item.getESignatureSentAt() != null) {
            doc.setESignatureSentAt(LocalDateTime.parse(item.getESignatureSentAt(), ISO_FMT));
        }
        if (item.getESignatureCompletedAt() != null) {
            doc.setESignatureCompletedAt(LocalDateTime.parse(item.getESignatureCompletedAt(), ISO_FMT));
        }
        doc.setESignatureSignerEmail(item.getESignatureSignerEmail());
        return doc;
    }

    @Override
    protected EmployeeDocumentItem toItem(EmployeeDocument entity) {
        var item = new EmployeeDocumentItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : null;

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("EMPDOC#" + id);

        // GSI1: Active documents by type
        item.setGsi1pk("EMPDOC_ACTIVE#" + tenantId + "#" + entity.getIsActive());
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        item.setGsi1sk("EMPDOC#" + (entity.getDocumentType() != null ? entity.getDocumentType().name() : "") + "#" + createdAtStr);

        // GSI2: Documents by employee
        item.setGsi2pk("EMPDOC_EMP#" + tenantId + "#" + (employeeId != null ? employeeId : "NONE"));
        item.setGsi2sk("EMPDOC#" + createdAtStr);

        // GSI6: Expiry date range
        item.setGsi6pk("EMPDOC_EXPIRY#" + tenantId);
        String expiryStr = entity.getExpiryDate() != null ? entity.getExpiryDate().format(DATE_FMT) : "9999-12-31";
        item.setGsi6sk(expiryStr + "#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        if (entity.getDocumentType() != null) {
            item.setDocumentType(entity.getDocumentType().name());
        }
        item.setTitle(entity.getTitle());
        item.setDescription(entity.getDescription());
        item.setFilename(entity.getFilename());
        item.setFileUrl(entity.getFileUrl());
        if (entity.getFileSize() != null) {
            item.setFileSize(entity.getFileSize().toString());
        }
        item.setContentType(entity.getContentType());
        item.setVersion(entity.getVersion());
        if (entity.getExpiryDate() != null) {
            item.setExpiryDate(entity.getExpiryDate().format(DATE_FMT));
        }
        item.setIsActive(entity.getIsActive());
        item.setUploadedBy(entity.getUploadedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        item.setIsVerified(entity.getIsVerified());
        item.setVerifiedBy(entity.getVerifiedBy());
        if (entity.getVerifiedAt() != null) {
            item.setVerifiedAt(entity.getVerifiedAt().format(ISO_FMT));
        }
        // E-Signature fields
        item.setESignatureEnvelopeId(entity.getESignatureEnvelopeId());
        item.setESignatureStatus(entity.getESignatureStatus());
        if (entity.getESignatureSentAt() != null) {
            item.setESignatureSentAt(entity.getESignatureSentAt().format(ISO_FMT));
        }
        if (entity.getESignatureCompletedAt() != null) {
            item.setESignatureCompletedAt(entity.getESignatureCompletedAt().format(ISO_FMT));
        }
        item.setESignatureSignerEmail(entity.getESignatureSignerEmail());

        return item;
    }
}
