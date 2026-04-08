package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TenantItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * DynamoDB repository for the Tenant entity.
 *
 * Tenant is a special case: its PK is TENANT#{tenantId} and it's not nested under
 * another tenant (since tenants *are* the top-level partition).
 */
@Repository
public class DynamoTenantRepository extends DynamoRepository<TenantItem, Tenant>
        implements TenantDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoTenantRepository(DynamoDbClient dynamoDbClient,
                                   DynamoDbEnhancedClient enhancedClient,
                                   String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, TenantItem.class);
    }

    @Override
    protected String entityType() {
        return "TENANT";
    }

    /**
     * Override tenantPk() — Tenant items use their own ID as the PK,
     * not the current tenant context.  Most Tenant lookups use the
     * context-free helpers (findTenantById, findBySubdomain) so this
     * is only reached by inherited CRUD methods that assume tenant scoping.
     */
    @Override
    protected String tenantPk() {
        String tenantId = com.arthmatic.shumelahire.config.tenant.TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(
                    "TenantContext is not set. Use findTenantById() or findBySubdomain() instead of inherited CRUD methods.");
        }
        return "TENANT#" + tenantId;
    }

    // ── Custom queries ───────────────────────────────────────────────────

    /**
     * Find tenant by subdomain using GSI4 (unique constraint index).
     */
    public Optional<Tenant> findBySubdomain(String subdomain) {
        return findByGsiUnique("GSI4", "TENANT_SUBDOMAIN#" + subdomain);
    }

    /**
     * Check if a subdomain is already taken.
     */
    public boolean existsBySubdomain(String subdomain) {
        return findBySubdomain(subdomain).isPresent();
    }

    /**
     * Find a tenant directly by its ID (doesn't require TenantContext).
     */
    public Optional<Tenant> findTenantById(String tenantId) {
        var item = table.getItem(r -> r.key(k -> k
                .partitionValue("TENANT#" + tenantId)
                .sortValue("TENANT#" + tenantId)));
        return Optional.ofNullable(item).map(this::toEntity);
    }

    // ── Conversion ───────────────────────────────────────────────────────

    @Override
    protected Tenant toEntity(TenantItem item) {
        var tenant = new Tenant();
        tenant.setId(item.getId());
        tenant.setName(item.getName());
        tenant.setSubdomain(item.getSubdomain());
        tenant.setStatus(item.getStatus());
        tenant.setPlan(item.getPlan());
        tenant.setContactEmail(item.getContactEmail());
        tenant.setContactName(item.getContactName());
        tenant.setMaxUsers(item.getMaxUsers());
        tenant.setSettings(item.getSettings());
        if (item.getCreatedAt() != null) {
            tenant.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            tenant.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return tenant;
    }

    @Override
    protected TenantItem toItem(Tenant entity) {
        var item = new TenantItem();

        // Table keys
        item.setPk("TENANT#" + entity.getId());
        item.setSk("TENANT#" + entity.getId());

        // GSI1: Status index
        item.setGsi1pk("TENANT_STATUS#" + entity.getStatus());
        item.setGsi1sk("TENANT#" + entity.getId());

        // GSI4: Subdomain unique constraint
        item.setGsi4pk("TENANT_SUBDOMAIN#" + entity.getSubdomain());
        item.setGsi4sk("TENANT#" + entity.getId());

        // Entity fields
        item.setId(entity.getId());
        item.setName(entity.getName());
        item.setSubdomain(entity.getSubdomain());
        item.setStatus(entity.getStatus());
        item.setPlan(entity.getPlan());
        item.setContactEmail(entity.getContactEmail());
        item.setContactName(entity.getContactName());
        item.setMaxUsers(entity.getMaxUsers());
        item.setSettings(entity.getSettings());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
