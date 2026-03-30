package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.labour.Grievance;
import com.arthmatic.shumelahire.entity.labour.GrievanceStatus;
import com.arthmatic.shumelahire.entity.labour.GrievanceType;
import com.arthmatic.shumelahire.repository.GrievanceDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.GrievanceItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoGrievanceRepository extends DynamoRepository<GrievanceItem, Grievance>
        implements GrievanceDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter ISO_DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoGrievanceRepository(DynamoDbClient dynamoDbClient,
                                     DynamoDbEnhancedClient enhancedClient,
                                     String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, GrievanceItem.class);
    }

    @Override protected String entityType() { return "GRIEVANCE"; }

    @Override
    public List<Grievance> findByEmployeeId(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "GRIEV_EMP#" + tenantId + "#" + employeeId);
    }

    @Override
    public List<Grievance> findByStatus(GrievanceStatus status) {
        return findAll().stream()
                .filter(e -> status.equals(e.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Grievance> findByAssignedToId(String assignedToId) {
        return findAll().stream()
                .filter(e -> e.getAssignedTo() != null
                        && e.getAssignedTo().getId() != null
                        && e.getAssignedTo().getId().toString().equals(assignedToId))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(GrievanceStatus status) {
        return findAll().stream()
                .filter(e -> status.equals(e.getStatus()))
                .count();
    }

    @Override
    protected Grievance toEntity(GrievanceItem item) {
        var e = new Grievance();
        if (item.getId() != null) try { e.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ex) {}
        e.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            var emp = new Employee();
            try { emp.setId(Long.parseLong(item.getEmployeeId())); } catch (NumberFormatException ex) {}
            e.setEmployee(emp);
        }

        if (item.getGrievanceType() != null) e.setGrievanceType(GrievanceType.valueOf(item.getGrievanceType()));
        e.setDescription(item.getDescription());
        if (item.getStatus() != null) e.setStatus(GrievanceStatus.valueOf(item.getStatus()));
        if (item.getFiledDate() != null) e.setFiledDate(LocalDate.parse(item.getFiledDate(), ISO_DATE_FMT));

        if (item.getAssignedToId() != null) {
            var assignedTo = new Employee();
            try { assignedTo.setId(Long.parseLong(item.getAssignedToId())); } catch (NumberFormatException ex) {}
            e.setAssignedTo(assignedTo);
        }

        e.setResolution(item.getResolution());
        if (item.getResolvedDate() != null) e.setResolvedDate(LocalDate.parse(item.getResolvedDate(), ISO_DATE_FMT));
        if (item.getCreatedAt() != null) e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) e.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        return e;
    }

    @Override
    protected GrievanceItem toItem(Grievance entity) {
        var item = new GrievanceItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId().toString() : "";
        String assignedToId = entity.getAssignedTo() != null && entity.getAssignedTo().getId() != null
                ? entity.getAssignedTo().getId().toString() : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("GRIEVANCE#" + id);
        item.setGsi1pk("GRIEV_EMP#" + tenantId + "#" + employeeId);
        item.setGsi1sk("GRIEVANCE#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        if (entity.getGrievanceType() != null) item.setGrievanceType(entity.getGrievanceType().name());
        item.setDescription(entity.getDescription());
        if (entity.getStatus() != null) item.setStatus(entity.getStatus().name());
        if (entity.getFiledDate() != null) item.setFiledDate(entity.getFiledDate().format(ISO_DATE_FMT));
        item.setAssignedToId(assignedToId);
        item.setResolution(entity.getResolution());
        if (entity.getResolvedDate() != null) item.setResolvedDate(entity.getResolvedDate().format(ISO_DATE_FMT));
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        return item;
    }
}
