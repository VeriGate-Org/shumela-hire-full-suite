package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.CursorPage;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Generic base repository for DynamoDB single-table design.
 * All operations are tenant-scoped via PK prefix: TENANT#{tenantId}.
 *
 * @param <T> The DynamoDB item POJO type
 * @param <E> The JPA entity type (for conversion)
 */
public abstract class DynamoRepository<T, E> {

    protected final DynamoDbClient dynamoDbClient;
    protected final DynamoDbEnhancedClient enhancedClient;
    protected final DynamoDbTable<T> table;
    protected final String tableName;

    protected DynamoRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            String tableName,
            Class<T> itemClass) {
        this.dynamoDbClient = dynamoDbClient;
        this.enhancedClient = enhancedClient;
        this.tableName = tableName;
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(itemClass));
    }

    // ── ID conversion utility ─────────────────────────────────────────────────

    /**
     * Safely parse a DynamoDB string ID to Long.
     * UUID-based IDs (from seed scripts) are converted via hashCode.
     */
    protected static Long safeParseLong(String value) {
        if (value == null) return null;
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return (long) value.hashCode();
        }
    }

    // ── Abstract methods for entity/item conversion ──────────────────────────

    /** Convert DynamoDB item to JPA entity */
    protected abstract E toEntity(T item);

    /** Convert JPA entity to DynamoDB item */
    protected abstract T toItem(E entity);

    /** The entity type prefix used in SK (e.g., "APPLICATION", "EMPLOYEE") */
    protected abstract String entityType();

    // ── Tenant-scoped key builders ───────────────────────────────────────────

    protected String tenantPk() {
        return "TENANT#" + currentTenantId();
    }

    protected String entitySk(String entityId) {
        return entityType() + "#" + entityId;
    }

    protected String currentTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Tenant context is not set");
        }
        return tenantId;
    }

    // ── CRUD operations ─────────────────────────────────────────────────────

    public Optional<E> findById(String id) {
        T item = table.getItem(Key.builder()
                .partitionValue(tenantPk())
                .sortValue(entitySk(id))
                .build());
        return Optional.ofNullable(item).map(this::toEntity);
    }

    public E save(E entity) {
        T item = toItem(entity);
        table.putItem(item);
        return entity;
    }

    public List<E> saveAll(List<E> entities) {
        if (entities.isEmpty()) return entities;

        // DynamoDB batch write max 25 items at a time
        var batches = partition(entities, 25);
        for (var batch : batches) {
            var writeBatch = WriteBatch.builder(table.tableSchema().itemType().rawClass())
                    .mappedTableResource(table);
            for (E entity : batch) {
                writeBatch.addPutItem(toItem(entity));
            }
            enhancedClient.batchWriteItem(BatchWriteItemEnhancedRequest.builder()
                    .addWriteBatch(writeBatch.build())
                    .build());
        }
        return entities;
    }

    public void deleteById(String id) {
        table.deleteItem(Key.builder()
                .partitionValue(tenantPk())
                .sortValue(entitySk(id))
                .build());
    }

    public void delete(E entity) {
        T item = toItem(entity);
        table.deleteItem(item);
    }

    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    // ── Query operations ─────────────────────────────────────────────────────

    /**
     * Query all items of this entity type for the current tenant.
     */
    public List<E> findAll() {
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(tenantPk()).build(),
                        ":skPrefix", AttributeValue.builder().s(entityType() + "#").build()
                ))
                .build());

        return response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    /**
     * Query with cursor-based pagination on the main table.
     */
    public CursorPage<E> findAllPaginated(String cursor, int pageSize) {
        var requestBuilder = QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(tenantPk()).build(),
                        ":skPrefix", AttributeValue.builder().s(entityType() + "#").build()
                ))
                .limit(pageSize);

        Map<String, AttributeValue> exclusiveStartKey = CursorPage.decodeCursor(cursor);
        if (exclusiveStartKey != null) {
            requestBuilder.exclusiveStartKey(exclusiveStartKey);
        }

        var response = dynamoDbClient.query(requestBuilder.build());

        List<E> content = response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());

        return CursorPage.of(content, response.lastEvaluatedKey(), pageSize);
    }

    /**
     * Query a GSI with cursor-based pagination.
     */
    public CursorPage<E> queryGsi(String indexName, String pkValue, String skPrefix,
                                   String cursor, int pageSize) {
        var exprValues = new HashMap<String, AttributeValue>();
        exprValues.put(":pk", AttributeValue.builder().s(pkValue).build());

        String keyCondition = indexName.replace("GSI", "GSI") + "PK = :pk";
        // Adjust to use the actual GSI key names
        String gsiPkName = indexName + "PK";
        String gsiSkName = indexName + "SK";
        keyCondition = gsiPkName + " = :pk";

        if (skPrefix != null && !skPrefix.isBlank()) {
            exprValues.put(":skPrefix", AttributeValue.builder().s(skPrefix).build());
            keyCondition += " AND begins_with(" + gsiSkName + ", :skPrefix)";
        }

        var requestBuilder = QueryRequest.builder()
                .tableName(tableName)
                .indexName(indexName)
                .keyConditionExpression(keyCondition)
                .expressionAttributeValues(exprValues)
                .limit(pageSize);

        Map<String, AttributeValue> exclusiveStartKey = CursorPage.decodeCursor(cursor);
        if (exclusiveStartKey != null) {
            requestBuilder.exclusiveStartKey(exclusiveStartKey);
        }

        var response = dynamoDbClient.query(requestBuilder.build());

        List<E> content = response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());

        return CursorPage.of(content, response.lastEvaluatedKey(), pageSize);
    }

    /**
     * Query a GSI with a sort key range (between two values).
     */
    public CursorPage<E> queryGsiRange(String indexName, String pkValue,
                                        String skStart, String skEnd,
                                        String cursor, int pageSize) {
        String gsiPkName = indexName + "PK";
        String gsiSkName = indexName + "SK";

        var exprValues = new HashMap<String, AttributeValue>();
        exprValues.put(":pk", AttributeValue.builder().s(pkValue).build());
        exprValues.put(":skStart", AttributeValue.builder().s(skStart).build());
        exprValues.put(":skEnd", AttributeValue.builder().s(skEnd).build());

        String keyCondition = gsiPkName + " = :pk AND " + gsiSkName + " BETWEEN :skStart AND :skEnd";

        var requestBuilder = QueryRequest.builder()
                .tableName(tableName)
                .indexName(indexName)
                .keyConditionExpression(keyCondition)
                .expressionAttributeValues(exprValues)
                .limit(pageSize);

        Map<String, AttributeValue> exclusiveStartKey = CursorPage.decodeCursor(cursor);
        if (exclusiveStartKey != null) {
            requestBuilder.exclusiveStartKey(exclusiveStartKey);
        }

        var response = dynamoDbClient.query(requestBuilder.build());

        List<E> content = response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());

        return CursorPage.of(content, response.lastEvaluatedKey(), pageSize);
    }

    /**
     * Query by exact GSI partition key (returns all matching items, no pagination).
     */
    public List<E> queryGsiAll(String indexName, String pkValue) {
        String gsiPkName = indexName + "PK";

        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .indexName(indexName)
                .keyConditionExpression(gsiPkName + " = :pk")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(pkValue).build()
                ))
                .build());

        return response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    /**
     * Find a single item by GSI unique constraint (GSI4).
     */
    public Optional<E> findByGsiUnique(String indexName, String pkValue) {
        String gsiPkName = indexName + "PK";

        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .indexName(indexName)
                .keyConditionExpression(gsiPkName + " = :pk")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(pkValue).build()
                ))
                .limit(1)
                .build());

        return response.items().stream()
                .findFirst()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity);
    }

    // ── Transaction support ──────────────────────────────────────────────────

    /**
     * Execute a DynamoDB TransactWriteItems (up to 100 items).
     */
    public void transactWrite(List<TransactWriteItem> items) {
        if (items.isEmpty()) return;

        // DynamoDB max 100 items per transaction
        var batches = partition(items, 100);
        for (var batch : batches) {
            dynamoDbClient.transactWriteItems(TransactWriteItemsRequest.builder()
                    .transactItems(batch)
                    .build());
        }
    }

    /**
     * Build a Put TransactWriteItem for use in transactions.
     */
    protected TransactWriteItem putTransactItem(T item) {
        return TransactWriteItem.builder()
                .put(Put.builder()
                        .tableName(tableName)
                        .item(table.tableSchema().itemToMap(item, false))
                        .build())
                .build();
    }

    /**
     * Build a Delete TransactWriteItem for use in transactions.
     */
    protected TransactWriteItem deleteTransactItem(String pk, String sk) {
        return TransactWriteItem.builder()
                .delete(Delete.builder()
                        .tableName(tableName)
                        .key(Map.of(
                                "PK", AttributeValue.builder().s(pk).build(),
                                "SK", AttributeValue.builder().s(sk).build()
                        ))
                        .build())
                .build();
    }

    // ── Count (scan with filter — use sparingly) ─────────────────────────────

    public long count() {
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(tenantPk()).build(),
                        ":skPrefix", AttributeValue.builder().s(entityType() + "#").build()
                ))
                .select(Select.COUNT)
                .build());

        return response.count();
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    protected static <U> List<List<U>> partition(List<U> list, int size) {
        List<List<U>> result = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            result.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return result;
    }
}
