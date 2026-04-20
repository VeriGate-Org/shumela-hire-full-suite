package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;
import com.arthmatic.shumelahire.repository.AgencyProfileDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.AgencyProfileItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * DynamoDB repository for the AgencyProfile entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     AGENCY_PROFILE#{id}
 *   GSI1PK: AGENCY_STATUS#{tenantId}#{status}       GSI1SK: AGENCY_PROFILE#{agencyName}
 *   GSI4PK: AGENCY_EMAIL#{tenantId}#{contactEmail}  GSI4SK: AGENCY_PROFILE#{id}
 * </pre>
 */
@Repository
public class DynamoAgencyProfileRepository extends DynamoRepository<AgencyProfileItem, AgencyProfile>
        implements AgencyProfileDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoAgencyProfileRepository(DynamoDbClient dynamoDbClient,
                                          DynamoDbEnhancedClient enhancedClient,
                                          String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, AgencyProfileItem.class);
    }

    @Override
    protected String entityType() {
        return "AGENCY_PROFILE";
    }

    // ── AgencyProfileDataRepository implementation ───────────────────────────

    @Override
    public Optional<AgencyProfile> findByContactEmail(String contactEmail) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "AGENCY_EMAIL#" + tenantId + "#" + contactEmail);
    }

    @Override
    public List<AgencyProfile> findByStatus(AgencyStatus status) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "AGENCY_STATUS#" + tenantId + "#" + status.name());
    }

    @Override
    public List<AgencyProfile> findActiveAgencies() {
        return findByStatus(AgencyStatus.APPROVED);
    }

    // ── Conversion: AgencyProfileItem <-> AgencyProfile ──────────────────────

    @Override
    protected AgencyProfile toEntity(AgencyProfileItem item) {
        var entity = new AgencyProfile();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setAgencyName(item.getAgencyName());
        entity.setRegistrationNumber(item.getRegistrationNumber());
        entity.setContactPerson(item.getContactPerson());
        entity.setContactEmail(item.getContactEmail());
        entity.setContactPhone(item.getContactPhone());
        entity.setSpecializations(item.getSpecializations());
        if (item.getStatus() != null) {
            entity.setStatus(AgencyStatus.valueOf(item.getStatus()));
        }
        if (item.getFeePercentage() != null) {
            entity.setFeePercentage(new BigDecimal(item.getFeePercentage()));
        }
        if (item.getContractStartDate() != null) {
            entity.setContractStartDate(LocalDate.parse(item.getContractStartDate(), DATE_FMT));
        }
        if (item.getContractEndDate() != null) {
            entity.setContractEndDate(LocalDate.parse(item.getContractEndDate(), DATE_FMT));
        }
        entity.setBeeLevel(item.getBeeLevel());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected AgencyProfileItem toItem(AgencyProfile entity) {
        var item = new AgencyProfileItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("AGENCY_PROFILE#" + id);

        // GSI1: Status index, sorted by agency name
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "PENDING_APPROVAL";
        item.setGsi1pk("AGENCY_STATUS#" + tenantId + "#" + statusStr);
        item.setGsi1sk("AGENCY_PROFILE#" + entity.getAgencyName());

        // GSI4: Unique constraint on contact email per tenant
        item.setGsi4pk("AGENCY_EMAIL#" + tenantId + "#" + entity.getContactEmail());
        item.setGsi4sk("AGENCY_PROFILE#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setAgencyName(entity.getAgencyName());
        item.setRegistrationNumber(entity.getRegistrationNumber());
        item.setContactPerson(entity.getContactPerson());
        item.setContactEmail(entity.getContactEmail());
        item.setContactPhone(entity.getContactPhone());
        item.setSpecializations(entity.getSpecializations());
        item.setStatus(statusStr);
        if (entity.getFeePercentage() != null) {
            item.setFeePercentage(entity.getFeePercentage().toPlainString());
        }
        if (entity.getContractStartDate() != null) {
            item.setContractStartDate(entity.getContractStartDate().format(DATE_FMT));
        }
        if (entity.getContractEndDate() != null) {
            item.setContractEndDate(entity.getContractEndDate().format(DATE_FMT));
        }
        item.setBeeLevel(entity.getBeeLevel());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
