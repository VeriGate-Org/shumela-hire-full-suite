package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.EmployeeDocumentTypeConfig;
import com.arthmatic.shumelahire.repository.EmployeeDocumentTypeConfigDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmployeeDocumentTypeConfigItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the EmployeeDocumentTypeConfig entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     DOCTYPECONFIG#{id}
 *   GSI1PK: DOCTYPECONFIG_ACTIVE#{tenantId}#{isActive}  GSI1SK: DOCTYPECONFIG#{name}
 *   GSI4PK: DOCTYPECONFIG_CODE#{tenantId}#{code}        GSI4SK: DOCTYPECONFIG#{id}
 * </pre>
 */
@Repository
public class DynamoEmployeeDocumentTypeConfigRepository
        extends DynamoRepository<EmployeeDocumentTypeConfigItem, EmployeeDocumentTypeConfig>
        implements EmployeeDocumentTypeConfigDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoEmployeeDocumentTypeConfigRepository(DynamoDbClient dynamoDbClient,
                                                       DynamoDbEnhancedClient enhancedClient,
                                                       String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, EmployeeDocumentTypeConfigItem.class);
    }

    @Override
    protected String entityType() {
        return "DOCTYPECONFIG";
    }

    // ── EmployeeDocumentTypeConfigDataRepository implementation ──────────────

    @Override
    public List<EmployeeDocumentTypeConfig> findActive() {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "DOCTYPECONFIG_ACTIVE#" + tenantId + "#true");
    }

    @Override
    public List<EmployeeDocumentTypeConfig> findRequired() {
        // Required configs are a small subset; filter from all items
        return findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsRequired()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<EmployeeDocumentTypeConfig> findByCode(String code) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "DOCTYPECONFIG_CODE#" + tenantId + "#" + code);
    }

    // ── Conversion: EmployeeDocumentTypeConfigItem <-> EmployeeDocumentTypeConfig ─

    @Override
    protected EmployeeDocumentTypeConfig toEntity(EmployeeDocumentTypeConfigItem item) {
        var config = new EmployeeDocumentTypeConfig();
        if (item.getId() != null) {
            config.setId(item.getId());
        }
        config.setTenantId(item.getTenantId());
        config.setName(item.getName());
        config.setCode(item.getCode());
        config.setDescription(item.getDescription());
        config.setIsRequired(item.getIsRequired());
        config.setRequiresExpiry(item.getRequiresExpiry());
        config.setIsActive(item.getIsActive());
        if (item.getCreatedAt() != null) {
            config.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        return config;
    }

    @Override
    protected EmployeeDocumentTypeConfigItem toItem(EmployeeDocumentTypeConfig entity) {
        var item = new EmployeeDocumentTypeConfigItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("DOCTYPECONFIG#" + id);

        // GSI1: Active status index
        item.setGsi1pk("DOCTYPECONFIG_ACTIVE#" + tenantId + "#" + entity.getIsActive());
        item.setGsi1sk("DOCTYPECONFIG#" + (entity.getName() != null ? entity.getName() : ""));

        // GSI4: Unique constraint on code per tenant
        item.setGsi4pk("DOCTYPECONFIG_CODE#" + tenantId + "#" + entity.getCode());
        item.setGsi4sk("DOCTYPECONFIG#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setCode(entity.getCode());
        item.setDescription(entity.getDescription());
        item.setIsRequired(entity.getIsRequired());
        item.setRequiresExpiry(entity.getRequiresExpiry());
        item.setIsActive(entity.getIsActive());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }

        return item;
    }
}
