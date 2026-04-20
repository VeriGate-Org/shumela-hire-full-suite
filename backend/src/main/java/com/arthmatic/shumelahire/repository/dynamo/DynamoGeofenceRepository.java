package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.attendance.Geofence;
import com.arthmatic.shumelahire.repository.GeofenceDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.GeofenceItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoGeofenceRepository extends DynamoRepository<GeofenceItem, Geofence>
        implements GeofenceDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoGeofenceRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, GeofenceItem.class);
    }

    @Override
    protected String entityType() {
        return "GEOFENCE";
    }

    @Override
    public List<Geofence> findByIsActiveTrue() {
        return findAll().stream()
                .filter(g -> Boolean.TRUE.equals(g.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    protected Geofence toEntity(GeofenceItem item) {
        if (item == null) return null;

        Geofence entity = new Geofence();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setLatitude(item.getLatitude() != null ? Double.parseDouble(item.getLatitude()) : null);
        entity.setLongitude(item.getLongitude() != null ? Double.parseDouble(item.getLongitude()) : null);
        entity.setRadiusMeters(item.getRadiusMeters());
        entity.setIsActive(item.getIsActive());
        entity.setAddress(item.getAddress());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected GeofenceItem toItem(Geofence entity) {
        if (entity == null) return null;

        GeofenceItem item = new GeofenceItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("GEOFENCE#" + entity.getId());
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());
        item.setName(entity.getName());
        item.setLatitude(entity.getLatitude() != null ? String.valueOf(entity.getLatitude()) : null);
        item.setLongitude(entity.getLongitude() != null ? String.valueOf(entity.getLongitude()) : null);
        item.setRadiusMeters(entity.getRadiusMeters());
        item.setIsActive(entity.getIsActive());
        item.setAddress(entity.getAddress());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : null);

        return item;
    }
}
