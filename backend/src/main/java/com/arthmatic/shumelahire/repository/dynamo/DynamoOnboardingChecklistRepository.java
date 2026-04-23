package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.onboarding.OnboardingChecklist;
import com.arthmatic.shumelahire.entity.onboarding.OnboardingChecklist.ChecklistStatus;
import com.arthmatic.shumelahire.repository.OnboardingChecklistDataRepository;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoOnboardingChecklistRepository
        extends DynamoRepository<com.arthmatic.shumelahire.repository.dynamo.items.OnboardingChecklistItem, OnboardingChecklist>
        implements OnboardingChecklistDataRepository {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public DynamoOnboardingChecklistRepository(DynamoDbClient dynamoDbClient,
                                                DynamoDbEnhancedClient enhancedClient,
                                                @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName,
                com.arthmatic.shumelahire.repository.dynamo.items.OnboardingChecklistItem.class);
    }

    @Override
    protected String entityType() {
        return "ONBOARD_CHECKLIST";
    }

    @Override
    public List<OnboardingChecklist> findByEmployeeId(String employeeId) {
        String gsi1pk = "OB_CL_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<OnboardingChecklist> findByStatus(String status) {
        return findAll().stream()
                .filter(cl -> cl.getStatus() != null && status.equals(cl.getStatus().name()))
                .collect(Collectors.toList());
    }

    @Override
    protected com.arthmatic.shumelahire.repository.dynamo.items.OnboardingChecklistItem toItem(OnboardingChecklist entity) {
        if (entity == null) return null;

        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime now = LocalDateTime.now();

        entity.setId(id);
        entity.setTenantId(tenantId);
        if (entity.getCreatedAt() == null) entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        var item = new com.arthmatic.shumelahire.repository.dynamo.items.OnboardingChecklistItem();

        item.setPk("TENANT#" + tenantId);
        item.setSk("ONBOARD_CHECKLIST#" + id);

        String employeeId = entity.getEmployeeId() != null ? entity.getEmployeeId() : "";
        item.setGsi1pk("OB_CL_EMP#" + tenantId + "#" + employeeId);
        item.setGsi1sk("ONBOARD_CHECKLIST#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(entity.getEmployeeId());
        item.setTemplateId(entity.getTemplateId());
        item.setStartDate(entity.getStartDate() != null ? entity.getStartDate().toString() : null);
        item.setDueDate(entity.getDueDate() != null ? entity.getDueDate().toString() : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setAssignedHrId(entity.getAssignedHrId());

        if (entity.getItems() != null) {
            try {
                item.setItemsJson(MAPPER.writeValueAsString(entity.getItems()));
            } catch (JsonProcessingException e) {
                item.setItemsJson(null);
            }
        }

        item.setCreatedAt(entity.getCreatedAt().toInstant(ZoneOffset.UTC));
        item.setUpdatedAt(entity.getUpdatedAt().toInstant(ZoneOffset.UTC));
        return item;
    }

    @Override
    protected OnboardingChecklist toEntity(com.arthmatic.shumelahire.repository.dynamo.items.OnboardingChecklistItem item) {
        OnboardingChecklist entity = new OnboardingChecklist();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setEmployeeId(item.getEmployeeId() != null ? item.getEmployeeId() : null);
        entity.setTemplateId(item.getTemplateId() != null ? item.getTemplateId() : null);
        entity.setStartDate(item.getStartDate() != null ? LocalDate.parse(item.getStartDate()) : null);
        entity.setDueDate(item.getDueDate() != null ? LocalDate.parse(item.getDueDate()) : null);
        entity.setStatus(item.getStatus() != null ? ChecklistStatus.valueOf(item.getStatus()) : null);
        entity.setAssignedHrId(item.getAssignedHrId() != null ? item.getAssignedHrId() : null);

        if (item.getItemsJson() != null) {
            try {
                List<com.arthmatic.shumelahire.entity.onboarding.OnboardingChecklistItem> items = MAPPER.readValue(
                        item.getItemsJson(),
                        new TypeReference<List<com.arthmatic.shumelahire.entity.onboarding.OnboardingChecklistItem>>() {});
                entity.setItems(items);
            } catch (JsonProcessingException e) {
                entity.setItems(Collections.emptyList());
            }
        }

        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
