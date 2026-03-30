package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.repository.TalentPoolDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TalentPoolItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the TalentPool entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     TALENT_POOL#{id}
 *   GSI1PK: TPOOL_ACTIVE#{tenantId}#{isActive}    GSI1SK: TALENT_POOL#{poolName}
 *   GSI4PK: TPOOL_NAME#{tenantId}#{poolName}       GSI4SK: TALENT_POOL#{id}
 * </pre>
 */
@Repository
public class DynamoTalentPoolRepository extends DynamoRepository<TalentPoolItem, TalentPool>
        implements TalentPoolDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoTalentPoolRepository(DynamoDbClient dynamoDbClient,
                                       DynamoDbEnhancedClient enhancedClient,
                                       String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, TalentPoolItem.class);
    }

    @Override
    protected String entityType() {
        return "TALENT_POOL";
    }

    // ── TalentPoolDataRepository implementation ──────────────────────────────

    @Override
    public Optional<TalentPool> findByPoolName(String poolName) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "TPOOL_NAME#" + tenantId + "#" + poolName);
    }

    @Override
    public List<TalentPool> findByIsActiveTrue() {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "TPOOL_ACTIVE#" + tenantId + "#true");
    }

    @Override
    public List<TalentPool> findAutoAddPools() {
        // Filter from active pools — auto-add is a small subset
        return findByIsActiveTrue().stream()
                .filter(tp -> Boolean.TRUE.equals(tp.getAutoAddEnabled()))
                .collect(Collectors.toList());
    }

    // ── Conversion: TalentPoolItem <-> TalentPool ────────────────────────────

    @Override
    protected TalentPool toEntity(TalentPoolItem item) {
        var entity = new TalentPool();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setPoolName(item.getPoolName());
        entity.setDescription(item.getDescription());
        entity.setDepartment(item.getDepartment());
        entity.setSkillsCriteria(item.getSkillsCriteria());
        entity.setExperienceLevel(item.getExperienceLevel());
        entity.setIsActive(item.getIsActive());
        entity.setAutoAddEnabled(item.getAutoAddEnabled());
        if (item.getCreatedBy() != null) {
            entity.setCreatedBy(Long.parseLong(item.getCreatedBy()));
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected TalentPoolItem toItem(TalentPool entity) {
        var item = new TalentPoolItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("TALENT_POOL#" + id);

        // GSI1: Active status index, sorted by pool name
        item.setGsi1pk("TPOOL_ACTIVE#" + tenantId + "#" + entity.getIsActive());
        item.setGsi1sk("TALENT_POOL#" + entity.getPoolName());

        // GSI4: Unique constraint on pool name per tenant
        item.setGsi4pk("TPOOL_NAME#" + tenantId + "#" + entity.getPoolName());
        item.setGsi4sk("TALENT_POOL#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setPoolName(entity.getPoolName());
        item.setDescription(entity.getDescription());
        item.setDepartment(entity.getDepartment());
        item.setSkillsCriteria(entity.getSkillsCriteria());
        item.setExperienceLevel(entity.getExperienceLevel());
        item.setIsActive(entity.getIsActive());
        item.setAutoAddEnabled(entity.getAutoAddEnabled());
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy().toString());
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
