package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.CompetencyFramework;
import com.arthmatic.shumelahire.repository.CompetencyFrameworkDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CompetencyFrameworkItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoCompetencyFrameworkRepository extends DynamoRepository<CompetencyFrameworkItem, CompetencyFramework> implements CompetencyFrameworkDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoCompetencyFrameworkRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName
    ) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, CompetencyFrameworkItem.class);
    }

    @Override
    public List<CompetencyFramework> findByIsActiveTrue() {
        return findAll().stream()
                .filter(framework -> framework.getIsActive() != null && framework.getIsActive())
                .collect(Collectors.toList());
    }

    @Override
    protected String entityType() {
        return "COMP_FRAME";
    }

    @Override
    protected CompetencyFramework toEntity(CompetencyFrameworkItem item) {
        if (item == null) {
            return null;
        }

        CompetencyFramework entity = new CompetencyFramework();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setIsActive(item.getIsActive());
        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        return entity;
    }

    @Override
    protected CompetencyFrameworkItem toItem(CompetencyFramework entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        CompetencyFrameworkItem item = new CompetencyFrameworkItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setIsActive(entity.getIsActive());
        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        return item;
    }
}
