package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.analytics.AttritionRiskScore;
import com.arthmatic.shumelahire.entity.analytics.RiskLevel;
import com.arthmatic.shumelahire.repository.AttritionRiskScoreDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.AttritionRiskScoreItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoAttritionRiskScoreRepository extends DynamoRepository<AttritionRiskScoreItem, AttritionRiskScore>
        implements AttritionRiskScoreDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoAttritionRiskScoreRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, AttritionRiskScoreItem.class);
    }

    @Override protected String entityType() { return "ATTRITION_RISK"; }

    @Override
    public List<AttritionRiskScore> findByTenantIdOrderByCalculatedAtDesc(String tenantId) {
        return findAll().stream()
                .sorted(Comparator.comparing(AttritionRiskScore::getCalculatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<AttritionRiskScore> findByTenantIdAndRiskLevelOrderByRiskScoreDesc(String tenantId, RiskLevel riskLevel) {
        return findAll().stream()
                .filter(e -> riskLevel.equals(e.getRiskLevel()))
                .sorted(Comparator.comparing(AttritionRiskScore::getRiskScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<AttritionRiskScore> findByTenantIdAndRiskLevelInOrderByRiskScoreDesc(String tenantId, List<RiskLevel> riskLevels) {
        return findAll().stream()
                .filter(e -> riskLevels.contains(e.getRiskLevel()))
                .sorted(Comparator.comparing(AttritionRiskScore::getRiskScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<AttritionRiskScore> findByEmployeeIdOrderByCalculatedAtDesc(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "ATTR_EMP#" + tenantId + "#" + employeeId).stream()
                .sorted(Comparator.comparing(AttritionRiskScore::getCalculatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByTenantIdAndEmployeeId(String tenantId, String employeeId) {
        List<AttritionRiskScore> scores = findByEmployeeIdOrderByCalculatedAtDesc(employeeId);
        for (AttritionRiskScore score : scores) {
            deleteById(String.valueOf(score.getId()));
        }
    }

    @Override
    protected AttritionRiskScore toEntity(AttritionRiskScoreItem item) {
        var e = new AttritionRiskScore();
        if (item.getId() != null) try { e.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ex) {}
        e.setTenantId(item.getTenantId());
        if (item.getEmployeeId() != null) {
            var emp = new Employee();
            try { emp.setId(Long.parseLong(item.getEmployeeId())); } catch (NumberFormatException ex) {}
            e.setEmployee(emp);
        }
        if (item.getRiskScore() != null) e.setRiskScore(new BigDecimal(item.getRiskScore()));
        if (item.getRiskLevel() != null) e.setRiskLevel(RiskLevel.valueOf(item.getRiskLevel()));
        e.setFactors(item.getFactors());
        if (item.getCalculatedAt() != null) e.setCalculatedAt(LocalDateTime.parse(item.getCalculatedAt(), ISO_FMT));
        if (item.getCreatedAt() != null) e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        return e;
    }

    @Override
    protected AttritionRiskScoreItem toItem(AttritionRiskScore entity) {
        var item = new AttritionRiskScoreItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null ? entity.getEmployee().getId().toString() : "";
        String calculatedAtStr = entity.getCalculatedAt() != null ? entity.getCalculatedAt().format(ISO_FMT) : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("ATTRITION_RISK#" + id);
        item.setGsi1pk("ATTR_EMP#" + tenantId + "#" + employeeId);
        item.setGsi1sk("ATTRITION_RISK#" + calculatedAtStr);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        if (entity.getRiskScore() != null) item.setRiskScore(entity.getRiskScore().toPlainString());
        if (entity.getRiskLevel() != null) item.setRiskLevel(entity.getRiskLevel().name());
        item.setFactors(entity.getFactors());
        if (entity.getCalculatedAt() != null) item.setCalculatedAt(entity.getCalculatedAt().format(ISO_FMT));
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        return item;
    }
}
