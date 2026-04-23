package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.OvertimeRecord;
import com.arthmatic.shumelahire.entity.attendance.OvertimeStatus;
import com.arthmatic.shumelahire.repository.OvertimeRecordDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.OvertimeRecordItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoOvertimeRecordRepository extends DynamoRepository<OvertimeRecordItem, OvertimeRecord>
        implements OvertimeRecordDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoOvertimeRecordRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, OvertimeRecordItem.class);
    }

    @Override
    protected String entityType() {
        return "OVERTIME";
    }

    @Override
    public List<OvertimeRecord> findByEmployeeId(String employeeId) {
        String gsi1Pk = "OT_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk);
    }

    @Override
    public List<OvertimeRecord> findByStatus(OvertimeStatus status) {
        return findAll().stream()
                .filter(r -> r.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    protected OvertimeRecord toEntity(OvertimeRecordItem item) {
        if (item == null) {
            return null;
        }

        OvertimeRecord entity = new OvertimeRecord();
        entity.setId(item.getId());
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        entity.setDate(item.getDate() != null ? LocalDate.parse(item.getDate(), DATE_FMT) : null);
        entity.setHours(item.getHours() != null ? new BigDecimal(item.getHours()) : null);
        entity.setReason(item.getReason());
        entity.setStatus(item.getStatus() != null ? OvertimeStatus.valueOf(item.getStatus()) : null);

        if (item.getApprovedById() != null) {
            var approvedBy = new Employee();
            approvedBy.setId(item.getApprovedById());
            entity.setApprovedBy(approvedBy);
        }

        entity.setApprovedAt(item.getApprovedAt() != null ? LocalDateTime.parse(item.getApprovedAt(), ISO_FMT) : null);
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected OvertimeRecordItem toItem(OvertimeRecord entity) {
        if (entity == null) {
            return null;
        }

        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime now = LocalDateTime.now();

        // Set generated values back on the entity so callers can use them after save
        entity.setId(id);
        entity.setTenantId(tenantId);
        if (entity.getCreatedAt() == null) { entity.setCreatedAt(now); }
        entity.setUpdatedAt(now);

        OvertimeRecordItem item = new OvertimeRecordItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);
        item.setId(id);
        item.setTenantId(tenantId);

        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : null;
        item.setEmployeeId(employeeId);
        item.setDate(entity.getDate() != null ? entity.getDate().format(DATE_FMT) : null);
        item.setHours(entity.getHours() != null ? entity.getHours().toPlainString() : null);
        item.setReason(entity.getReason());
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setApprovedById(entity.getApprovedBy() != null && entity.getApprovedBy().getId() != null
                ? entity.getApprovedBy().getId() : null);
        item.setApprovedAt(entity.getApprovedAt() != null ? entity.getApprovedAt().format(ISO_FMT) : null);
        item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));

        // GSI1 for employee queries
        if (employeeId != null) {
            item.setGsi1pk("OT_EMP#" + tenantId + "#" + employeeId);
            item.setGsi1sk(entityType() + "#" + item.getDate() + "#" + id);
        }

        return item;
    }
}
