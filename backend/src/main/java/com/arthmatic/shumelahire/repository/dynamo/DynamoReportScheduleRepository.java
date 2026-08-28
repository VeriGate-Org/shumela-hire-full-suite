package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.ReportSchedule;
import com.arthmatic.shumelahire.repository.ReportScheduleDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ReportScheduleItem;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the ReportSchedule entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:  TENANT#{tenantId}
 *   SK:  REPORT_SCHEDULE#{id}
 * </pre>
 * Simple CRUD — no additional GSIs required.
 */
@Repository
public class DynamoReportScheduleRepository extends DynamoRepository<ReportScheduleItem, ReportSchedule>
        implements ReportScheduleDataRepository {

    public DynamoReportScheduleRepository(DynamoDbClient dynamoDbClient,
                                          DynamoDbEnhancedClient enhancedClient,
                                          String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ReportScheduleItem.class);
    }

    @Override
    protected String entityType() {
        return "REPORT_SCHEDULE";
    }

    // -- Queries --------------------------------------------------------------

    @Override
    public List<ReportSchedule> findAllOrderByNextRunAsc() {
        return findAll().stream()
                .sorted(Comparator.comparing(ReportSchedule::getNextRun,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportSchedule> findByReportId(String reportId) {
        return findAll().stream()
                .filter(s -> reportId != null && reportId.equals(s.getReportId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportSchedule> findDue(LocalDateTime asOf) {
        return findAll().stream()
                .filter(ReportSchedule::isEnabled)
                // A schedule with no nextRun has never been scheduled and is not due; treating a
                // null as "overdue" would fire every broken record on the first tick.
                .filter(s -> s.getNextRun() != null && !s.getNextRun().isAfter(asOf))
                .sorted(Comparator.comparing(ReportSchedule::getNextRun))
                .collect(Collectors.toList());
    }

    // -- Conversion: ReportScheduleItem <-> ReportSchedule ---------------------

    @Override
    protected ReportSchedule toEntity(ReportScheduleItem item) {
        var entity = new ReportSchedule();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setReportId(item.getReportId());
        entity.setReportName(item.getReportName());
        entity.setFrequency(parseEnum(item.getFrequency(), ReportSchedule.Frequency.class,
                ReportSchedule.Frequency.WEEKLY));
        entity.setRecipients(item.getRecipients() != null ? new ArrayList<>(item.getRecipients()) : new ArrayList<>());
        if (item.getEnabled() != null) entity.setEnabled(item.getEnabled());
        if (item.getNextRun() != null) entity.setNextRun(TimestampUtils.parseTimestamp(item.getNextRun()));
        if (item.getLastRun() != null) entity.setLastRun(TimestampUtils.parseTimestamp(item.getLastRun()));
        if (item.getRunCount() != null) entity.setRunCount(item.getRunCount());
        entity.setLastStatus(parseEnum(item.getLastStatus(), ReportSchedule.Status.class,
                ReportSchedule.Status.PENDING));
        entity.setErrorMessage(item.getErrorMessage());
        entity.setCreatedBy(item.getCreatedBy());
        if (item.getCreatedAt() != null) entity.setCreatedAt(TimestampUtils.parseTimestamp(item.getCreatedAt()));
        if (item.getUpdatedAt() != null) entity.setUpdatedAt(TimestampUtils.parseTimestamp(item.getUpdatedAt()));
        return entity;
    }

    @Override
    protected ReportScheduleItem toItem(ReportSchedule entity) {
        var item = new ReportScheduleItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        item.setPk("TENANT#" + tenantId);
        item.setSk("REPORT_SCHEDULE#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setReportId(entity.getReportId());
        item.setReportName(entity.getReportName());
        item.setFrequency(entity.getFrequency() != null ? entity.getFrequency().name() : null);
        // An empty list is stored as null: DynamoDB rejects empty string sets, and an absent
        // attribute round-trips back to an empty list through toEntity anyway.
        item.setRecipients(entity.getRecipients() == null || entity.getRecipients().isEmpty()
                ? null : new ArrayList<>(entity.getRecipients()));
        item.setEnabled(entity.isEnabled());
        item.setNextRun(entity.getNextRun() != null ? TimestampUtils.formatTimestamp(entity.getNextRun()) : null);
        item.setLastRun(entity.getLastRun() != null ? TimestampUtils.formatTimestamp(entity.getLastRun()) : null);
        item.setRunCount(entity.getRunCount());
        item.setLastStatus(entity.getLastStatus() != null ? entity.getLastStatus().name() : null);
        item.setErrorMessage(entity.getErrorMessage());
        item.setCreatedBy(entity.getCreatedBy());
        item.setCreatedAt(entity.getCreatedAt() != null ? TimestampUtils.formatTimestamp(entity.getCreatedAt()) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? TimestampUtils.formatTimestamp(entity.getUpdatedAt()) : null);
        return item;
    }

    /** Unknown stored values fall back rather than throwing — one bad row should not fail a list. */
    private static <E extends Enum<E>> E parseEnum(String raw, Class<E> type, E fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }
}
