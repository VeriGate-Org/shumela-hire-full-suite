package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.PerformanceContract;
import com.arthmatic.shumelahire.entity.performance.ContractStatus;
import com.arthmatic.shumelahire.entity.performance.PerformanceCycle;
import com.arthmatic.shumelahire.entity.performance.PerformanceTemplate;
import com.arthmatic.shumelahire.repository.PerformanceContractDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PerformanceContractItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoPerformanceContractRepository extends DynamoRepository<PerformanceContractItem, PerformanceContract>
        implements PerformanceContractDataRepository {

    public DynamoPerformanceContractRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PerformanceContractItem.class);
    }

    @Override
    protected String entityType() {
        return "PERF_CONTRACT";
    }

    @Override
    public List<PerformanceContract> findByTenantIdOrderByCreatedAtDesc(String tenantId) {
        return findAll().stream()
                .sorted(Comparator.comparing(PerformanceContract::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PerformanceContract> findByIdAndTenantId(String id, String tenantId) {
        return findById(id);
    }

    @Override
    public List<PerformanceContract> findByCycleIdAndTenantId(String cycleId, String tenantId) {
        return findAll().stream()
                .filter(contract -> contract.getCycle() != null
                        && contract.getCycle().getId() != null
                        && contract.getCycle().getId().toString().equals(cycleId))
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceContract> findByEmployeeIdAndTenantId(String employeeId, String tenantId) {
        String gsi1PkValue = "PCON_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1PkValue);
    }

    @Override
    public List<PerformanceContract> findByManagerIdAndTenantId(String managerId, String tenantId) {
        return findAll().stream()
                .filter(contract -> contract.getManagerId() != null && contract.getManagerId().equals(managerId))
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceContract> findByEmployeeIdAndTenantIdOrderByCreatedAtDesc(String employeeId, String tenantId) {
        String gsi1PkValue = "PCON_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1PkValue).stream()
                .sorted(Comparator.comparing(PerformanceContract::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public long countByCycleIdAndTenantIdAndStatus(String cycleId, String tenantId, ContractStatus status) {
        return findAll().stream()
                .filter(contract -> {
                    boolean matchesCycle = contract.getCycle() != null
                            && contract.getCycle().getId() != null
                            && contract.getCycle().getId().toString().equals(cycleId);
                    boolean matchesStatus = contract.getStatus() == status;
                    return matchesCycle && matchesStatus;
                })
                .count();
    }

    @Override
    public boolean existsByEmployeeIdAndCycleIdAndTenantId(String employeeId, String cycleId, String tenantId) {
        return findAll().stream()
                .anyMatch(contract -> {
                    boolean matchesEmployee = contract.getEmployeeId() != null && contract.getEmployeeId().equals(employeeId);
                    boolean matchesCycle = contract.getCycle() != null
                            && contract.getCycle().getId() != null
                            && contract.getCycle().getId().toString().equals(cycleId);
                    return matchesEmployee && matchesCycle;
                });
    }

    @Override
    protected PerformanceContract toEntity(PerformanceContractItem item) {
        if (item == null) return null;

        PerformanceContract entity = new PerformanceContract();
        entity.setId(item.getId() != null ? Long.parseLong(item.getId()) : null);
        entity.setTenantId(item.getTenantId());

        // Create PerformanceCycle stub
        if (item.getCycleId() != null) {
            PerformanceCycle cycle = new PerformanceCycle();
            cycle.setId(Long.parseLong(item.getCycleId()));
            entity.setCycle(cycle);
        }

        entity.setEmployeeId(item.getEmployeeId());
        entity.setEmployeeName(item.getEmployeeName());
        entity.setEmployeeNumber(item.getEmployeeNumber());
        entity.setManagerId(item.getManagerId());
        entity.setManagerName(item.getManagerName());
        entity.setDepartment(item.getDepartment());
        entity.setJobTitle(item.getJobTitle());
        entity.setJobLevel(item.getJobLevel());

        // Create PerformanceTemplate stub (nullable)
        if (item.getTemplateId() != null) {
            PerformanceTemplate template = new PerformanceTemplate();
            template.setId(Long.parseLong(item.getTemplateId()));
            entity.setTemplate(template);
        }

        if (item.getStatus() != null) {
            entity.setStatus(ContractStatus.valueOf(item.getStatus()));
        }

        entity.setSubmittedAt(item.getSubmittedAt());
        entity.setApprovedAt(item.getApprovedAt());
        entity.setAmendedAt(item.getAmendedAt());

        entity.setApprovedBy(item.getApprovedBy());
        entity.setApprovalComments(item.getApprovalComments());
        entity.setRejectionReason(item.getRejectionReason());
        entity.setVersion(item.getVersion());
        entity.setAmendmentReason(item.getAmendmentReason());
        entity.setAmendedBy(item.getAmendedBy());

        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        return entity;
    }

    @Override
    protected PerformanceContractItem toItem(PerformanceContract entity) {
        if (entity == null) return null;

        PerformanceContractItem item = new PerformanceContractItem();
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());

        // Store FK IDs
        if (entity.getCycle() != null && entity.getCycle().getId() != null) {
            item.setCycleId(entity.getCycle().getId().toString());
        }
        if (entity.getTemplate() != null && entity.getTemplate().getId() != null) {
            item.setTemplateId(entity.getTemplate().getId().toString());
        }

        item.setEmployeeId(entity.getEmployeeId());
        item.setEmployeeName(entity.getEmployeeName());
        item.setEmployeeNumber(entity.getEmployeeNumber());
        item.setManagerId(entity.getManagerId());
        item.setManagerName(entity.getManagerName());
        item.setDepartment(entity.getDepartment());
        item.setJobTitle(entity.getJobTitle());
        item.setJobLevel(entity.getJobLevel());

        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }

        item.setSubmittedAt(entity.getSubmittedAt());
        item.setApprovedAt(entity.getApprovedAt());
        item.setAmendedAt(entity.getAmendedAt());

        item.setApprovedBy(entity.getApprovedBy());
        item.setApprovalComments(entity.getApprovalComments());
        item.setRejectionReason(entity.getRejectionReason());
        item.setVersion(entity.getVersion());
        item.setAmendmentReason(entity.getAmendmentReason());
        item.setAmendedBy(entity.getAmendedBy());

        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        // GSI1 for employee queries
        if (entity.getEmployeeId() != null) {
            item.setGsi1pk("PCON_EMP#" + entity.getTenantId() + "#" + entity.getEmployeeId());
            item.setGsi1sk("PERF_CONTRACT#" + item.getId());
        }

        return item;
    }
}
