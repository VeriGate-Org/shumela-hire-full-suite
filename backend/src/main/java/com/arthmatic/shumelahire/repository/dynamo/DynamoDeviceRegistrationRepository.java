package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.mobile.DevicePlatform;
import com.arthmatic.shumelahire.entity.mobile.DeviceRegistration;
import com.arthmatic.shumelahire.repository.DeviceRegistrationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DeviceRegistrationItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoDeviceRegistrationRepository extends DynamoRepository<DeviceRegistrationItem, DeviceRegistration>
        implements DeviceRegistrationDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoDeviceRegistrationRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DeviceRegistrationItem.class);
    }

    @Override
    protected String entityType() {
        return "DEVICE_REG";
    }

    @Override
    public List<DeviceRegistration> findByEmployeeIdAndIsActiveOrderByRegisteredAtDesc(String employeeId, Boolean isActive) {
        return queryGsiAll("GSI2", "DEVREG_EMPLOYEE#" + employeeId).stream()
                .filter(d -> isActive == null || isActive.equals(d.getIsActive()))
                .sorted(Comparator.comparing(DeviceRegistration::getRegisteredAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<DeviceRegistration> findByEmployeeIdOrderByRegisteredAtDesc(String employeeId) {
        return queryGsiAll("GSI2", "DEVREG_EMPLOYEE#" + employeeId).stream()
                .sorted(Comparator.comparing(DeviceRegistration::getRegisteredAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DeviceRegistration> findByDeviceToken(String deviceToken) {
        return findByGsiUnique("GSI4", "DEVREG_TOKEN#" + deviceToken);
    }

    @Override
    public List<DeviceRegistration> findByTenantIdAndIsActiveOrderByRegisteredAtDesc(String tenantId, Boolean isActive) {
        // Query all device registrations for the tenant, filter by active
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s("TENANT#" + tenantId).build(),
                        ":skPrefix", AttributeValue.builder().s("DEVICE_REG#").build()
                ))
                .build());

        return response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .filter(d -> isActive == null || isActive.equals(d.getIsActive()))
                .sorted(Comparator.comparing(DeviceRegistration::getRegisteredAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<DeviceRegistration> findByTenantIdAndPlatformAndIsActive(String tenantId, DevicePlatform platform, Boolean isActive) {
        return findByTenantIdAndIsActiveOrderByRegisteredAtDesc(tenantId, isActive).stream()
                .filter(d -> platform == null || platform.equals(d.getPlatform()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByDeviceToken(String deviceToken) {
        findByDeviceToken(deviceToken).ifPresent(d ->
                deleteById(String.valueOf(d.getId())));
    }

    @Override
    protected DeviceRegistration toEntity(DeviceRegistrationItem item) {
        var entity = new DeviceRegistration();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setDeviceToken(item.getDeviceToken());
        if (item.getPlatform() != null) {
            entity.setPlatform(DevicePlatform.valueOf(item.getPlatform()));
        }
        entity.setDeviceName(item.getDeviceName());
        entity.setIsActive(item.getIsActive());
        if (item.getLastUsedAt() != null) {
            entity.setLastUsedAt(LocalDateTime.parse(item.getLastUsedAt(), ISO_FMT));
        }
        if (item.getRegisteredAt() != null) {
            entity.setRegisteredAt(LocalDateTime.parse(item.getRegisteredAt(), ISO_FMT));
        }
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected DeviceRegistrationItem toItem(DeviceRegistration entity) {
        var item = new DeviceRegistrationItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("DEVICE_REG#" + id);

        String employeeId = entity.getEmployee() != null ?
                String.valueOf(entity.getEmployee().getId()) : "";
        String registeredAtStr = entity.getRegisteredAt() != null ?
                entity.getRegisteredAt().format(ISO_FMT) : "";

        item.setGsi2pk("DEVREG_EMPLOYEE#" + employeeId);
        item.setGsi2sk("DEVICE_REG#" + registeredAtStr);

        item.setGsi4pk("DEVREG_TOKEN#" + entity.getDeviceToken());
        item.setGsi4sk("DEVICE_REG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        item.setDeviceToken(entity.getDeviceToken());
        if (entity.getPlatform() != null) {
            item.setPlatform(entity.getPlatform().name());
        }
        item.setDeviceName(entity.getDeviceName());
        item.setIsActive(entity.getIsActive());
        if (entity.getLastUsedAt() != null) {
            item.setLastUsedAt(entity.getLastUsedAt().format(ISO_FMT));
        }
        item.setRegisteredAt(registeredAtStr);

        return item;
    }
}
