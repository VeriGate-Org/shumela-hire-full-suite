package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.Recognition;
import com.arthmatic.shumelahire.entity.engagement.RecognitionCategory;
import com.arthmatic.shumelahire.repository.RecognitionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.RecognitionItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class DynamoRecognitionRepository extends DynamoRepository<RecognitionItem, Recognition>
        implements RecognitionDataRepository {

    public DynamoRecognitionRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, RecognitionItem.class);
    }

    @Override
    protected String entityType() {
        return "RECOGNITION";
    }

    @Override
    public List<Recognition> findByToEmployeeIdOrderByCreatedAtDesc(String toEmployeeId) {
        String tenantId = currentTenantId();
        List<Recognition> recognitions = queryGsiAll("GSI1", "RECOG_TO#" + tenantId + "#" + toEmployeeId);
        return recognitions.stream()
                .sorted(Comparator.comparing(Recognition::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Recognition> findByFromEmployeeIdOrderByCreatedAtDesc(String fromEmployeeId) {
        return findAll().stream()
                .filter(r -> r.getFromEmployee() != null && r.getFromEmployee().getId() != null
                        && fromEmployeeId.equals(r.getFromEmployee().getId()))
                .sorted(Comparator.comparing(Recognition::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Recognition> findByIsPublicTrueOrderByCreatedAtDesc() {
        return findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsPublic()))
                .sorted(Comparator.comparing(Recognition::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getLeaderboard() {
        Map<String, Long> pointsByEmployee = findAll().stream()
                .filter(r -> r.getToEmployee() != null && r.getToEmployee().getId() != null)
                .filter(r -> r.getPoints() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getToEmployee().getId(),
                        Collectors.summingLong(r -> r.getPoints().longValue())
                ));

        return pointsByEmployee.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> leaderboardEntry = new HashMap<>();
                    leaderboardEntry.put("employeeId", entry.getKey());
                    leaderboardEntry.put("totalPoints", entry.getValue());
                    return leaderboardEntry;
                })
                .sorted(Comparator.comparing(m -> (Long) m.get("totalPoints"), Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public long getTotalPointsForEmployee(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "RECOG_TO#" + tenantId + "#" + employeeId).stream()
                .filter(r -> r.getPoints() != null)
                .mapToLong(r -> r.getPoints().longValue())
                .sum();
    }

    @Override
    protected Recognition toEntity(RecognitionItem item) {
        var e = new Recognition();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());

        // Create fromEmployee stub
        if (item.getFromEmployeeId() != null) {
            var fromEmployee = new Employee();
            fromEmployee.setId(item.getFromEmployeeId());
            fromEmployee.setTenantId(item.getTenantId());
            e.setFromEmployee(fromEmployee);
        }

        // Create toEmployee stub
        if (item.getToEmployeeId() != null) {
            var toEmployee = new Employee();
            toEmployee.setId(item.getToEmployeeId());
            toEmployee.setTenantId(item.getTenantId());
            e.setToEmployee(toEmployee);
        }

        if (item.getCategory() != null) {
            e.setCategory(RecognitionCategory.valueOf(item.getCategory()));
        }
        e.setMessage(item.getMessage());
        e.setPoints(item.getPoints());
        e.setIsPublic(item.getIsPublic());
        e.setCreatedAt(item.getCreatedAt());
        return e;
    }

    @Override
    protected RecognitionItem toItem(Recognition entity) {
        var item = new RecognitionItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String fromEmployeeId = entity.getFromEmployee() != null && entity.getFromEmployee().getId() != null ? entity.getFromEmployee().getId() : null;
        String toEmployeeId = entity.getToEmployee() != null && entity.getToEmployee().getId() != null ? entity.getToEmployee().getId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("RECOGNITION#" + id);
        if (toEmployeeId != null) {
            item.setGsi1pk("RECOG_TO#" + tenantId + "#" + toEmployeeId);
            item.setGsi1sk("RECOGNITION#" + createdAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setFromEmployeeId(fromEmployeeId);
        item.setToEmployeeId(toEmployeeId);
        if (entity.getCategory() != null) {
            item.setCategory(entity.getCategory().name());
        }
        item.setMessage(entity.getMessage());
        item.setPoints(entity.getPoints());
        item.setIsPublic(entity.getIsPublic());
        item.setCreatedAt(createdAt);
        return item;
    }
}
