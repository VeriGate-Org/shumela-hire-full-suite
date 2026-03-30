package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.PerformanceCycle;
import com.arthmatic.shumelahire.entity.performance.CycleStatus;
import com.arthmatic.shumelahire.repository.PerformanceCycleDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PerformanceCycleItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoPerformanceCycleRepository extends DynamoRepository<PerformanceCycleItem, PerformanceCycle>
        implements PerformanceCycleDataRepository {

    public DynamoPerformanceCycleRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PerformanceCycleItem.class);
    }

    @Override
    protected String entityType() {
        return "PERF_CYCLE";
    }

    @Override
    public List<PerformanceCycle> findByTenantIdOrderByCreatedAtDesc(String tenantId) {
        return findAll().stream()
                .sorted(Comparator.comparing(PerformanceCycle::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PerformanceCycle> findByIdAndTenantId(String id, String tenantId) {
        return findById(id);
    }

    @Override
    public List<PerformanceCycle> findByTenantIdAndStatus(String tenantId, CycleStatus status) {
        String gsi1PkValue = "PC_STATUS#" + currentTenantId() + "#" + status.name();
        return queryGsiAll("GSI1", gsi1PkValue);
    }

    @Override
    public Optional<PerformanceCycle> findByTenantIdAndIsDefaultTrue(String tenantId) {
        return findAll().stream()
                .filter(cycle -> Boolean.TRUE.equals(cycle.getIsDefault()))
                .findFirst();
    }

    @Override
    public List<PerformanceCycle> findActiveCycles(String tenantId) {
        return findAll().stream()
                .filter(cycle -> cycle.getStatus() == CycleStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByNameAndTenantId(String name, String tenantId) {
        return findAll().stream()
                .anyMatch(cycle -> cycle.getName() != null && cycle.getName().equals(name));
    }

    @Override
    protected PerformanceCycle toEntity(PerformanceCycleItem item) {
        if (item == null) return null;

        PerformanceCycle entity = new PerformanceCycle();
        entity.setId(item.getId() != null ? Long.parseLong(item.getId()) : null);
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setDescription(item.getDescription());

        entity.setStartDate(item.getStartDate());
        entity.setEndDate(item.getEndDate());
        entity.setMidYearDeadline(item.getMidYearDeadline());
        entity.setFinalReviewDeadline(item.getFinalReviewDeadline());

        if (item.getStatus() != null) {
            entity.setStatus(CycleStatus.valueOf(item.getStatus()));
        }

        entity.setIsDefault(item.getIsDefault());

        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        entity.setCreatedBy(item.getCreatedBy());

        return entity;
    }

    @Override
    protected PerformanceCycleItem toItem(PerformanceCycle entity) {
        if (entity == null) return null;

        PerformanceCycleItem item = new PerformanceCycleItem();
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());

        item.setStartDate(entity.getStartDate());
        item.setEndDate(entity.getEndDate());
        item.setMidYearDeadline(entity.getMidYearDeadline());
        item.setFinalReviewDeadline(entity.getFinalReviewDeadline());

        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }

        item.setIsDefault(entity.getIsDefault());

        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        item.setCreatedBy(entity.getCreatedBy());

        // GSI1 for status queries
        if (entity.getStatus() != null) {
            item.setGsi1pk("PC_STATUS#" + entity.getTenantId() + "#" + entity.getStatus().name());
            item.setGsi1sk("PERF_CYCLE#" + item.getId());
        }

        return item;
    }
}
