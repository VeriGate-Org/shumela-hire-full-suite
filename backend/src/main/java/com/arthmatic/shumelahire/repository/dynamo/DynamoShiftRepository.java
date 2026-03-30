package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.attendance.Shift;
import com.arthmatic.shumelahire.repository.ShiftDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ShiftItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoShiftRepository extends DynamoRepository<ShiftItem, Shift>
        implements ShiftDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoShiftRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ShiftItem.class);
    }

    @Override
    protected String entityType() {
        return "SHIFT";
    }

    @Override
    public List<Shift> findByIsActiveTrue() {
        return findAll().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Shift> findByCode(String code) {
        return findAll().stream()
                .filter(s -> code.equals(s.getCode()))
                .findFirst();
    }

    @Override
    public boolean existsByCode(String code) {
        return findByCode(code).isPresent();
    }

    @Override
    protected Shift toEntity(ShiftItem item) {
        if (item == null) {
            return null;
        }

        Shift entity = new Shift();
        entity.setId(Long.parseLong(item.getId()));
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setCode(item.getCode());
        entity.setStartTime(item.getStartTime() != null ? LocalTime.parse(item.getStartTime()) : null);
        entity.setEndTime(item.getEndTime() != null ? LocalTime.parse(item.getEndTime()) : null);
        entity.setBreakMinutes(item.getBreakMinutes());
        entity.setColorCode(item.getColorCode());
        entity.setIsActive(item.getIsActive());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected ShiftItem toItem(Shift entity) {
        if (entity == null) {
            return null;
        }

        ShiftItem item = new ShiftItem();
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());
        item.setName(entity.getName());
        item.setCode(entity.getCode());
        item.setStartTime(entity.getStartTime() != null ? entity.getStartTime().toString() : null);
        item.setEndTime(entity.getEndTime() != null ? entity.getEndTime().toString() : null);
        item.setBreakMinutes(entity.getBreakMinutes());
        item.setColorCode(entity.getColorCode());
        item.setIsActive(entity.getIsActive());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : null);

        return item;
    }
}
