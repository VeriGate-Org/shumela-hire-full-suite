package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.UserPreference;
import com.arthmatic.shumelahire.repository.UserPreferenceDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.UserPreferenceItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DynamoUserPreferenceRepository extends DynamoRepository<UserPreferenceItem, UserPreference>
        implements UserPreferenceDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoUserPreferenceRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, UserPreferenceItem.class);
    }

    @Override
    protected String entityType() {
        return "USER_PREF";
    }

    @Override
    public Optional<UserPreference> findByUserId(Long userId) {
        // SK is USER_PREF#{userId}, so direct lookup
        var item = table.getItem(Key.builder()
                .partitionValue(tenantPk())
                .sortValue("USER_PREF#" + userId)
                .build());
        return Optional.ofNullable(item).map(this::toEntity);
    }

    @Override
    protected UserPreference toEntity(UserPreferenceItem item) {
        var entity = new UserPreference();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        if (item.getUserId() != null) {
            entity.setUserId(safeParseLong(item.getUserId()));
        }
        entity.setPreferences(item.getPreferences());
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected UserPreferenceItem toItem(UserPreference entity) {
        var item = new UserPreferenceItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String userId = entity.getUserId() != null ? String.valueOf(entity.getUserId()) : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("USER_PREF#" + userId);

        item.setId(id);
        item.setUserId(userId);
        item.setPreferences(entity.getPreferences());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        item.setTenantId(tenantId);

        return item;
    }
}
