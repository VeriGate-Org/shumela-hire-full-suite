package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.ExportFormat;
import com.arthmatic.shumelahire.entity.ExportStatus;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.ReportExportJob;
import com.arthmatic.shumelahire.repository.ReportExportJobDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ReportExportJobItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the ReportExportJob entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     REPORT_EXPORT_JOB#{id}
 *   GSI1PK: EXPORT_STATUS#{status}          GSI1SK: REPORT_EXPORT_JOB#{createdAt}
 *   GSI2PK: EXPORT_REQUESTER#{requestedById} GSI2SK: REPORT_EXPORT_JOB#{createdAt}
 *   GSI6PK: EXPORT_TYPE#{reportType}         GSI6SK: REPORT_EXPORT_JOB#{createdAt}
 * </pre>
 */
@Repository
public class DynamoReportExportJobRepository extends DynamoRepository<ReportExportJobItem, ReportExportJob>
        implements ReportExportJobDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoReportExportJobRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ReportExportJobItem.class);
    }

    @Override
    protected String entityType() {
        return "REPORT_EXPORT_JOB";
    }

    // ── ReportExportJobDataRepository implementation ─────────────────────────

    @Override
    public List<ReportExportJob> findByRequestedByIdOrderByCreatedAtDesc(String employeeId) {
        return queryGsiAll("GSI2", "EXPORT_REQUESTER#" + employeeId).stream()
                .sorted(Comparator.comparing(ReportExportJob::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportExportJob> findByStatus(ExportStatus status) {
        return queryGsiAll("GSI1", "EXPORT_STATUS#" + status.name());
    }

    @Override
    public List<ReportExportJob> findByReportTypeOrderByCreatedAtDesc(String reportType) {
        return queryGsiAll("GSI6", "EXPORT_TYPE#" + reportType).stream()
                .sorted(Comparator.comparing(ReportExportJob::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Conversion: ReportExportJobItem <-> ReportExportJob ──────────────────

    @Override
    protected ReportExportJob toEntity(ReportExportJobItem item) {
        var entity = new ReportExportJob();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setReportType(item.getReportType());
        if (item.getFormat() != null) {
            entity.setFormat(ExportFormat.valueOf(item.getFormat()));
        }
        if (item.getStatus() != null) {
            entity.setStatus(ExportStatus.valueOf(item.getStatus()));
        }
        entity.setFileUrl(item.getFileUrl());
        entity.setFileSize(item.getFileSize());
        entity.setParameters(item.getParameters());
        // requestedBy is a ManyToOne relationship — store only the FK in DynamoDB
        if (item.getRequestedById() != null) {
            var emp = new Employee();
            emp.setId(Long.parseLong(item.getRequestedById()));
            entity.setRequestedBy(emp);
        }
        entity.setErrorMessage(item.getErrorMessage());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getCompletedAt() != null) {
            entity.setCompletedAt(LocalDateTime.parse(item.getCompletedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected ReportExportJobItem toItem(ReportExportJob entity) {
        var item = new ReportExportJobItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("REPORT_EXPORT_JOB#" + id);

        // GSI1: Status index
        item.setGsi1pk("EXPORT_STATUS#" + (entity.getStatus() != null ? entity.getStatus().name() : "QUEUED"));
        item.setGsi1sk("REPORT_EXPORT_JOB#" + (entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : ""));

        // GSI2: Requester FK lookup
        String requestedById = entity.getRequestedBy() != null && entity.getRequestedBy().getId() != null
                ? entity.getRequestedBy().getId().toString() : "NONE";
        item.setGsi2pk("EXPORT_REQUESTER#" + requestedById);
        item.setGsi2sk("REPORT_EXPORT_JOB#" + (entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : ""));

        // GSI6: Report type date range
        item.setGsi6pk("EXPORT_TYPE#" + (entity.getReportType() != null ? entity.getReportType() : "UNKNOWN"));
        item.setGsi6sk("REPORT_EXPORT_JOB#" + (entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : ""));

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setReportType(entity.getReportType());
        if (entity.getFormat() != null) {
            item.setFormat(entity.getFormat().name());
        }
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        item.setFileUrl(entity.getFileUrl());
        item.setFileSize(entity.getFileSize());
        item.setParameters(entity.getParameters());
        if (entity.getRequestedBy() != null && entity.getRequestedBy().getId() != null) {
            item.setRequestedById(entity.getRequestedBy().getId().toString());
        }
        item.setErrorMessage(entity.getErrorMessage());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getCompletedAt() != null) {
            item.setCompletedAt(entity.getCompletedAt().format(ISO_FMT));
        }

        return item;
    }
}
