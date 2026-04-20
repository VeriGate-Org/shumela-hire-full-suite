package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.WorkflowDefinition;
import com.arthmatic.shumelahire.repository.WorkflowDefinitionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.WorkflowDefinitionItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the WorkflowDefinition entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     WORKFLOW_DEFINITION#{id}
 *   GSI1PK: WF_DEF_ACTIVE#{isActive}       GSI1SK: WORKFLOW_DEFINITION#{name}
 *   GSI2PK: WF_DEF_CATEGORY#{category}     GSI2SK: WORKFLOW_DEFINITION#{name}
 *   GSI6PK: WF_DEF_TENANT#{tenantId}       GSI6SK: WORKFLOW_DEFINITION#{updatedAt}
 * </pre>
 */
@Repository
public class DynamoWorkflowDefinitionRepository extends DynamoRepository<WorkflowDefinitionItem, WorkflowDefinition>
        implements WorkflowDefinitionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoWorkflowDefinitionRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, WorkflowDefinitionItem.class);
    }

    @Override
    protected String entityType() {
        return "WORKFLOW_DEFINITION";
    }

    // ── WorkflowDefinitionDataRepository implementation ──────────────────────

    @Override
    public List<WorkflowDefinition> findByIsActiveTrue() {
        return queryGsiAll("GSI1", "WF_DEF_ACTIVE#true");
    }

    @Override
    public List<WorkflowDefinition> findByCategory(String category) {
        return queryGsiAll("GSI2", "WF_DEF_CATEGORY#" + category);
    }

    @Override
    public List<WorkflowDefinition> findAllByOrderByUpdatedAtDesc() {
        // Use GSI6 scoped to tenant, sorted by updatedAt descending
        String tenantId = currentTenantId();
        return queryGsiAll("GSI6", "WF_DEF_TENANT#" + tenantId).stream()
                .sorted(Comparator.comparing(WorkflowDefinition::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Conversion: WorkflowDefinitionItem <-> WorkflowDefinition ────────────

    @Override
    protected WorkflowDefinition toEntity(WorkflowDefinitionItem item) {
        var entity = new WorkflowDefinition();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setCategory(item.getCategory());
        entity.setActive(item.getIsActive() != null ? item.getIsActive() : false);
        entity.setTriggerType(item.getTriggerType());
        entity.setTriggerConfig(item.getTriggerConfig());
        entity.setStepsJson(item.getStepsJson());
        entity.setCreatedBy(item.getCreatedBy());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        entity.setVersion(item.getVersion());
        return entity;
    }

    @Override
    protected WorkflowDefinitionItem toItem(WorkflowDefinition entity) {
        var item = new WorkflowDefinitionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("WORKFLOW_DEFINITION#" + id);

        // GSI1: Active status index
        item.setGsi1pk("WF_DEF_ACTIVE#" + entity.isActive());
        item.setGsi1sk("WORKFLOW_DEFINITION#" + entity.getName());

        // GSI2: Category lookup
        item.setGsi2pk("WF_DEF_CATEGORY#" + (entity.getCategory() != null ? entity.getCategory() : "NONE"));
        item.setGsi2sk("WORKFLOW_DEFINITION#" + entity.getName());

        // GSI6: Date range by tenant
        item.setGsi6pk("WF_DEF_TENANT#" + tenantId);
        item.setGsi6sk("WORKFLOW_DEFINITION#" + (entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : ""));

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setCategory(entity.getCategory());
        item.setIsActive(entity.isActive());
        item.setTriggerType(entity.getTriggerType());
        item.setTriggerConfig(entity.getTriggerConfig());
        item.setStepsJson(entity.getStepsJson());
        item.setCreatedBy(entity.getCreatedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        item.setVersion(entity.getVersion());

        return item;
    }
}
