package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.entity.TalentPoolEntry;
import com.arthmatic.shumelahire.repository.TalentPoolEntryDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TalentPoolEntryItem;

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
 * DynamoDB repository for the TalentPoolEntry entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     TALENT_POOL_ENTRY#{id}
 *   GSI1PK: TPENTRY_POOL#{tenantId}#{talentPoolId}    GSI1SK: TALENT_POOL_ENTRY#{addedAt}
 *   GSI2PK: TPENTRY_APPLICANT#{tenantId}#{applicantId} GSI2SK: TALENT_POOL_ENTRY#{id}
 *   GSI4PK: TPENTRY_UNIQUE#{tenantId}#{talentPoolId}#{applicantId} GSI4SK: TALENT_POOL_ENTRY#{id}
 * </pre>
 */
@Repository
public class DynamoTalentPoolEntryRepository extends DynamoRepository<TalentPoolEntryItem, TalentPoolEntry>
        implements TalentPoolEntryDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoTalentPoolEntryRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, TalentPoolEntryItem.class);
    }

    @Override
    protected String entityType() {
        return "TALENT_POOL_ENTRY";
    }

    // ── TalentPoolEntryDataRepository implementation ─────────────────────────

    @Override
    public List<TalentPoolEntry> findAvailableCandidates(String poolId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "TPENTRY_POOL#" + tenantId + "#" + poolId).stream()
                .filter(e -> e.getRemovedAt() == null)
                .filter(e -> Boolean.TRUE.equals(e.getIsAvailable()))
                .sorted(Comparator.comparing(
                        (TalentPoolEntry e) -> e.getRating() != null ? e.getRating() : 0,
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public long countActive(String poolId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "TPENTRY_POOL#" + tenantId + "#" + poolId).stream()
                .filter(e -> e.getRemovedAt() == null)
                .count();
    }

    @Override
    public List<TalentPoolEntry> findByTalentPoolId(String poolId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "TPENTRY_POOL#" + tenantId + "#" + poolId).stream()
                .filter(e -> e.getRemovedAt() == null)
                .collect(Collectors.toList());
    }

    @Override
    public List<TalentPoolEntry> findByApplicantId(String applicantId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "TPENTRY_APPLICANT#" + tenantId + "#" + applicantId);
    }

    // ── Conversion: TalentPoolEntryItem <-> TalentPoolEntry ──────────────────

    @Override
    protected TalentPoolEntry toEntity(TalentPoolEntryItem item) {
        var entity = new TalentPoolEntry();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());

        // Set talentPool reference (lazy — just the ID)
        if (item.getTalentPoolId() != null) {
            var pool = new TalentPool();
            pool.setId(Long.parseLong(item.getTalentPoolId()));
            entity.setTalentPool(pool);
        }

        // Set applicant reference (lazy — just the ID)
        if (item.getApplicantId() != null) {
            var applicant = new Applicant();
            applicant.setId(Long.parseLong(item.getApplicantId()));
            entity.setApplicant(applicant);
        }

        // Set source application reference (lazy — just the ID)
        if (item.getSourceApplicationId() != null) {
            var app = new Application();
            app.setId(Long.parseLong(item.getSourceApplicationId()));
            entity.setSourceApplication(app);
        }

        entity.setSourceType(item.getSourceType());
        entity.setNotes(item.getNotes());
        entity.setRating(item.getRating());
        entity.setIsAvailable(item.getIsAvailable());
        if (item.getLastContactedAt() != null) {
            entity.setLastContactedAt(LocalDateTime.parse(item.getLastContactedAt(), ISO_FMT));
        }
        if (item.getAddedBy() != null) {
            entity.setAddedBy(Long.parseLong(item.getAddedBy()));
        }
        if (item.getAddedAt() != null) {
            entity.setAddedAt(LocalDateTime.parse(item.getAddedAt(), ISO_FMT));
        }
        if (item.getRemovedAt() != null) {
            entity.setRemovedAt(LocalDateTime.parse(item.getRemovedAt(), ISO_FMT));
        }
        entity.setRemovalReason(item.getRemovalReason());
        return entity;
    }

    @Override
    protected TalentPoolEntryItem toItem(TalentPoolEntry entity) {
        var item = new TalentPoolEntryItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String talentPoolId = entity.getTalentPool() != null && entity.getTalentPool().getId() != null
                ? entity.getTalentPool().getId().toString() : "UNKNOWN";
        String applicantId = entity.getApplicant() != null && entity.getApplicant().getId() != null
                ? entity.getApplicant().getId().toString() : "UNKNOWN";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("TALENT_POOL_ENTRY#" + id);

        // GSI1: Pool lookup, sorted by addedAt
        item.setGsi1pk("TPENTRY_POOL#" + tenantId + "#" + talentPoolId);
        String addedAtStr = entity.getAddedAt() != null ? entity.getAddedAt().format(ISO_FMT) : "";
        item.setGsi1sk("TALENT_POOL_ENTRY#" + addedAtStr);

        // GSI2: FK lookup — applicant
        item.setGsi2pk("TPENTRY_APPLICANT#" + tenantId + "#" + applicantId);
        item.setGsi2sk("TALENT_POOL_ENTRY#" + id);

        // GSI4: Unique constraint — pool+applicant
        item.setGsi4pk("TPENTRY_UNIQUE#" + tenantId + "#" + talentPoolId + "#" + applicantId);
        item.setGsi4sk("TALENT_POOL_ENTRY#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setTalentPoolId(talentPoolId);
        item.setApplicantId(applicantId);
        if (entity.getSourceApplication() != null && entity.getSourceApplication().getId() != null) {
            item.setSourceApplicationId(entity.getSourceApplication().getId().toString());
        }
        item.setSourceType(entity.getSourceType());
        item.setNotes(entity.getNotes());
        item.setRating(entity.getRating());
        item.setIsAvailable(entity.getIsAvailable());
        if (entity.getLastContactedAt() != null) {
            item.setLastContactedAt(entity.getLastContactedAt().format(ISO_FMT));
        }
        if (entity.getAddedBy() != null) {
            item.setAddedBy(entity.getAddedBy().toString());
        }
        if (entity.getAddedAt() != null) {
            item.setAddedAt(entity.getAddedAt().format(ISO_FMT));
        }
        if (entity.getRemovedAt() != null) {
            item.setRemovedAt(entity.getRemovedAt().format(ISO_FMT));
        }
        item.setRemovalReason(entity.getRemovalReason());

        return item;
    }
}
