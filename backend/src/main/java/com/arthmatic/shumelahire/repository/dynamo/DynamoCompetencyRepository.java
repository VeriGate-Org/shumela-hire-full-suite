package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.Competency;
import com.arthmatic.shumelahire.entity.performance.CompetencyFramework;
import com.arthmatic.shumelahire.repository.CompetencyDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CompetencyItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoCompetencyRepository extends DynamoRepository<CompetencyItem, Competency> implements CompetencyDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoCompetencyRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName
    ) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, CompetencyItem.class);
    }

    @Override
    public List<Competency> findByFrameworkId(String frameworkId) {
        String gsi1pk = "COMP_FW#" + currentTenantId() + "#" + frameworkId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<Competency> findByCategory(String category) {
        return findAll().stream()
                .filter(comp -> comp.getCategory() != null && comp.getCategory().equals(category))
                .collect(Collectors.toList());
    }

    @Override
    protected String entityType() {
        return "COMPETENCY";
    }

    @Override
    protected CompetencyItem toItem(Competency entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        CompetencyItem item = new CompetencyItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);
        item.setId(id);
        item.setTenantId(tenantId);

        if (entity.getFramework() != null && entity.getFramework().getId() != null) {
            item.setFrameworkId(entity.getFramework().getId());
            String gsi1pk = "COMP_FW#" + tenantId + "#" + entity.getFramework().getId();
            item.setGsi1pk(gsi1pk);
            item.setGsi1sk("COMP#" + id);
        }

        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setCategory(entity.getCategory());
        item.setProficiencyLevels(entity.getProficiencyLevels());
        item.setCreatedAt(entity.getCreatedAt());

        return item;
    }

    @Override
    protected Competency toEntity(CompetencyItem item) {
        if (item == null) {
            return null;
        }

        Competency entity = new Competency();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());

        if (item.getFrameworkId() != null) {
            CompetencyFramework framework = new CompetencyFramework();
            framework.setId(item.getFrameworkId());
            entity.setFramework(framework);
        }

        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setCategory(item.getCategory());
        entity.setProficiencyLevels(item.getProficiencyLevels());
        entity.setCreatedAt(item.getCreatedAt());

        return entity;
    }
}
