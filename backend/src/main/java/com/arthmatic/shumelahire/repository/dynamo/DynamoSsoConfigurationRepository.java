package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.integration.SsoConfiguration;
import com.arthmatic.shumelahire.entity.integration.SsoProvider;
import com.arthmatic.shumelahire.repository.SsoConfigurationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SsoConfigurationItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSsoConfigurationRepository extends DynamoRepository<SsoConfigurationItem, SsoConfiguration>
        implements SsoConfigurationDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSsoConfigurationRepository(DynamoDbClient dynamoDbClient,
                                             DynamoDbEnhancedClient enhancedClient,
                                             String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SsoConfigurationItem.class);
    }

    @Override
    protected String entityType() {
        return "SSO_CONFIG";
    }

    @Override
    public List<SsoConfiguration> findByIsEnabledTrue() {
        return findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsEnabled()))
                .collect(Collectors.toList());
    }

    @Override
    public List<SsoConfiguration> findByProvider(SsoProvider provider) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "SSO_PROVIDER#" + tenantId + "#" + provider.name());
    }

    @Override
    protected SsoConfiguration toEntity(SsoConfigurationItem item) {
        var e = new SsoConfiguration();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());
        if (item.getProvider() != null) {
            e.setProvider(SsoProvider.valueOf(item.getProvider()));
        }
        e.setDisplayName(item.getDisplayName());
        e.setClientId(item.getClientId());
        e.setClientSecret(item.getClientSecret());
        e.setTenantIdentifier(item.getTenantIdentifier());
        e.setDiscoveryUrl(item.getDiscoveryUrl());
        e.setMetadataXml(item.getMetadataXml());
        e.setIsEnabled(item.getIsEnabled());
        e.setAutoProvisionUsers(item.getAutoProvisionUsers());
        e.setDefaultRole(item.getDefaultRole());
        e.setGroupMappings(item.getGroupMappings());
        if (item.getCreatedAt() != null) {
            e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            e.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return e;
    }

    @Override
    protected SsoConfigurationItem toItem(SsoConfiguration entity) {
        var item = new SsoConfigurationItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("SSO_CONFIG#" + id);
        item.setGsi1pk("SSO_PROVIDER#" + tenantId + "#" + (entity.getProvider() != null ? entity.getProvider().name() : ""));
        item.setGsi1sk("SSO_CONFIG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getProvider() != null) {
            item.setProvider(entity.getProvider().name());
        }
        item.setDisplayName(entity.getDisplayName());
        item.setClientId(entity.getClientId());
        item.setClientSecret(entity.getClientSecret());
        item.setTenantIdentifier(entity.getTenantIdentifier());
        item.setDiscoveryUrl(entity.getDiscoveryUrl());
        item.setMetadataXml(entity.getMetadataXml());
        item.setIsEnabled(entity.getIsEnabled());
        item.setAutoProvisionUsers(entity.getAutoProvisionUsers());
        item.setDefaultRole(entity.getDefaultRole());
        item.setGroupMappings(entity.getGroupMappings());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        return item;
    }
}
