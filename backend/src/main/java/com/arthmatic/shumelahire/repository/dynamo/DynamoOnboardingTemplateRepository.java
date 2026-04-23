package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.onboarding.OnboardingTemplate;
import com.arthmatic.shumelahire.entity.onboarding.OnboardingTemplateItem;
import com.arthmatic.shumelahire.repository.OnboardingTemplateDataRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoOnboardingTemplateRepository
        extends DynamoRepository<com.arthmatic.shumelahire.repository.dynamo.items.OnboardingTemplateItem, OnboardingTemplate>
        implements OnboardingTemplateDataRepository {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public DynamoOnboardingTemplateRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName,
                com.arthmatic.shumelahire.repository.dynamo.items.OnboardingTemplateItem.class);
    }

    @Override
    protected String entityType() {
        return "ONBOARD_TEMPLATE";
    }

    @Override
    public List<OnboardingTemplate> findActive() {
        return findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    protected com.arthmatic.shumelahire.repository.dynamo.items.OnboardingTemplateItem toItem(OnboardingTemplate entity) {
        var item = new com.arthmatic.shumelahire.repository.dynamo.items.OnboardingTemplateItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("ONBOARD_TEMPLATE#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setDepartment(entity.getDepartment());
        item.setIsActive(entity.getIsActive());

        if (entity.getItems() != null) {
            try {
                item.setItemsJson(MAPPER.writeValueAsString(entity.getItems()));
            } catch (JsonProcessingException e) {
                item.setItemsJson(null);
            }
        }

        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected OnboardingTemplate toEntity(com.arthmatic.shumelahire.repository.dynamo.items.OnboardingTemplateItem item) {
        OnboardingTemplate entity = new OnboardingTemplate();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setDepartment(item.getDepartment());
        entity.setIsActive(item.getIsActive() != null ? item.getIsActive() : true);

        if (item.getItemsJson() != null) {
            try {
                List<OnboardingTemplateItem> items = MAPPER.readValue(item.getItemsJson(),
                        new TypeReference<List<OnboardingTemplateItem>>() {});
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
