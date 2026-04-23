package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.PipMilestone;
import com.arthmatic.shumelahire.entity.performance.PipMilestoneStatus;
import com.arthmatic.shumelahire.entity.performance.PerformanceImprovementPlan;
import com.arthmatic.shumelahire.repository.PipMilestoneDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PipMilestoneItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoPipMilestoneRepository extends DynamoRepository<PipMilestoneItem, PipMilestone>
        implements PipMilestoneDataRepository {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoPipMilestoneRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PipMilestoneItem.class);
    }

    @Override
    protected String entityType() {
        return "PIP_MILE";
    }

    @Override
    public List<PipMilestone> findByPipIdOrderByTargetDateAsc(String pipId) {
        String gsi1PkValue = "PM_PIP#" + currentTenantId() + "#" + pipId;
        // GSI1SK is PIP_MILE#{targetDate}, so results are already sorted by target date
        return queryGsiAll("GSI1", gsi1PkValue);
    }

    @Override
    public List<PipMilestone> findByPipIdAndStatus(String pipId, PipMilestoneStatus status) {
        String gsi1PkValue = "PM_PIP#" + currentTenantId() + "#" + pipId;
        return queryGsiAll("GSI1", gsi1PkValue).stream()
                .filter(milestone -> milestone.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    protected PipMilestone toEntity(PipMilestoneItem item) {
        if (item == null) return null;

        PipMilestone entity = new PipMilestone();
        entity.setId(item.getId());
        entity.setTenantId(item.getTenantId());

        // Create PIP stub
        if (item.getPipId() != null) {
            PerformanceImprovementPlan pip = new PerformanceImprovementPlan();
            pip.setId(item.getPipId());
            entity.setPip(pip);
        }

        entity.setTitle(item.getTitle());
        entity.setDescription(item.getDescription());

        entity.setTargetDate(item.getTargetDate());

        if (item.getStatus() != null) {
            entity.setStatus(PipMilestoneStatus.valueOf(item.getStatus()));
        }

        entity.setEvidence(item.getEvidence());

        entity.setReviewedAt(item.getReviewedAt());
        entity.setCreatedAt(item.getCreatedAt());

        return entity;
    }

    @Override
    protected PipMilestoneItem toItem(PipMilestone entity) {
        if (entity == null) return null;

        PipMilestoneItem item = new PipMilestoneItem();
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());

        // Store FK ID
        if (entity.getPip() != null && entity.getPip().getId() != null) {
            item.setPipId(entity.getPip().getId());
        }

        item.setTitle(entity.getTitle());
        item.setDescription(entity.getDescription());

        item.setTargetDate(entity.getTargetDate());

        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }

        item.setEvidence(entity.getEvidence());

        item.setReviewedAt(entity.getReviewedAt());
        item.setCreatedAt(entity.getCreatedAt());

        // GSI1 for PIP queries (sorted by target date)
        if (entity.getPip() != null && entity.getPip().getId() != null) {
            item.setGsi1pk("PM_PIP#" + entity.getTenantId() + "#" + entity.getPip().getId());
            if (entity.getTargetDate() != null) {
                item.setGsi1sk("PIP_MILE#" + entity.getTargetDate().format(DATE_FMT));
            } else {
                item.setGsi1sk("PIP_MILE#" + item.getId());
            }
        }

        return item;
    }
}
