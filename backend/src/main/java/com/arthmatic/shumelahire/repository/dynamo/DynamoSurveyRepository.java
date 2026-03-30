package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.engagement.Survey;
import com.arthmatic.shumelahire.entity.engagement.SurveyStatus;
import com.arthmatic.shumelahire.repository.SurveyDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SurveyItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSurveyRepository extends DynamoRepository<SurveyItem, Survey>
        implements SurveyDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSurveyRepository(DynamoDbClient dynamoDbClient,
                                   DynamoDbEnhancedClient enhancedClient,
                                   String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SurveyItem.class);
    }

    @Override
    protected String entityType() {
        return "SURVEY";
    }

    @Override
    public List<Survey> findByStatus(SurveyStatus status) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "SURVEY_STATUS#" + tenantId + "#" + status.name());
    }

    @Override
    public List<Survey> findByCreatedBy(String createdBy) {
        return findAll().stream()
                .filter(s -> createdBy.equals(s.getCreatedBy() != null ? s.getCreatedBy().toString() : null))
                .collect(Collectors.toList());
    }

    @Override
    protected Survey toEntity(SurveyItem item) {
        var e = new Survey();
        if (item.getId() != null) {
            try {
                e.setId(Long.parseLong(item.getId()));
            } catch (NumberFormatException ex) {
                // Skip invalid ID
            }
        }
        e.setTenantId(item.getTenantId());
        e.setTitle(item.getTitle());
        e.setDescription(item.getDescription());
        if (item.getStatus() != null) {
            e.setStatus(SurveyStatus.valueOf(item.getStatus()));
        }
        e.setIsAnonymous(item.getIsAnonymous());
        e.setStartDate(item.getStartDate());
        e.setEndDate(item.getEndDate());
        if (item.getCreatedBy() != null) {
            try {
                e.setCreatedBy(Long.parseLong(item.getCreatedBy()));
            } catch (NumberFormatException ex) {
                // Skip invalid createdBy
            }
        }
        e.setCreatedAt(item.getCreatedAt());
        e.setUpdatedAt(item.getUpdatedAt());
        return e;
    }

    @Override
    protected SurveyItem toItem(Survey entity) {
        var item = new SurveyItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();

        item.setPk("TENANT#" + tenantId);
        item.setSk("SURVEY#" + id);
        item.setGsi1pk("SURVEY_STATUS#" + tenantId + "#" + (entity.getStatus() != null ? entity.getStatus().name() : ""));
        item.setGsi1sk("SURVEY#" + createdAt.format(ISO_FMT));

        item.setId(id);
        item.setTenantId(tenantId);
        item.setTitle(entity.getTitle());
        item.setDescription(entity.getDescription());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        item.setIsAnonymous(entity.getIsAnonymous());
        item.setStartDate(entity.getStartDate());
        item.setEndDate(entity.getEndDate());
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy().toString());
        }
        item.setCreatedAt(createdAt);
        item.setUpdatedAt(entity.getUpdatedAt());
        return item;
    }
}
