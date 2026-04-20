package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.BackgroundCheck;
import com.arthmatic.shumelahire.entity.BackgroundCheckResult;
import com.arthmatic.shumelahire.entity.BackgroundCheckStatus;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.BackgroundCheckItem;
import com.arthmatic.shumelahire.service.DataEncryptionService;

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
 * DynamoDB repository for the BackgroundCheck entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     BGCHECK#{id}
 *   GSI1PK: BGCHECK_STATUS#{status}          GSI1SK: BGCHECK#{createdAt}
 *   GSI2PK: BGCHECK_APP#{applicationId}      GSI2SK: BGCHECK#{createdAt}
 *   GSI4PK: BGCHECK_REF#{referenceId}        GSI4SK: BGCHECK#{id}
 *   GSI5PK: BGCHECK_INITIATOR#{initiatedBy}  GSI5SK: BGCHECK#{createdAt}
 * </pre>
 */
@Repository
public class DynamoBackgroundCheckRepository extends DynamoRepository<BackgroundCheckItem, BackgroundCheck>
        implements BackgroundCheckDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final DataEncryptionService encryptionService;

    public DynamoBackgroundCheckRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName,
                                            DataEncryptionService encryptionService) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, BackgroundCheckItem.class);
        this.encryptionService = encryptionService;
    }

    @Override
    protected String entityType() {
        return "BGCHECK";
    }

    // -- BackgroundCheckDataRepository implementation -------------------------

    @Override
    public List<BackgroundCheck> findByApplicationIdOrderByCreatedAtDesc(String applicationId) {
        return queryGsiAll("GSI2", "BGCHECK_APP#" + applicationId).stream()
                .sorted(Comparator.comparing(BackgroundCheck::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<BackgroundCheck> findByApplicationIdIn(List<String> applicationIds) {
        return applicationIds.stream()
                .flatMap(appId -> queryGsiAll("GSI2", "BGCHECK_APP#" + appId).stream())
                .collect(Collectors.toList());
    }

    @Override
    public Optional<BackgroundCheck> findByReferenceId(String referenceId) {
        return findByGsiUnique("GSI4", "BGCHECK_REF#" + referenceId);
    }

    @Override
    public Optional<BackgroundCheck> findByExternalScreeningId(String externalScreeningId) {
        // No dedicated GSI for externalScreeningId; scan all items and filter
        return findAll().stream()
                .filter(bc -> externalScreeningId.equals(bc.getExternalScreeningId()))
                .findFirst();
    }

    @Override
    public List<BackgroundCheck> findByStatusOrderByCreatedAtDesc(BackgroundCheckStatus status) {
        return queryGsiAll("GSI1", "BGCHECK_STATUS#" + status.name()).stream()
                .sorted(Comparator.comparing(BackgroundCheck::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<BackgroundCheck> findByStatusInOrderByCreatedAtDesc(List<BackgroundCheckStatus> statuses) {
        return statuses.stream()
                .flatMap(s -> queryGsiAll("GSI1", "BGCHECK_STATUS#" + s.name()).stream())
                .sorted(Comparator.comparing(BackgroundCheck::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<BackgroundCheck> findPendingOlderThan(List<BackgroundCheckStatus> statuses, LocalDateTime cutoff) {
        return statuses.stream()
                .flatMap(s -> queryGsiAll("GSI1", "BGCHECK_STATUS#" + s.name()).stream())
                .filter(bc -> bc.getCreatedAt() != null && bc.getCreatedAt().isBefore(cutoff))
                .sorted(Comparator.comparing(BackgroundCheck::getCreatedAt))
                .collect(Collectors.toList());
    }

    @Override
    public List<BackgroundCheck> findCompletedByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "BGCHECK_APP#" + applicationId).stream()
                .filter(bc -> bc.getStatus() == BackgroundCheckStatus.COMPLETED)
                .sorted(Comparator.comparing(BackgroundCheck::getCompletedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(BackgroundCheckStatus status) {
        return queryGsiAll("GSI1", "BGCHECK_STATUS#" + status.name()).size();
    }

    @Override
    public List<BackgroundCheck> findByInitiatedBy(String userId) {
        return queryGsiAll("GSI5", "BGCHECK_INITIATOR#" + userId).stream()
                .sorted(Comparator.comparing(BackgroundCheck::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // -- Conversion: BackgroundCheckItem <-> BackgroundCheck -------------------

    @Override
    protected BackgroundCheck toEntity(BackgroundCheckItem item) {
        var entity = new BackgroundCheck();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setReferenceId(item.getReferenceId());
        entity.setCandidateIdNumber(item.getCandidateIdNumber());
        entity.setCandidateName(item.getCandidateName());
        entity.setCandidateEmail(item.getCandidateEmail());
        entity.setCheckTypes(item.getCheckTypes());
        if (item.getStatus() != null) {
            entity.setStatus(BackgroundCheckStatus.valueOf(item.getStatus()));
        }
        if (item.getOverallResult() != null) {
            try {
                entity.setOverallResult(BackgroundCheckResult.valueOf(item.getOverallResult()));
            } catch (IllegalArgumentException ignored) {}
        }
        entity.setResultsJson(encryptionService.decryptPII(item.getResultsJson()));
        entity.setConsentObtained(item.getConsentObtained());
        if (item.getConsentObtainedAt() != null) {
            entity.setConsentObtainedAt(LocalDateTime.parse(item.getConsentObtainedAt(), ISO_FMT));
        }
        if (item.getInitiatedBy() != null) {
            entity.setInitiatedBy(safeParseLong(item.getInitiatedBy()));
        }
        entity.setProvider(item.getProvider());
        entity.setExternalScreeningId(item.getExternalScreeningId());
        entity.setReportUrl(item.getReportUrl());
        entity.setErrorMessage(item.getErrorMessage());
        entity.setNotes(item.getNotes());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getSubmittedAt() != null) {
            entity.setSubmittedAt(LocalDateTime.parse(item.getSubmittedAt(), ISO_FMT));
        }
        if (item.getCompletedAt() != null) {
            entity.setCompletedAt(LocalDateTime.parse(item.getCompletedAt(), ISO_FMT));
        }
        if (item.getCancelledAt() != null) {
            entity.setCancelledAt(LocalDateTime.parse(item.getCancelledAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected BackgroundCheckItem toItem(BackgroundCheck entity) {
        var item = new BackgroundCheckItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("BGCHECK#" + id);

        // GSI1: Status index
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "INITIATED";
        item.setGsi1pk("BGCHECK_STATUS#" + statusStr);
        item.setGsi1sk("BGCHECK#" + createdAtStr);

        // GSI2: Application FK lookup
        String appId = "";
        if (entity.getApplication() != null && entity.getApplication().getId() != null) {
            appId = entity.getApplication().getId().toString();
        }
        item.setGsi2pk("BGCHECK_APP#" + appId);
        item.setGsi2sk("BGCHECK#" + createdAtStr);

        // GSI4: Reference ID unique constraint
        String refId = entity.getReferenceId() != null ? entity.getReferenceId() : "";
        item.setGsi4pk("BGCHECK_REF#" + refId);
        item.setGsi4sk("BGCHECK#" + id);

        // GSI5: InitiatedBy lookup
        String initiatedByStr = entity.getInitiatedBy() != null
                ? entity.getInitiatedBy().toString() : "";
        item.setGsi5pk("BGCHECK_INITIATOR#" + initiatedByStr);
        item.setGsi5sk("BGCHECK#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setApplicationId(appId);
        item.setReferenceId(entity.getReferenceId());
        item.setCandidateIdNumber(entity.getCandidateIdNumber());
        item.setCandidateName(entity.getCandidateName());
        item.setCandidateEmail(entity.getCandidateEmail());
        item.setCheckTypes(entity.getCheckTypes());
        item.setStatus(statusStr);
        if (entity.getOverallResult() != null) {
            item.setOverallResult(entity.getOverallResult().name());
        }
        item.setResultsJson(encryptionService.encryptPII(entity.getResultsJson()));
        item.setConsentObtained(entity.getConsentObtained());
        if (entity.getConsentObtainedAt() != null) {
            item.setConsentObtainedAt(entity.getConsentObtainedAt().format(ISO_FMT));
        }
        item.setInitiatedBy(initiatedByStr.isEmpty() ? null : initiatedByStr);
        item.setProvider(entity.getProvider());
        item.setExternalScreeningId(entity.getExternalScreeningId());
        item.setReportUrl(entity.getReportUrl());
        item.setErrorMessage(entity.getErrorMessage());
        item.setNotes(entity.getNotes());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getSubmittedAt() != null) {
            item.setSubmittedAt(entity.getSubmittedAt().format(ISO_FMT));
        }
        if (entity.getCompletedAt() != null) {
            item.setCompletedAt(entity.getCompletedAt().format(ISO_FMT));
        }
        if (entity.getCancelledAt() != null) {
            item.setCancelledAt(entity.getCancelledAt().format(ISO_FMT));
        }

        return item;
    }
}
