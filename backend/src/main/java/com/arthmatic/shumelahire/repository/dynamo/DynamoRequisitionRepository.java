package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.entity.RequisitionApproval;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.RequisitionItem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    private static final Logger logger = LoggerFactory.getLogger(DynamoRequisitionRepository.class);

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public DynamoRequisitionRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, RequisitionItem.class);
    }

    @Override
    protected String entityType() {
        return "REQUISITION";
    }

    /**
     * toItem() generates a fresh id for a brand-new requisition but only sets it on the item
     * that gets persisted, never back on the entity — so POST /api/requisitions returned
     * id: null even though the item was persisted correctly under a real generated id. The
     * frontend then submits for approval against /api/requisitions/null/submit. Same root
     * cause as #142/#173/#175 (DynamoApplicationRepository / DynamoAgencyProfileRepository);
     * this is the same fix applied here.
     */
    @Override
    protected Requisition afterSave(RequisitionItem item, Requisition entity) {
        if (entity.getId() == null) {
            entity.setId(item.getId());
        }
        return entity;
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
        return page(findAll(), pageable);
    }

    @Override
    public Page<Requisition> findByStatus(RequisitionStatus status, Pageable pageable) {
        return page(findByStatusOrderByCreatedAtDesc(status), pageable);
    }

    /**
     * Sort, then slice.
     *
     * <p>These methods previously ignored {@code pageable.getSort()} outright — one returned
     * whatever order the scan produced and the other was hardcoded to createdAt descending — so the
     * {@code sort} parameter callers have always sent has never had any effect on this backend. A
     * queue ordered by longest wait needs {@code updatedAt} ascending, and that is not expressible
     * without honouring the sort.
     *
     * <p>Sorting before slicing is the point: sorting a page would only reorder the twenty rows
     * that already happened to be selected, which is the class of half-answer this work keeps
     * removing.
     */
    private Page<Requisition> page(List<Requisition> records, Pageable pageable) {
        List<Requisition> ordered = sorted(records, pageable.getSort());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), ordered.size());
        List<Requisition> pageContent = start < ordered.size() ? ordered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, ordered.size());
    }

    /**
     * Apply a Spring {@link Sort} to requisitions in memory.
     *
     * <p>Package-private and static so it can be tested directly: constructing the repository needs
     * a live DynamoDB client, and ordering rules are worth pinning without one.
     *
     * <p>Only the two timestamp properties are supported, because they are the only ones a queue
     * orders by and inventing more would imply capability that has not been tested. <b>An
     * unrecognised property is ignored rather than guessed at</b>, leaving the incoming order — a
     * silent mis-sort is harder to notice than an unchanged one.
     */
    static List<Requisition> sorted(List<Requisition> records, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            return records;
        }

        Comparator<Requisition> comparator = null;
        for (Sort.Order order : sort) {
            Comparator<Requisition> next = switch (order.getProperty()) {
                case "createdAt" -> Comparator.comparing(
                        Requisition::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
                case "updatedAt" -> Comparator.comparing(
                        Requisition::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
                default -> null;
            };
            if (next == null) {
                logger.warn("Ignoring unsupported requisition sort property '{}'", order.getProperty());
                continue;
            }
            if (order.isDescending()) {
                // reversed() would move nulls to the front; keep records with no timestamp last
                // either way, since an unknown date should not lead a queue.
                next = next.reversed();
                next = Comparator.comparing(
                        (Requisition r) -> order.getProperty().equals("updatedAt")
                                ? r.getUpdatedAt() == null
                                : r.getCreatedAt() == null)
                        .thenComparing(next);
            }
            comparator = comparator == null ? next : comparator.thenComparing(next);
        }

        if (comparator == null) {
            return records;
        }
        return records.stream().sorted(comparator).collect(Collectors.toList());
    }

    // ── Conversion: RequisitionItem <-> Requisition ──────────────────────────

    @Override
    protected Requisition toEntity(RequisitionItem item) {
        var entity = new Requisition();
        if (item.getId() != null) {
            entity.setId(item.getId());
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
            entity.setCreatedBy(item.getCreatedBy());
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(TimestampUtils.parseTimestamp(item.getCreatedAt()));
        }
        if (item.getApprovalHistoryJson() != null) {
            try {
                entity.setApprovalHistory(MAPPER.readValue(item.getApprovalHistoryJson(),
                        new TypeReference<List<RequisitionApproval>>() {}));
            } catch (JsonProcessingException e) {
                // A malformed history must not make the requisition unreadable.
                entity.setApprovalHistory(new java.util.ArrayList<>());
            }
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(TimestampUtils.parseTimestamp(item.getUpdatedAt()));
        }
        return entity;
    }

    @Override
    protected RequisitionItem toItem(Requisition entity) {
        var item = new RequisitionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("REQUISITION#" + id);

        // GSI1: Status index, sorted by createdAt
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "DRAFT";
        item.setGsi1pk("REQ_STATUS#" + tenantId + "#" + statusStr);
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        item.setGsi1sk("REQUISITION#" + createdAtStr);

        // GSI2: FK lookup — created by
        String createdByStr = entity.getCreatedBy() != null ? entity.getCreatedBy() : "UNKNOWN";
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
            item.setCreatedBy(entity.getCreatedBy());
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getApprovalHistory() != null && !entity.getApprovalHistory().isEmpty()) {
            try {
                item.setApprovalHistoryJson(MAPPER.writeValueAsString(entity.getApprovalHistory()));
            } catch (JsonProcessingException e) {
                item.setApprovalHistoryJson(null);
            }
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
