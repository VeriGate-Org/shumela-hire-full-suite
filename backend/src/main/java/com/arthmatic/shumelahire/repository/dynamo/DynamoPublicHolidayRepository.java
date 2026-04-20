package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.leave.PublicHoliday;
import com.arthmatic.shumelahire.repository.PublicHolidayDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PublicHolidayItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoPublicHolidayRepository extends DynamoRepository<PublicHolidayItem, PublicHoliday>
        implements PublicHolidayDataRepository {

    public DynamoPublicHolidayRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, PublicHolidayItem.class);
    }

    @Override
    protected String entityType() {
        return "PUB_HOLIDAY";
    }

    @Override
    public List<PublicHoliday> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(ph -> ph.getHolidayDate() != null
                        && !ph.getHolidayDate().isBefore(startDate)
                        && !ph.getHolidayDate().isAfter(endDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<PublicHoliday> findByCountryOrderByHolidayDateAsc(String country) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "PH_COUNTRY#" + tenantId + "#" + country).stream()
                .sorted(Comparator.comparing(PublicHoliday::getHolidayDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByHolidayDate(LocalDate holidayDate) {
        return findAll().stream()
                .anyMatch(ph -> holidayDate.equals(ph.getHolidayDate()));
    }

    @Override
    protected PublicHoliday toEntity(PublicHolidayItem item) {
        PublicHoliday entity = new PublicHoliday();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setHolidayDate(item.getHolidayDate());
        entity.setIsRecurring(item.getIsRecurring());
        entity.setCountry(item.getCountry());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }

    @Override
    protected PublicHolidayItem toItem(PublicHoliday entity) {
        PublicHolidayItem item = new PublicHolidayItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("PUB_HOLIDAY#" + id);

        if (entity.getCountry() != null) {
            item.setGsi1pk("PH_COUNTRY#" + tenantId + "#" + entity.getCountry());
            item.setGsi1sk("PUB_HOLIDAY#" + id);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setHolidayDate(entity.getHolidayDate());
        item.setIsRecurring(entity.getIsRecurring());
        item.setCountry(entity.getCountry());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }
}
