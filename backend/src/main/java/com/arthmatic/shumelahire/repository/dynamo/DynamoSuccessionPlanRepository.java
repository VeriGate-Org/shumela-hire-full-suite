package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlan;
import com.arthmatic.shumelahire.entity.analytics.ReadinessLevel;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlanStatus;
import com.arthmatic.shumelahire.repository.SuccessionPlanDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SuccessionPlanItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSuccessionPlanRepository extends DynamoRepository<SuccessionPlanItem, SuccessionPlan>
        implements SuccessionPlanDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSuccessionPlanRepository(DynamoDbClient dynamoDbClient,
                                          DynamoDbEnhancedClient enhancedClient,
                                          @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SuccessionPlanItem.class);
    }

    @Override protected String entityType() { return "SUCCESSION_PLAN"; }

    @Override
    public List<SuccessionPlan> findByTenantIdOrderByCreatedAtDesc(String tenantId) {
        return findAll().stream()
                .sorted(Comparator.comparing(SuccessionPlan::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SuccessionPlan> findByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, SuccessionPlanStatus status) {
        return findAll().stream()
                .filter(e -> status.equals(e.getStatus()))
                .sorted(Comparator.comparing(SuccessionPlan::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SuccessionPlan> findByTenantIdAndDepartmentOrderByCreatedAtDesc(String tenantId, String department) {
        return queryGsiAll("GSI1", "SUCC_DEPT#" + tenantId + "#" + department).stream()
                .sorted(Comparator.comparing(SuccessionPlan::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SuccessionPlan> findByCurrentHolderIdOrSuccessorId(String currentHolderId, String successorId) {
        return findAll().stream()
                .filter(e -> {
                    boolean isCurrentHolder = e.getCurrentHolder() != null && e.getCurrentHolder().getId() != null
                            && e.getCurrentHolder().getId().equals(currentHolderId);
                    boolean isSuccessor = e.getSuccessor() != null && e.getSuccessor().getId() != null
                            && e.getSuccessor().getId().equals(successorId);
                    return isCurrentHolder || isSuccessor;
                })
                .collect(Collectors.toList());
    }

    @Override
    protected SuccessionPlan toEntity(SuccessionPlanItem item) {
        var e = new SuccessionPlan();
        if (item.getId() != null) e.setId(item.getId());
        e.setTenantId(item.getTenantId());
        e.setPositionTitle(item.getPositionTitle());
        e.setDepartment(item.getDepartment());

        if (item.getCurrentHolderId() != null) {
            var currentHolder = new Employee();
            currentHolder.setId(item.getCurrentHolderId());
            e.setCurrentHolder(currentHolder);
        }

        if (item.getSuccessorId() != null) {
            var successor = new Employee();
            successor.setId(item.getSuccessorId());
            e.setSuccessor(successor);
        }

        if (item.getReadinessLevel() != null) e.setReadinessLevel(ReadinessLevel.valueOf(item.getReadinessLevel()));
        e.setDevelopmentActions(item.getDevelopmentActions());
        if (item.getStatus() != null) e.setStatus(SuccessionPlanStatus.valueOf(item.getStatus()));
        if (item.getCreatedAt() != null) e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) e.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        return e;
    }

    @Override
    protected SuccessionPlanItem toItem(SuccessionPlan entity) {
        var item = new SuccessionPlanItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String department = entity.getDepartment() != null ? entity.getDepartment() : "";
        String currentHolderId = entity.getCurrentHolder() != null && entity.getCurrentHolder().getId() != null
                ? entity.getCurrentHolder().getId() : "";
        String successorId = entity.getSuccessor() != null && entity.getSuccessor().getId() != null
                ? entity.getSuccessor().getId() : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("SUCCESSION_PLAN#" + id);
        item.setGsi1pk("SUCC_DEPT#" + tenantId + "#" + department);
        item.setGsi1sk("SUCCESSION_PLAN#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setPositionTitle(entity.getPositionTitle());
        item.setDepartment(department);
        item.setCurrentHolderId(currentHolderId);
        item.setSuccessorId(successorId);
        if (entity.getReadinessLevel() != null) item.setReadinessLevel(entity.getReadinessLevel().name());
        item.setDevelopmentActions(entity.getDevelopmentActions());
        if (entity.getStatus() != null) item.setStatus(entity.getStatus().name());
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        return item;
    }
}
