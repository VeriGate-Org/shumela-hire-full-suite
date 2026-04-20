package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.RequisitionItem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Requisition entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     REQUISITION#{id}
 *   GSI1PK: REQ_STATUS#{tenantId}#{status}    GSI1SK: REQUISITION#{createdAt}
 *   GSI2PK: REQ_CREATOR#{tenantId}#{createdBy} GSI2SK: REQUISITION#{id}
 *   GSI6PK: REQ_DATE#{tenantId}               GSI6SK: REQUISITION#{createdAt}
 * </pre>
 */
@Repository
public class DynamoRequisitionRepository extends DynamoRepository<RequisitionItem, Requisition>
        implements RequisitionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoRequisitionRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, RequisitionItem.class);
    }

    @Override
    protected String entityType() {
        return "REQUISITION";
    }

    // ── RequisitionDataRepository implementation ─────────────────────────────

    @Override
    public List<Requisition> findByStatusOrderByCreatedAtDesc(RequisitionStatus status) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "REQ_STATUS#" + tenantId + "#" + status.name()).stream()
                .sorted(Comparator.comparing(Requisition::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Requisition> findByCreatedBy(String createdBy) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "REQ_CREATOR#" + tenantId + "#" + createdBy);
    }

    @Override
    public long countByStatus(RequisitionStatus status) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "REQ_STATUS#" + tenantId + "#" + status.name()).size();
    }

    // ── Page-based queries (JPA compatibility) ───────────────────────────────

    @Override
    public Page<Requisition> findAll(Pageable pageable) {
        List<Requisition> all = findAll();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<Requisition> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    @Override
    public Page<Requisition> findByStatus(RequisitionStatus status, Pageable pageable) {
        List<Requisition> filtered = findByStatusOrderByCreatedAtDesc(status);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Requisition> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    // ── Conversion: RequisitionItem <-> Requisition ──────────────────────────

    @Override
    protected Requisition toEntity(RequisitionItem item) {
        var entity = new Requisition();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setJobTitle(item.getJobTitle());
        entity.setDepartment(item.getDepartment());
        entity.setLocation(item.getLocation());
        if (item.getEmploymentType() != null) {
            entity.setEmploymentType(EmploymentType.valueOf(item.getEmploymentType()));
        }
        if (item.getSalaryMin() != null) {
            entity.setSalaryMin(new BigDecimal(item.getSalaryMin()));
        }
        if (item.getSalaryMax() != null) {
            entity.setSalaryMax(new BigDecimal(item.getSalaryMax()));
        }
        entity.setDescription(item.getDescription());
        entity.setJustification(item.getJustification());
        if (item.getStatus() != null) {
            entity.setStatus(RequisitionStatus.valueOf(item.getStatus()));
        }
        if (item.getCreatedBy() != null) {
            entity.setCreatedBy(safeParseLong(item.getCreatedBy()));
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected RequisitionItem toItem(Requisition entity) {
        var item = new RequisitionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("REQUISITION#" + id);

        // GSI1: Status index, sorted by createdAt
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "DRAFT";
        item.setGsi1pk("REQ_STATUS#" + tenantId + "#" + statusStr);
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        item.setGsi1sk("REQUISITION#" + createdAtStr);

        // GSI2: FK lookup — created by
        String createdByStr = entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : "UNKNOWN";
        item.setGsi2pk("REQ_CREATOR#" + tenantId + "#" + createdByStr);
        item.setGsi2sk("REQUISITION#" + id);

        // GSI6: Date range — creation date
        item.setGsi6pk("REQ_DATE#" + tenantId);
        item.setGsi6sk("REQUISITION#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setJobTitle(entity.getJobTitle());
        item.setDepartment(entity.getDepartment());
        item.setLocation(entity.getLocation());
        if (entity.getEmploymentType() != null) {
            item.setEmploymentType(entity.getEmploymentType().name());
        }
        if (entity.getSalaryMin() != null) {
            item.setSalaryMin(entity.getSalaryMin().toPlainString());
        }
        if (entity.getSalaryMax() != null) {
            item.setSalaryMax(entity.getSalaryMax().toPlainString());
        }
        item.setDescription(entity.getDescription());
        item.setJustification(entity.getJustification());
        item.setStatus(statusStr);
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy().toString());
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
