package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.entity.EmploymentEventType;
import com.arthmatic.shumelahire.repository.EmploymentEventDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmploymentEventItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the EmploymentEvent entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     EMPEVENT#{id}
 *   GSI1PK: EMPEVENT_TYPE#{tenantId}#{eventType}  GSI1SK: EMPEVENT#{eventDate}#{id}
 *   GSI2PK: EMPEVENT_EMP#{tenantId}#{employeeId}  GSI2SK: EMPEVENT#{eventDate}#{id}
 *   GSI6PK: EMPEVENT_DATE#{tenantId}              GSI6SK: #{effectiveDate}#{id}
 * </pre>
 */
@Repository
public class DynamoEmploymentEventRepository extends DynamoRepository<EmploymentEventItem, EmploymentEvent>
        implements EmploymentEventDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoEmploymentEventRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, EmploymentEventItem.class);
    }

    @Override
    protected String entityType() {
        return "EMPEVENT";
    }

    // ── EmploymentEventDataRepository implementation ─────────────────────────

    @Override
    public List<EmploymentEvent> findByEmployeeOrderByEventDateDesc(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "EMPEVENT_EMP#" + tenantId + "#" + employeeId).stream()
                .sorted(Comparator.comparing(EmploymentEvent::getEventDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<EmploymentEvent> findByEmployee(String employeeId, String cursor, int pageSize) {
        String tenantId = currentTenantId();
        return queryGsi("GSI2", "EMPEVENT_EMP#" + tenantId + "#" + employeeId,
                "EMPEVENT#", cursor, pageSize);
    }

    @Override
    public List<EmploymentEvent> findByEmployeeAndEventType(String employeeId, EmploymentEventType eventType) {
        return findByEmployeeOrderByEventDateDesc(employeeId).stream()
                .filter(e -> eventType.equals(e.getEventType()))
                .collect(Collectors.toList());
    }

    // ── Conversion: EmploymentEventItem <-> EmploymentEvent ──────────────────

    @Override
    protected EmploymentEvent toEntity(EmploymentEventItem item) {
        var evt = new EmploymentEvent();
        if (item.getId() != null) {
            evt.setId(item.getId());
        }
        evt.setTenantId(item.getTenantId());
        // Employee is a relationship — store only the ID
        if (item.getEmployeeId() != null) {
            var emp = new Employee();
            emp.setId(item.getEmployeeId());
            evt.setEmployee(emp);
        }
        if (item.getEventType() != null) {
            evt.setEventType(EmploymentEventType.valueOf(item.getEventType()));
        }
        if (item.getEventDate() != null) {
            evt.setEventDate(LocalDate.parse(item.getEventDate(), DATE_FMT));
        }
        if (item.getEffectiveDate() != null) {
            evt.setEffectiveDate(LocalDate.parse(item.getEffectiveDate(), DATE_FMT));
        }
        evt.setDescription(item.getDescription());
        evt.setNotes(item.getNotes());
        evt.setPreviousDepartment(item.getPreviousDepartment());
        evt.setNewDepartment(item.getNewDepartment());
        evt.setPreviousJobTitle(item.getPreviousJobTitle());
        evt.setNewJobTitle(item.getNewJobTitle());
        evt.setPreviousJobGrade(item.getPreviousJobGrade());
        evt.setNewJobGrade(item.getNewJobGrade());
        if (item.getPreviousReportingManagerId() != null) {
            evt.setPreviousReportingManagerId(item.getPreviousReportingManagerId());
        }
        if (item.getNewReportingManagerId() != null) {
            evt.setNewReportingManagerId(item.getNewReportingManagerId());
        }
        evt.setPreviousLocation(item.getPreviousLocation());
        evt.setNewLocation(item.getNewLocation());
        evt.setRecordedBy(item.getRecordedBy());
        if (item.getCreatedAt() != null) {
            evt.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        return evt;
    }

    @Override
    protected EmploymentEventItem toItem(EmploymentEvent entity) {
        var item = new EmploymentEventItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : null;

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("EMPEVENT#" + id);

        // GSI1: Event type index
        item.setGsi1pk("EMPEVENT_TYPE#" + tenantId + "#" + (entity.getEventType() != null ? entity.getEventType().name() : ""));
        String eventDateStr = entity.getEventDate() != null ? entity.getEventDate().format(DATE_FMT) : "";
        item.setGsi1sk("EMPEVENT#" + eventDateStr + "#" + id);

        // GSI2: Events by employee
        item.setGsi2pk("EMPEVENT_EMP#" + tenantId + "#" + (employeeId != null ? employeeId : "NONE"));
        item.setGsi2sk("EMPEVENT#" + eventDateStr + "#" + id);

        // GSI6: Effective date range
        item.setGsi6pk("EMPEVENT_DATE#" + tenantId);
        String effectiveDateStr = entity.getEffectiveDate() != null ? entity.getEffectiveDate().format(DATE_FMT) : "";
        item.setGsi6sk(effectiveDateStr + "#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        if (entity.getEventType() != null) {
            item.setEventType(entity.getEventType().name());
        }
        if (entity.getEventDate() != null) {
            item.setEventDate(entity.getEventDate().format(DATE_FMT));
        }
        if (entity.getEffectiveDate() != null) {
            item.setEffectiveDate(entity.getEffectiveDate().format(DATE_FMT));
        }
        item.setDescription(entity.getDescription());
        item.setNotes(entity.getNotes());
        item.setPreviousDepartment(entity.getPreviousDepartment());
        item.setNewDepartment(entity.getNewDepartment());
        item.setPreviousJobTitle(entity.getPreviousJobTitle());
        item.setNewJobTitle(entity.getNewJobTitle());
        item.setPreviousJobGrade(entity.getPreviousJobGrade());
        item.setNewJobGrade(entity.getNewJobGrade());
        if (entity.getPreviousReportingManagerId() != null) {
            item.setPreviousReportingManagerId(entity.getPreviousReportingManagerId());
        }
        if (entity.getNewReportingManagerId() != null) {
            item.setNewReportingManagerId(entity.getNewReportingManagerId());
        }
        item.setPreviousLocation(entity.getPreviousLocation());
        item.setNewLocation(entity.getNewLocation());
        item.setRecordedBy(entity.getRecordedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }

        return item;
    }
}
