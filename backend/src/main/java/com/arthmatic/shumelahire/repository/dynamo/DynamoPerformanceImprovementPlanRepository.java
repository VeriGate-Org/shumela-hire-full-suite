package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.PerformanceImprovementPlan;
import com.arthmatic.shumelahire.entity.performance.PipStatus;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.repository.PerformanceImprovementPlanDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PerformanceImprovementPlanItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoPerformanceImprovementPlanRepository extends DynamoRepository<PerformanceImprovementPlanItem, PerformanceImprovementPlan>
        implements PerformanceImprovementPlanDataRepository {

    public DynamoPerformanceImprovementPlanRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PerformanceImprovementPlanItem.class);
    }

    @Override
    protected String entityType() {
        return "PIP";
    }

    @Override
    public List<PerformanceImprovementPlan> findByEmployeeId(String employeeId) {
        String gsi1PkValue = "PIP_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1PkValue);
    }

    @Override
    public List<PerformanceImprovementPlan> findByManagerId(String managerId) {
        return findAll().stream()
                .filter(pip -> pip.getManager() != null
                        && pip.getManager().getId() != null
                        && pip.getManager().getId().toString().equals(managerId))
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceImprovementPlan> findByStatus(PipStatus status) {
        return findAll().stream()
                .filter(pip -> pip.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    protected PerformanceImprovementPlan toEntity(PerformanceImprovementPlanItem item) {
        if (item == null) return null;

        PerformanceImprovementPlan entity = new PerformanceImprovementPlan();
        entity.setId(item.getId() != null ? Long.parseLong(item.getId()) : null);
        entity.setTenantId(item.getTenantId());

        // Create Employee stub
        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            employee.setId(Long.parseLong(item.getEmployeeId()));
            entity.setEmployee(employee);
        }

        // Create Manager stub
        if (item.getManagerId() != null) {
            Employee manager = new Employee();
            manager.setId(Long.parseLong(item.getManagerId()));
            entity.setManager(manager);
        }

        entity.setReason(item.getReason());

        entity.setStartDate(item.getStartDate());
        entity.setEndDate(item.getEndDate());

        if (item.getStatus() != null) {
            entity.setStatus(PipStatus.valueOf(item.getStatus()));
        }

        entity.setOutcome(item.getOutcome());

        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        return entity;
    }

    @Override
    protected PerformanceImprovementPlanItem toItem(PerformanceImprovementPlan entity) {
        if (entity == null) return null;

        PerformanceImprovementPlanItem item = new PerformanceImprovementPlanItem();
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());

        // Store FK IDs
        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            item.setEmployeeId(entity.getEmployee().getId().toString());
        }
        if (entity.getManager() != null && entity.getManager().getId() != null) {
            item.setManagerId(entity.getManager().getId().toString());
        }

        item.setReason(entity.getReason());

        item.setStartDate(entity.getStartDate());
        item.setEndDate(entity.getEndDate());

        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }

        item.setOutcome(entity.getOutcome());

        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        // GSI1 for employee queries
        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            item.setGsi1pk("PIP_EMP#" + entity.getTenantId() + "#" + entity.getEmployee().getId());
            item.setGsi1sk("PIP#" + item.getId());
        }

        return item;
    }
}
