package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.repository.AuditLogDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.AuditLogItem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the AuditLog entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     AUDIT_LOG#{id}
 *   GSI8PK: AUDIT_USER#{tenantId}#{userId}       GSI8SK: AUDIT_LOG#{timestamp}
 *   GSI1PK: AUDIT_ACTION#{tenantId}#{action}      GSI1SK: AUDIT_LOG#{timestamp}
 * </pre>
 */
@Repository
public class DynamoAuditLogRepository extends DynamoRepository<AuditLogItem, AuditLog>
        implements AuditLogDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoAuditLogRepository(DynamoDbClient dynamoDbClient,
                                     DynamoDbEnhancedClient enhancedClient,
                                     @org.springframework.beans.factory.annotation.Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, AuditLogItem.class);
    }

    @Override
    protected String entityType() {
        return "AUDIT_LOG";
    }

    @Override
    public Page<AuditLog> findAll(Pageable pageable) {
        List<AuditLog> all = findAll();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<AuditLog> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    @Override
    public Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable) {
        List<AuditLog> filtered = findAll().stream()
                .filter(a -> entityType.equals(a.getEntityType()))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<AuditLog> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    // -- User queries ---------------------------------------------------------

    @Override
    public List<AuditLog> findByUserIdOrderByTimestampDesc(String userId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI8", "AUDIT_USER#" + tenantId + "#" + userId).stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    // -- Entity queries -------------------------------------------------------

    @Override
    public List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId) {
        return findAll().stream()
                .filter(a -> entityType.equals(a.getEntityType()))
                .filter(a -> entityId.equals(a.getEntityId()))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditLog> findRecentLogsByEntity(String entityType, String entityId) {
        return findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    @Override
    public CursorPage<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, int page, int pageSize) {
        List<AuditLog> all = findAll().stream()
                .filter(a -> entityType.equals(a.getEntityType()))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());

        int start = page * pageSize;
        if (start >= all.size()) {
            return CursorPage.empty();
        }
        int end = Math.min(start + pageSize, all.size());
        List<AuditLog> pageContent = all.subList(start, end);
        boolean hasMore = end < all.size();
        return new CursorPage<>(pageContent, hasMore ? String.valueOf(page + 1) : null, hasMore, pageContent.size(), (long) all.size());
    }

    // -- Action queries -------------------------------------------------------

    @Override
    public List<AuditLog> findByActionOrderByTimestampDesc(String action) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "AUDIT_ACTION#" + tenantId + "#" + action).stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public long countByAction(String action) {
        return findByActionOrderByTimestampDesc(action).size();
    }

    // -- Time range queries ---------------------------------------------------

    @Override
    public List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startTime, LocalDateTime endTime) {
        return findAll().stream()
                .filter(a -> a.getTimestamp() != null
                        && !a.getTimestamp().isBefore(startTime)
                        && !a.getTimestamp().isAfter(endTime))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    // -- Conversion: AuditLogItem <-> AuditLog --------------------------------

    @Override
    protected AuditLog toEntity(AuditLogItem item) {
        var entity = new AuditLog();
        if (item.getId() != null) {
            try {
                entity.setId(Long.parseLong(item.getId()));
            } catch (NumberFormatException e) {
                // DynamoDB UUID-based IDs — leave id null for entity
            }
        }
        entity.setTenantId(item.getTenantId());
        if (item.getTimestamp() != null) entity.setTimestamp(LocalDateTime.parse(item.getTimestamp(), ISO_FMT));
        entity.setUserId(item.getUserId());
        entity.setAction(item.getAction());
        entity.setEntityType(item.getEntityType());
        entity.setEntityId(item.getEntityId());
        entity.setDetails(item.getDetails());
        entity.setUserRole(item.getUserRole());
        return entity;
    }

    @Override
    protected AuditLogItem toItem(AuditLog entity) {
        var item = new AuditLogItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String timestampStr = entity.getTimestamp() != null ? entity.getTimestamp().format(ISO_FMT) : LocalDateTime.now().format(ISO_FMT);

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("AUDIT_LOG#" + id);

        // GSI1: Action type index
        item.setGsi1pk("AUDIT_ACTION#" + tenantId + "#" + (entity.getAction() != null ? entity.getAction() : ""));
        item.setGsi1sk("AUDIT_LOG#" + timestampStr);

        // GSI8: User timeline index
        item.setGsi8pk("AUDIT_USER#" + tenantId + "#" + (entity.getUserId() != null ? entity.getUserId() : ""));
        item.setGsi8sk("AUDIT_LOG#" + timestampStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setTimestamp(timestampStr);
        item.setUserId(entity.getUserId());
        item.setAction(entity.getAction());
        item.setEntityType(entity.getEntityType());
        item.setEntityId(entity.getEntityId());
        item.setDetails(entity.getDetails());
        item.setUserRole(entity.getUserRole());

        return item;
    }
}
