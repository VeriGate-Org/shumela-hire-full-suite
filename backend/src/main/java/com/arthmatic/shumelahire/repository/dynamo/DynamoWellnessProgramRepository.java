package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.engagement.WellnessProgram;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgramType;
import com.arthmatic.shumelahire.repository.WellnessProgramDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.WellnessProgramItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoWellnessProgramRepository extends DynamoRepository<WellnessProgramItem, WellnessProgram>
        implements WellnessProgramDataRepository {

    public DynamoWellnessProgramRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, WellnessProgramItem.class);
    }

    @Override
    protected String entityType() {
        return "WELLNESS_PROG";
    }

    @Override
    public List<WellnessProgram> findByIsActiveTrue() {
        return findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public List<WellnessProgram> findByProgramType(WellnessProgramType programType) {
        return findAll().stream()
                .filter(p -> programType.equals(p.getProgramType()))
                .collect(Collectors.toList());
    }

    @Override
    protected WellnessProgram toEntity(WellnessProgramItem item) {
        var e = new WellnessProgram();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());
        e.setName(item.getName());
        e.setDescription(item.getDescription());
        if (item.getProgramType() != null) {
            e.setProgramType(WellnessProgramType.valueOf(item.getProgramType()));
        }
        e.setStartDate(item.getStartDate());
        e.setEndDate(item.getEndDate());
        e.setIsActive(item.getIsActive());
        e.setMaxParticipants(item.getMaxParticipants());
        e.setCreatedAt(item.getCreatedAt());
        e.setUpdatedAt(item.getUpdatedAt());
        return e;
    }

    @Override
    protected WellnessProgramItem toItem(WellnessProgram entity) {
        var item = new WellnessProgramItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();

        item.setPk("TENANT#" + tenantId);
        item.setSk("WELLNESS_PROG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        if (entity.getProgramType() != null) {
            item.setProgramType(entity.getProgramType().name());
        }
        item.setStartDate(entity.getStartDate());
        item.setEndDate(entity.getEndDate());
        item.setIsActive(entity.getIsActive());
        item.setMaxParticipants(entity.getMaxParticipants());
        item.setCreatedAt(createdAt);
        item.setUpdatedAt(entity.getUpdatedAt());
        return item;
    }
}
