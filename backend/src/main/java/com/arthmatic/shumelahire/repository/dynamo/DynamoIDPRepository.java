package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.IDPGoal;
import com.arthmatic.shumelahire.entity.training.IndividualDevelopmentPlan;
import com.arthmatic.shumelahire.entity.training.IndividualDevelopmentPlan.IDPStatus;
import com.arthmatic.shumelahire.repository.IDPDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.IDPItem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoIDPRepository extends DynamoRepository<IDPItem, IndividualDevelopmentPlan>
        implements IDPDataRepository {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public DynamoIDPRepository(DynamoDbClient dynamoDbClient,
                               DynamoDbEnhancedClient enhancedClient,
                               @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, IDPItem.class);
    }

    @Override
    protected String entityType() {
        return "IDP";
    }

    @Override
    public List<IndividualDevelopmentPlan> findByEmployeeId(String employeeId) {
        String gsi1pk = "IDP_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<IndividualDevelopmentPlan> findByManagerId(String managerId) {
        return findAll().stream()
                .filter(idp -> idp.getManagerId() != null && managerId.equals(idp.getManagerId()))
                .collect(Collectors.toList());
    }

    @Override
    protected IDPItem toItem(IndividualDevelopmentPlan entity) {
        IDPItem item = new IDPItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("IDP#" + id);

        String employeeId = entity.getEmployeeId() != null ? entity.getEmployeeId() : "";
        item.setGsi1pk("IDP_EMP#" + tenantId + "#" + employeeId);
        item.setGsi1sk("IDP#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(entity.getEmployeeId() != null ? entity.getEmployeeId() : null);
        item.setTitle(entity.getTitle());
        item.setDescription(entity.getDescription());
        item.setStartDate(entity.getStartDate() != null ? entity.getStartDate().toString() : null);
        item.setTargetDate(entity.getTargetDate() != null ? entity.getTargetDate().toString() : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setManagerId(entity.getManagerId() != null ? entity.getManagerId() : null);

        if (entity.getGoals() != null) {
            try {
                item.setGoalsJson(MAPPER.writeValueAsString(entity.getGoals()));
            } catch (JsonProcessingException e) {
                item.setGoalsJson(null);
            }
        }

        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected IndividualDevelopmentPlan toEntity(IDPItem item) {
        IndividualDevelopmentPlan entity = new IndividualDevelopmentPlan();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setEmployeeId(item.getEmployeeId() != null ? item.getEmployeeId() : null);
        entity.setTitle(item.getTitle());
        entity.setDescription(item.getDescription());
        entity.setStartDate(item.getStartDate() != null ? LocalDate.parse(item.getStartDate()) : null);
        entity.setTargetDate(item.getTargetDate() != null ? LocalDate.parse(item.getTargetDate()) : null);
        entity.setStatus(item.getStatus() != null ? IDPStatus.valueOf(item.getStatus()) : null);
        entity.setManagerId(item.getManagerId() != null ? item.getManagerId() : null);

        if (item.getGoalsJson() != null) {
            try {
                List<IDPGoal> goals = MAPPER.readValue(item.getGoalsJson(), new TypeReference<List<IDPGoal>>() {});
                entity.setGoals(goals);
            } catch (JsonProcessingException e) {
                entity.setGoals(Collections.emptyList());
            }
        }

        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
