package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import com.arthmatic.shumelahire.entity.training.DeliveryMethod;
import com.arthmatic.shumelahire.repository.TrainingCourseDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TrainingCourseItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class DynamoTrainingCourseRepository extends DynamoRepository<TrainingCourseItem, TrainingCourse>
        implements TrainingCourseDataRepository {

    public DynamoTrainingCourseRepository(DynamoDbClient dynamoDbClient,
                                          DynamoDbEnhancedClient enhancedClient,
                                          @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, TrainingCourseItem.class);
    }

    @Override
    protected String entityType() {
        return "TRAIN_COURSE";
    }

    @Override
    public List<TrainingCourse> findByIsActiveTrue() {
        return findAll().stream()
                .filter(TrainingCourse::getIsActive)
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingCourse> findByCategory(String category) {
        String gsi1pk = "TC_CAT#" + currentTenantId() + "#" + category;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<TrainingCourse> findByDeliveryMethod(DeliveryMethod deliveryMethod) {
        return findAll().stream()
                .filter(c -> c.getDeliveryMethod() == deliveryMethod)
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingCourse> findByIsMandatoryTrue() {
        return findAll().stream()
                .filter(TrainingCourse::getIsMandatory)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TrainingCourse> findByCode(String code) {
        return findAll().stream()
                .filter(c -> code.equals(c.getCode()))
                .findFirst();
    }

    @Override
    public List<String> findDistinctCategories() {
        return findAll().stream()
                .map(TrainingCourse::getCategory)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingCourse> searchCourses(String searchTerm) {
        String lowerTerm = searchTerm.toLowerCase();
        return findAll().stream()
                .filter(c -> (c.getTitle() != null && c.getTitle().toLowerCase().contains(lowerTerm)) ||
                        (c.getDescription() != null && c.getDescription().toLowerCase().contains(lowerTerm)) ||
                        (c.getCode() != null && c.getCode().toLowerCase().contains(lowerTerm)))
                .collect(Collectors.toList());
    }

    @Override
    protected TrainingCourseItem toItem(TrainingCourse entity) {
        TrainingCourseItem item = new TrainingCourseItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("TRAIN_COURSE#" + entity.getId());
        item.setGsi1pk("TC_CAT#" + entity.getTenantId() + "#" + (entity.getCategory() != null ? entity.getCategory() : ""));
        item.setGsi1sk("TRAIN_COURSE#" + entity.getId());
        item.setId(entity.getId() != null ? String.valueOf(entity.getId()) : null);
        item.setTenantId(entity.getTenantId());
        item.setTitle(entity.getTitle());
        item.setCode(entity.getCode());
        item.setDescription(entity.getDescription());
        item.setDeliveryMethod(entity.getDeliveryMethod() != null ? entity.getDeliveryMethod().name() : null);
        item.setCategory(entity.getCategory());
        item.setProvider(entity.getProvider());
        item.setDurationHours(entity.getDurationHours() != null ? entity.getDurationHours().toPlainString() : null);
        item.setMaxParticipants(entity.getMaxParticipants());
        item.setCost(entity.getCost() != null ? entity.getCost().toPlainString() : null);
        item.setIsMandatory(entity.getIsMandatory());
        item.setIsActive(entity.getIsActive());
        item.setLinkedCompetencyIds(entity.getLinkedCompetencyIds() != null && !entity.getLinkedCompetencyIds().isBlank()
                ? Arrays.asList(entity.getLinkedCompetencyIds().split(","))
                : null);
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected TrainingCourse toEntity(TrainingCourseItem item) {
        TrainingCourse entity = new TrainingCourse();
        if (item.getId() != null) {
            try { entity.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ignored) {}
        }
        entity.setTenantId(item.getTenantId());
        entity.setTitle(item.getTitle());
        entity.setCode(item.getCode());
        entity.setDescription(item.getDescription());
        entity.setDeliveryMethod(item.getDeliveryMethod() != null ? DeliveryMethod.valueOf(item.getDeliveryMethod()) : null);
        entity.setCategory(item.getCategory());
        entity.setProvider(item.getProvider());
        entity.setDurationHours(item.getDurationHours() != null ? new BigDecimal(item.getDurationHours()) : null);
        entity.setMaxParticipants(item.getMaxParticipants());
        entity.setCost(item.getCost() != null ? new BigDecimal(item.getCost()) : null);
        entity.setIsMandatory(item.getIsMandatory());
        entity.setIsActive(item.getIsActive());
        entity.setLinkedCompetencyIds(item.getLinkedCompetencyIds() != null && !item.getLinkedCompetencyIds().isEmpty()
                ? String.join(",", item.getLinkedCompetencyIds())
                : null);
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
