package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.ReportTemplate;
import com.arthmatic.shumelahire.repository.ReportTemplateDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ReportTemplateItem;

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
 * DynamoDB repository for the ReportTemplate entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:  TENANT#{tenantId}
 *   SK:  REPORT_TEMPLATE#{id}
 * </pre>
 * Simple CRUD — no additional GSIs required.
 */
@Repository
public class DynamoReportTemplateRepository extends DynamoRepository<ReportTemplateItem, ReportTemplate>
        implements ReportTemplateDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoReportTemplateRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ReportTemplateItem.class);
    }

    @Override
    protected String entityType() {
        return "REPORT_TEMPLATE";
    }

    // -- Queries --------------------------------------------------------------

    @Override
    public List<ReportTemplate> findBySharedTrueOrCreatedByOrderByUpdatedAtDesc(String createdBy) {
        return findAll().stream()
                .filter(t -> t.isShared() || createdBy.equals(t.getCreatedBy()))
                .sorted(Comparator.comparing(ReportTemplate::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportTemplate> findBySystemTrueOrderByNameAsc() {
        return findAll().stream()
                .filter(ReportTemplate::isSystem)
                .sorted(Comparator.comparing(ReportTemplate::getName))
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByNameAndCreatedBy(String name, String createdBy) {
        return findAll().stream()
                .anyMatch(t -> name.equals(t.getName()) && createdBy.equals(t.getCreatedBy()));
    }

    // -- Conversion: ReportTemplateItem <-> ReportTemplate --------------------

    @Override
    protected ReportTemplate toEntity(ReportTemplateItem item) {
        var entity = new ReportTemplate();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setCreatedBy(item.getCreatedBy());
        if (item.getShared() != null) entity.setShared(item.getShared());
        if (item.getSystem() != null) entity.setSystem(item.getSystem());
        if (item.getRunCount() != null) entity.setRunCount(item.getRunCount());
        if (item.getLastRun() != null) entity.setLastRun(LocalDateTime.parse(item.getLastRun(), ISO_FMT));
        entity.setFieldsJson(item.getFieldsJson());
        entity.setFiltersJson(item.getFiltersJson());
        entity.setVisualizationJson(item.getVisualizationJson());
        entity.setScheduleJson(item.getScheduleJson());
        entity.setDateRangeJson(item.getDateRangeJson());
        entity.setTagsJson(item.getTagsJson());
        if (item.getCreatedAt() != null) entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        return entity;
    }

    @Override
    protected ReportTemplateItem toItem(ReportTemplate entity) {
        var item = new ReportTemplateItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("REPORT_TEMPLATE#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setCreatedBy(entity.getCreatedBy());
        item.setShared(entity.isShared());
        item.setSystem(entity.isSystem());
        item.setRunCount(entity.getRunCount());
        if (entity.getLastRun() != null) item.setLastRun(entity.getLastRun().format(ISO_FMT));
        item.setFieldsJson(entity.getFieldsJson());
        item.setFiltersJson(entity.getFiltersJson());
        item.setVisualizationJson(entity.getVisualizationJson());
        item.setScheduleJson(entity.getScheduleJson());
        item.setDateRangeJson(entity.getDateRangeJson());
        item.setTagsJson(entity.getTagsJson());
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));

        return item;
    }
}
