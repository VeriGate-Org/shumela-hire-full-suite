package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.PlatformModule;
import com.arthmatic.shumelahire.repository.PlatformModuleDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PlatformModuleItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the PlatformModule entity.
 * <p>
 * PlatformModule is a global (non-tenant-scoped) entity. Its PK is always "PLATFORM"
 * instead of "TENANT#{tenantId}".
 * <p>
 * Key schema:
 * <pre>
 *   PK:     PLATFORM
 *   SK:     MODULE#{id}
 *   GSI1PK: MODULE_ACTIVE#{isActive}     GSI1SK: MODULE#{code}
 *   GSI4PK: MODULE_CODE#{code}           GSI4SK: MODULE#{id}
 * </pre>
 */
@Repository
public class DynamoPlatformModuleRepository extends DynamoRepository<PlatformModuleItem, PlatformModule>
        implements PlatformModuleDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String PLATFORM_PK = "PLATFORM";

    public DynamoPlatformModuleRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PlatformModuleItem.class);
    }

    @Override
    protected String entityType() {
        return "MODULE";
    }

    /**
     * Override tenantPk() — PlatformModule is global, not tenant-scoped.
     * PK is always "PLATFORM".
     */
    @Override
    protected String tenantPk() {
        return PLATFORM_PK;
    }

    // -- Override CRUD to use PLATFORM PK (no TenantContext needed) --

    @Override
    public Optional<PlatformModule> findById(String id) {
        var item = table.getItem(Key.builder()
                .partitionValue(PLATFORM_PK)
                .sortValue(entitySk(id))
                .build());
        return Optional.ofNullable(item).map(this::toEntity);
    }

    @Override
    public void deleteById(String id) {
        table.deleteItem(Key.builder()
                .partitionValue(PLATFORM_PK)
                .sortValue(entitySk(id))
                .build());
    }

    @Override
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    @Override
    public List<PlatformModule> findAll() {
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(PLATFORM_PK).build(),
                        ":skPrefix", AttributeValue.builder().s("MODULE#").build()
                ))
                .build());

        return response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    // -- PlatformModuleDataRepository implementation --

    @Override
    public Optional<PlatformModule> findByCode(String code) {
        return findByGsiUnique("GSI4", "MODULE_CODE#" + code);
    }

    @Override
    public List<PlatformModule> findByIsActiveTrue() {
        return queryGsiAll("GSI1", "MODULE_ACTIVE#true");
    }

    @Override
    public boolean existsByCode(String code) {
        return findByCode(code).isPresent();
    }

    // -- Conversion: PlatformModuleItem <-> PlatformModule --

    @Override
    protected PlatformModule toEntity(PlatformModuleItem item) {
        var module = new PlatformModule();
        if (item.getId() != null) {
            module.setId(item.getId());
        }
        module.setCode(item.getCode());
        module.setName(item.getName());
        module.setDescription(item.getDescription());
        module.setFeatureCodes(item.getFeatureCodes());
        if (item.getIsActive() != null) {
            module.setActive(item.getIsActive());
        }
        if (item.getCreatedAt() != null) {
            module.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            module.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return module;
    }

    @Override
    protected PlatformModuleItem toItem(PlatformModule entity) {
        var item = new PlatformModuleItem();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        // Table keys — global, not tenant-scoped
        item.setPk(PLATFORM_PK);
        item.setSk("MODULE#" + id);

        // GSI1: Active status index
        item.setGsi1pk("MODULE_ACTIVE#" + entity.isActive());
        item.setGsi1sk("MODULE#" + entity.getCode());

        // GSI4: Unique constraint on code
        item.setGsi4pk("MODULE_CODE#" + entity.getCode());
        item.setGsi4sk("MODULE#" + id);

        // Entity fields
        item.setId(id);
        item.setCode(entity.getCode());
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setFeatureCodes(entity.getFeatureCodes());
        item.setIsActive(entity.isActive());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
