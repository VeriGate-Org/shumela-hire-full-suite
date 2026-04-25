package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.PerformanceContract;
import com.arthmatic.shumelahire.entity.performance.PerformanceGoal;
import com.arthmatic.shumelahire.entity.performance.GoalType;
import com.arthmatic.shumelahire.entity.performance.ContractStatus;
import com.arthmatic.shumelahire.entity.performance.PerformanceCycle;
import com.arthmatic.shumelahire.entity.performance.PerformanceTemplate;
import com.arthmatic.shumelahire.repository.PerformanceContractDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PerformanceContractItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoPerformanceContractRepository extends DynamoRepository<PerformanceContractItem, PerformanceContract>
        implements PerformanceContractDataRepository {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

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
                        && contract.getCycle().getId().equals(cycleId))
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
                            && contract.getCycle().getId().equals(cycleId);
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
                            && contract.getCycle().getId().equals(cycleId);
                    return matchesEmployee && matchesCycle;
                });
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            // Strip trailing Z or timezone offset so LocalDateTime can parse it
            String cleaned = value.endsWith("Z") ? value.substring(0, value.length() - 1) : value;
            return LocalDateTime.parse(cleaned);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    @Override
    protected PerformanceContract toEntity(PerformanceContractItem item) {
        if (item == null) return null;

        PerformanceContract entity = new PerformanceContract();
        entity.setId(item.getId());
        entity.setTenantId(item.getTenantId());

        // Create PerformanceCycle stub
        if (item.getCycleId() != null) {
            PerformanceCycle cycle = new PerformanceCycle();
            cycle.setId(item.getCycleId());
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
            template.setId(item.getTemplateId());
            entity.setTemplate(template);
        }

        if (item.getStatus() != null) {
            entity.setStatus(ContractStatus.valueOf(item.getStatus()));
        }

        entity.setSubmittedAt(parseDateTime(item.getSubmittedAt()));
        entity.setApprovedAt(parseDateTime(item.getApprovedAt()));
        entity.setAmendedAt(parseDateTime(item.getAmendedAt()));

        entity.setApprovedBy(item.getApprovedBy());
        entity.setApprovalComments(item.getApprovalComments());
        entity.setRejectionReason(item.getRejectionReason());
        entity.setVersion(item.getVersion());
        entity.setAmendmentReason(item.getAmendmentReason());
        entity.setAmendedBy(item.getAmendedBy());

        entity.setCreatedAt(parseDateTime(item.getCreatedAt()));
        entity.setUpdatedAt(parseDateTime(item.getUpdatedAt()));

        // Parse goalsJson into PerformanceGoal list
        if (item.getGoalsJson() != null && !item.getGoalsJson().isBlank()) {
            try {
                List<Map<String, Object>> rawGoals = MAPPER.readValue(
                        item.getGoalsJson(), new TypeReference<>() {});
                List<PerformanceGoal> goals = new ArrayList<>();
                for (Map<String, Object> raw : rawGoals) {
                    PerformanceGoal goal = new PerformanceGoal();
                    goal.setId((String) raw.get("id"));
                    goal.setTitle((String) raw.get("title"));
                    goal.setDescription((String) raw.get("description"));
                    if (raw.get("type") != null) {
                        goal.setType(GoalType.valueOf((String) raw.get("type")));
                    }
                    if (raw.get("weighting") != null) {
                        goal.setWeighting(new BigDecimal(raw.get("weighting").toString()));
                    }
                    goal.setTargetValue((String) raw.get("targetValue"));
                    goal.setMeasurementCriteria((String) raw.get("measurementCriteria"));
                    if (raw.get("isActive") != null) {
                        goal.setIsActive((Boolean) raw.get("isActive"));
                    }
                    if (raw.get("sortOrder") != null) {
                        goal.setSortOrder(((Number) raw.get("sortOrder")).intValue());
                    }
                    goals.add(goal);
                }
                entity.setGoals(goals);
            } catch (Exception e) {
                // Log but don't fail — return contract without goals
            }
        }

        return entity;
    }

    private static String formatDateTime(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }

    @Override
    protected PerformanceContractItem toItem(PerformanceContract entity) {
        if (entity == null) return null;

        PerformanceContractItem item = new PerformanceContractItem();
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());

        // Store FK IDs
        if (entity.getCycle() != null && entity.getCycle().getId() != null) {
            item.setCycleId(entity.getCycle().getId());
        }
        if (entity.getTemplate() != null && entity.getTemplate().getId() != null) {
            item.setTemplateId(entity.getTemplate().getId());
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

        item.setSubmittedAt(formatDateTime(entity.getSubmittedAt()));
        item.setApprovedAt(formatDateTime(entity.getApprovedAt()));
        item.setAmendedAt(formatDateTime(entity.getAmendedAt()));

        item.setApprovedBy(entity.getApprovedBy());
        item.setApprovalComments(entity.getApprovalComments());
        item.setRejectionReason(entity.getRejectionReason());
        item.setVersion(entity.getVersion());
        item.setAmendmentReason(entity.getAmendmentReason());
        item.setAmendedBy(entity.getAmendedBy());

        item.setCreatedAt(formatDateTime(entity.getCreatedAt()));
        item.setUpdatedAt(formatDateTime(entity.getUpdatedAt()));

        // Serialize goals to JSON
        if (entity.getGoals() != null && !entity.getGoals().isEmpty()) {
            try {
                List<Map<String, Object>> rawGoals = new ArrayList<>();
                for (PerformanceGoal goal : entity.getGoals()) {
                    Map<String, Object> raw = new java.util.LinkedHashMap<>();
                    raw.put("id", goal.getId());
                    raw.put("title", goal.getTitle());
                    raw.put("description", goal.getDescription());
                    raw.put("type", goal.getType() != null ? goal.getType().name() : null);
                    raw.put("weighting", goal.getWeighting() != null ? goal.getWeighting().intValue() : null);
                    raw.put("targetValue", goal.getTargetValue());
                    raw.put("measurementCriteria", goal.getMeasurementCriteria());
                    raw.put("isActive", goal.getIsActive());
                    raw.put("sortOrder", goal.getSortOrder());
                    rawGoals.add(raw);
                }
                item.setGoalsJson(MAPPER.writeValueAsString(rawGoals));
            } catch (Exception e) {
                // Log but don't fail
            }
        }

        // GSI1 for employee queries
        if (entity.getEmployeeId() != null) {
            item.setGsi1pk("PCON_EMP#" + entity.getTenantId() + "#" + entity.getEmployeeId());
            item.setGsi1sk("PERF_CONTRACT#" + item.getId());
        }

        return item;
    }
}
