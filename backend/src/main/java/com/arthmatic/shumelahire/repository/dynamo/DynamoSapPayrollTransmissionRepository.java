package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.SapPayrollTransmission;
import com.arthmatic.shumelahire.entity.TransmissionStatus;
import com.arthmatic.shumelahire.repository.SapPayrollTransmissionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SapPayrollTransmissionItem;
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
 * DynamoDB repository for the SapPayrollTransmission entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     SAP_PAYROLL_TRANSMISSION#{id}
 *   GSI1PK: SAP_TX_STATUS#{status}                      GSI1SK: SAP_PAYROLL_TRANSMISSION#{createdAt}
 *   GSI2PK: SAP_TX_OFFER#{offerId}                      GSI2SK: SAP_PAYROLL_TRANSMISSION#{createdAt}
 *   GSI4PK: SAP_TX_ID#{tenantId}#{transmissionId}       GSI4SK: SAP_PAYROLL_TRANSMISSION#{id}
 *   GSI6PK: SAP_TX_TENANT#{tenantId}                    GSI6SK: SAP_PAYROLL_TRANSMISSION#{createdAt}
 *   GSI7PK: SAP_TX_SYNC#{status}                        GSI7SK: SAP_PAYROLL_TRANSMISSION#{transmittedAt}
 * </pre>
 */
@Repository
public class DynamoSapPayrollTransmissionRepository extends DynamoRepository<SapPayrollTransmissionItem, SapPayrollTransmission>
        implements SapPayrollTransmissionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final DataEncryptionService encryptionService;

    public DynamoSapPayrollTransmissionRepository(DynamoDbClient dynamoDbClient,
                                                    DynamoDbEnhancedClient enhancedClient,
                                                    String dynamoDbTableName,
                                                    DataEncryptionService encryptionService) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SapPayrollTransmissionItem.class);
        this.encryptionService = encryptionService;
    }

    @Override
    protected String entityType() {
        return "SAP_PAYROLL_TRANSMISSION";
    }

    // ── SapPayrollTransmissionDataRepository implementation ──────────────────

    @Override
    public Optional<SapPayrollTransmission> findByTransmissionId(String transmissionId) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "SAP_TX_ID#" + tenantId + "#" + transmissionId);
    }

    @Override
    public List<SapPayrollTransmission> findByOfferIdOrderByCreatedAtDesc(String offerId) {
        return queryGsiAll("GSI2", "SAP_TX_OFFER#" + offerId).stream()
                .sorted(Comparator.comparing(SapPayrollTransmission::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SapPayrollTransmission> findByStatus(TransmissionStatus status) {
        return queryGsiAll("GSI1", "SAP_TX_STATUS#" + status.name());
    }

    @Override
    public List<SapPayrollTransmission> findByStatusIn(List<TransmissionStatus> statuses) {
        return statuses.stream()
                .flatMap(s -> findByStatus(s).stream())
                .sorted(Comparator.comparing(SapPayrollTransmission::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SapPayrollTransmission> findRetryable(LocalDateTime now) {
        // Collect FAILED and RETRY_PENDING, then filter by retryCount and nextRetryAt
        return findAll().stream()
                .filter(t -> t.getStatus() != null && t.getStatus().isRetryable())
                .filter(t -> t.getRetryCount() < t.getMaxRetries())
                .filter(t -> t.getNextRetryAt() == null || !t.getNextRetryAt().isAfter(now))
                .sorted(Comparator.comparing(SapPayrollTransmission::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SapPayrollTransmission> findPending() {
        return queryGsiAll("GSI1", "SAP_TX_STATUS#PENDING").stream()
                .sorted(Comparator.comparing(SapPayrollTransmission::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SapPayrollTransmission> findStaleTransmissions(LocalDateTime cutoff) {
        // Use GSI7 for sync status, then filter by transmittedAt cutoff
        return queryGsiAll("GSI7", "SAP_TX_SYNC#TRANSMITTED").stream()
                .filter(t -> t.getTransmittedAt() != null && t.getTransmittedAt().isBefore(cutoff))
                .sorted(Comparator.comparing(SapPayrollTransmission::getTransmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<SapPayrollTransmission> findBySapEmployeeNumber(String sapEmployeeNumber) {
        // SAP employee numbers are sparse — scan + filter is acceptable
        return findAll().stream()
                .filter(t -> sapEmployeeNumber.equals(t.getSapEmployeeNumber()))
                .findFirst();
    }

    @Override
    public long countByStatus(TransmissionStatus status) {
        return findByStatus(status).size();
    }

    @Override
    public List<SapPayrollTransmission> findByInitiatedByOrderByCreatedAtDesc(String userId) {
        // Initiated-by queries are infrequent — scan + filter is acceptable
        return findAll().stream()
                .filter(t -> t.getInitiatedBy() != null && t.getInitiatedBy().toString().equals(userId))
                .sorted(Comparator.comparing(SapPayrollTransmission::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Conversion: SapPayrollTransmissionItem <-> SapPayrollTransmission ────

    @Override
    protected SapPayrollTransmission toEntity(SapPayrollTransmissionItem item) {
        var entity = new SapPayrollTransmission();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        // Offer is a ManyToOne relationship — store only the FK in DynamoDB
        if (item.getOfferId() != null) {
            var offer = new Offer();
            offer.setId(safeParseLong(item.getOfferId()));
            entity.setOffer(offer);
        }
        entity.setTransmissionId(item.getTransmissionId());
        entity.setSapEmployeeNumber(item.getSapEmployeeNumber());
        if (item.getStatus() != null) {
            entity.setStatus(TransmissionStatus.valueOf(item.getStatus()));
        }
        entity.setPayloadJson(encryptionService.decryptPII(item.getPayloadJson()));
        entity.setResponseJson(item.getResponseJson());
        entity.setErrorMessage(item.getErrorMessage());
        entity.setRetryCount(item.getRetryCount());
        entity.setMaxRetries(item.getMaxRetries());
        if (item.getNextRetryAt() != null) {
            entity.setNextRetryAt(LocalDateTime.parse(item.getNextRetryAt(), ISO_FMT));
        }
        if (item.getInitiatedBy() != null) {
            entity.setInitiatedBy(safeParseLong(item.getInitiatedBy()));
        }
        entity.setSapCompanyCode(item.getSapCompanyCode());
        entity.setSapPayrollArea(item.getSapPayrollArea());
        entity.setValidationErrors(item.getValidationErrors());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getTransmittedAt() != null) {
            entity.setTransmittedAt(LocalDateTime.parse(item.getTransmittedAt(), ISO_FMT));
        }
        if (item.getConfirmedAt() != null) {
            entity.setConfirmedAt(LocalDateTime.parse(item.getConfirmedAt(), ISO_FMT));
        }
        if (item.getCancelledAt() != null) {
            entity.setCancelledAt(LocalDateTime.parse(item.getCancelledAt(), ISO_FMT));
        }
        if (item.getCancelledBy() != null) {
            entity.setCancelledBy(safeParseLong(item.getCancelledBy()));
        }
        entity.setCancellationReason(item.getCancellationReason());
        return entity;
    }

    @Override
    protected SapPayrollTransmissionItem toItem(SapPayrollTransmission entity) {
        var item = new SapPayrollTransmissionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("SAP_PAYROLL_TRANSMISSION#" + id);

        // GSI1: Status index
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "PENDING";
        item.setGsi1pk("SAP_TX_STATUS#" + statusStr);
        item.setGsi1sk("SAP_PAYROLL_TRANSMISSION#" + (entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : ""));

        // GSI2: Offer FK lookup
        String offerId = entity.getOffer() != null && entity.getOffer().getId() != null
                ? entity.getOffer().getId().toString() : "NONE";
        item.setGsi2pk("SAP_TX_OFFER#" + offerId);
        item.setGsi2sk("SAP_PAYROLL_TRANSMISSION#" + (entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : ""));

        // GSI4: Unique constraint on transmissionId per tenant
        item.setGsi4pk("SAP_TX_ID#" + tenantId + "#" + (entity.getTransmissionId() != null ? entity.getTransmissionId() : ""));
        item.setGsi4sk("SAP_PAYROLL_TRANSMISSION#" + id);

        // GSI6: Date range by tenant
        item.setGsi6pk("SAP_TX_TENANT#" + tenantId);
        item.setGsi6sk("SAP_PAYROLL_TRANSMISSION#" + (entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : ""));

        // GSI7: Integration sync status
        item.setGsi7pk("SAP_TX_SYNC#" + statusStr);
        item.setGsi7sk("SAP_PAYROLL_TRANSMISSION#" + (entity.getTransmittedAt() != null ? entity.getTransmittedAt().format(ISO_FMT) : ""));

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getOffer() != null && entity.getOffer().getId() != null) {
            item.setOfferId(entity.getOffer().getId().toString());
        }
        item.setTransmissionId(entity.getTransmissionId());
        item.setSapEmployeeNumber(entity.getSapEmployeeNumber());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        item.setPayloadJson(encryptionService.encryptPII(entity.getPayloadJson()));
        item.setResponseJson(entity.getResponseJson());
        item.setErrorMessage(entity.getErrorMessage());
        item.setRetryCount(entity.getRetryCount());
        item.setMaxRetries(entity.getMaxRetries());
        if (entity.getNextRetryAt() != null) {
            item.setNextRetryAt(entity.getNextRetryAt().format(ISO_FMT));
        }
        if (entity.getInitiatedBy() != null) {
            item.setInitiatedBy(entity.getInitiatedBy().toString());
        }
        item.setSapCompanyCode(entity.getSapCompanyCode());
        item.setSapPayrollArea(entity.getSapPayrollArea());
        item.setValidationErrors(entity.getValidationErrors());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getTransmittedAt() != null) {
            item.setTransmittedAt(entity.getTransmittedAt().format(ISO_FMT));
        }
        if (entity.getConfirmedAt() != null) {
            item.setConfirmedAt(entity.getConfirmedAt().format(ISO_FMT));
        }
        if (entity.getCancelledAt() != null) {
            item.setCancelledAt(entity.getCancelledAt().format(ISO_FMT));
        }
        if (entity.getCancelledBy() != null) {
            item.setCancelledBy(entity.getCancelledBy().toString());
        }
        item.setCancellationReason(entity.getCancellationReason());

        return item;
    }
}
