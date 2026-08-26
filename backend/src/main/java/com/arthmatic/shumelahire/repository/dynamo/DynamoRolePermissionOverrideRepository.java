package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.RolePermissionOverride;
import com.arthmatic.shumelahire.repository.RolePermissionOverrideDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.RolePermissionOverrideItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Repository
public class DynamoRolePermissionOverrideRepository
        extends DynamoRepository<RolePermissionOverrideItem, RolePermissionOverride>
        implements RolePermissionOverrideDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoRolePermissionOverrideRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @org.springframework.beans.factory.annotation.Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, RolePermissionOverrideItem.class);
    }

    @Override
    protected String entityType() {
        return "ROLEPERM";
    }

    /**
     * The id is derived from the pair rather than random.
     *
     * <p>Toggling the same permission twice must update one record, not accumulate a history of
     * contradictions that later reads resolve by luck.
     */
    public static String idFor(String role, String permissionId) {
        return role + "#" + permissionId;
    }

    @Override
    public Optional<RolePermissionOverride> findByRoleAndPermission(String role, String permissionId) {
        return findById(idFor(role, permissionId));
    }

    @Override
    public List<RolePermissionOverride> findAll() {
        return super.findAll();
    }

    @Override
    protected RolePermissionOverride toEntity(RolePermissionOverrideItem item) {
        var o = new RolePermissionOverride();
        o.setId(item.getId());
        o.setTenantId(item.getTenantId());
        o.setRole(item.getRole());
        o.setPermissionId(item.getPermissionId());
        o.setGranted(item.getGranted());
        if (item.getUpdatedAt() != null) {
            o.setUpdatedAt(TimestampUtils.parseTimestamp(item.getUpdatedAt()));
        }
        o.setUpdatedBy(item.getUpdatedBy());
        return o;
    }

    @Override
    protected RolePermissionOverrideItem toItem(RolePermissionOverride entity) {
        var item = new RolePermissionOverrideItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : idFor(entity.getRole(), entity.getPermissionId());

        item.setPk("TENANT#" + tenantId);
        item.setSk("ROLEPERM#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setRole(entity.getRole());
        item.setPermissionId(entity.getPermissionId());
        item.setGranted(entity.getGranted());
        LocalDateTime updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : LocalDateTime.now();
        item.setUpdatedAt(updatedAt.format(ISO_FMT));
        item.setUpdatedBy(entity.getUpdatedBy());

        return item;
    }
}
