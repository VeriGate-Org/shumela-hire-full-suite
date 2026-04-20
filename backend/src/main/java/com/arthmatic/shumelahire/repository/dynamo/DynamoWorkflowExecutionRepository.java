package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.WorkflowDefinition;
import com.arthmatic.shumelahire.entity.WorkflowExecution;
import com.arthmatic.shumelahire.repository.WorkflowExecutionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.WorkflowExecutionItem;

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
 * DynamoDB repository for the WorkflowExecution entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     WORKFLOW_EXECUTION#{id}
 *   GSI1PK: WF_EXEC_STATUS#{status}                  GSI1SK: WORKFLOW_EXECUTION#{startedAt}
 *   GSI2PK: WF_EXEC_DEF#{workflowDefinitionId}       GSI2SK: WORKFLOW_EXECUTION#{startedAt}
 *   GSI6PK: WF_EXEC_TENANT#{tenantId}                GSI6SK: WORKFLOW_EXECUTION#{startedAt}
 * </pre>
 */
@Repository
public class DynamoWorkflowExecutionRepository extends DynamoRepository<WorkflowExecutionItem, WorkflowExecution>
        implements WorkflowExecutionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoWorkflowExecutionRepository(DynamoDbClient dynamoDbClient,
                                              DynamoDbEnhancedClient enhancedClient,
                                              String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, WorkflowExecutionItem.class);
    }

    @Override
    protected String entityType() {
        return "WORKFLOW_EXECUTION";
    }

    // ── WorkflowExecutionDataRepository implementation ───────────────────────

    @Override
    public List<WorkflowExecution> findByWorkflowDefinitionIdOrderByStartedAtDesc(String workflowDefinitionId) {
        return queryGsiAll("GSI2", "WF_EXEC_DEF#" + workflowDefinitionId).stream()
                .sorted(Comparator.comparing(WorkflowExecution::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<WorkflowExecution> findByStatusOrderByStartedAtDesc(String status) {
        return queryGsiAll("GSI1", "WF_EXEC_STATUS#" + status).stream()
                .sorted(Comparator.comparing(WorkflowExecution::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Conversion: WorkflowExecutionItem <-> WorkflowExecution ──────────────

    @Override
    protected WorkflowExecution toEntity(WorkflowExecutionItem item) {
        var entity = new WorkflowExecution();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        // WorkflowDefinition is a ManyToOne relationship — store only the FK in DynamoDB
        if (item.getWorkflowDefinitionId() != null) {
            var wfDef = new WorkflowDefinition();
            wfDef.setId(safeParseLong(item.getWorkflowDefinitionId()));
            entity.setWorkflowDefinition(wfDef);
        }
        entity.setStatus(item.getStatus());
        if (item.getStartedAt() != null) {
            entity.setStartedAt(LocalDateTime.parse(item.getStartedAt(), ISO_FMT));
        }
        if (item.getCompletedAt() != null) {
            entity.setCompletedAt(LocalDateTime.parse(item.getCompletedAt(), ISO_FMT));
        }
        entity.setTriggeredBy(item.getTriggeredBy());
        if (item.getCurrentStep() != null) {
            entity.setCurrentStep(item.getCurrentStep());
        }
        if (item.getTotalSteps() != null) {
            entity.setTotalSteps(item.getTotalSteps());
        }
        entity.setExecutionLogJson(item.getExecutionLogJson());
        entity.setContextJson(item.getContextJson());
        return entity;
    }

    @Override
    protected WorkflowExecutionItem toItem(WorkflowExecution entity) {
        var item = new WorkflowExecutionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("WORKFLOW_EXECUTION#" + id);

        // GSI1: Status index
        item.setGsi1pk("WF_EXEC_STATUS#" + (entity.getStatus() != null ? entity.getStatus() : "running"));
        item.setGsi1sk("WORKFLOW_EXECUTION#" + (entity.getStartedAt() != null ? entity.getStartedAt().format(ISO_FMT) : ""));

        // GSI2: WorkflowDefinition FK lookup
        String wfDefId = entity.getWorkflowDefinition() != null && entity.getWorkflowDefinition().getId() != null
                ? entity.getWorkflowDefinition().getId().toString() : "NONE";
        item.setGsi2pk("WF_EXEC_DEF#" + wfDefId);
        item.setGsi2sk("WORKFLOW_EXECUTION#" + (entity.getStartedAt() != null ? entity.getStartedAt().format(ISO_FMT) : ""));

        // GSI6: Date range by tenant
        item.setGsi6pk("WF_EXEC_TENANT#" + tenantId);
        item.setGsi6sk("WORKFLOW_EXECUTION#" + (entity.getStartedAt() != null ? entity.getStartedAt().format(ISO_FMT) : ""));

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getWorkflowDefinition() != null && entity.getWorkflowDefinition().getId() != null) {
            item.setWorkflowDefinitionId(entity.getWorkflowDefinition().getId().toString());
        }
        item.setStatus(entity.getStatus());
        if (entity.getStartedAt() != null) {
            item.setStartedAt(entity.getStartedAt().format(ISO_FMT));
        }
        if (entity.getCompletedAt() != null) {
            item.setCompletedAt(entity.getCompletedAt().format(ISO_FMT));
        }
        item.setTriggeredBy(entity.getTriggeredBy());
        item.setCurrentStep(entity.getCurrentStep());
        item.setTotalSteps(entity.getTotalSteps());
        item.setExecutionLogJson(entity.getExecutionLogJson());
        item.setContextJson(entity.getContextJson());

        return item;
    }
}
