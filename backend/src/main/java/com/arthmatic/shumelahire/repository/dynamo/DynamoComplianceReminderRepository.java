package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.compliance.ComplianceReminder;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.compliance.ReminderStatus;
import com.arthmatic.shumelahire.entity.compliance.ReminderType;
import com.arthmatic.shumelahire.repository.ComplianceReminderDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ComplianceReminderItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoComplianceReminderRepository extends DynamoRepository<ComplianceReminderItem, ComplianceReminder>
        implements ComplianceReminderDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoComplianceReminderRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ComplianceReminderItem.class);
    }

    @Override
    protected String entityType() {
        return "COMP_REMINDER";
    }

    @Override
    public List<ComplianceReminder> findByStatus(ReminderStatus status) {
        return findAll().stream()
                .filter(r -> r.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplianceReminder> findByEmployeeId(String employeeId) {
        String gsi1Pk = "COMP_REM_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk);
    }

    @Override
    public List<ComplianceReminder> findByReminderType(ReminderType reminderType) {
        return findAll().stream()
                .filter(r -> r.getReminderType() == reminderType)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplianceReminder> findDueReminders(LocalDate dueDate) {
        return findAll().stream()
                .filter(r -> r.getStatus() == ReminderStatus.PENDING)
                .filter(r -> !r.getDueDate().isAfter(dueDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplianceReminder> findOverdueReminders(LocalDate asOfDate) {
        return findAll().stream()
                .filter(r -> r.getStatus() == ReminderStatus.PENDING || r.getStatus() == ReminderStatus.SENT)
                .filter(r -> r.getDueDate().isBefore(asOfDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplianceReminder> findUpcomingReminders(LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(r -> r.getStatus() == ReminderStatus.PENDING)
                .filter(r -> !r.getDueDate().isBefore(startDate) && !r.getDueDate().isAfter(endDate))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(ReminderStatus status) {
        return findAll().stream()
                .filter(r -> r.getStatus() == status)
                .count();
    }

    @Override
    protected ComplianceReminder toEntity(ComplianceReminderItem item) {
        if (item == null) {
            return null;
        }

        ComplianceReminder entity = new ComplianceReminder();
        entity.setId(item.getId());
        entity.setTenantId(item.getTenantId());
        entity.setReminderType(ReminderType.valueOf(item.getReminderType()));
        entity.setEntityType(item.getEntityType());
        entity.setEntityId(item.getEntityId());

        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        entity.setTitle(item.getTitle());
        entity.setDescription(item.getDescription());
        entity.setDueDate(item.getDueDate() != null && !item.getDueDate().isEmpty() ? LocalDate.parse(item.getDueDate(), DATE_FMT) : null);
        entity.setStatus(ReminderStatus.valueOf(item.getStatus()));
        entity.setSentAt(item.getSentAt() != null && !item.getSentAt().isEmpty() ? LocalDateTime.parse(item.getSentAt(), ISO_FMT) : null);
        entity.setAcknowledgedAt(item.getAcknowledgedAt() != null && !item.getAcknowledgedAt().isEmpty() ? LocalDateTime.parse(item.getAcknowledgedAt(), ISO_FMT) : null);
        entity.setCreatedAt(item.getCreatedAt() != null && !item.getCreatedAt().isEmpty() ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null && !item.getUpdatedAt().isEmpty() ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected ComplianceReminderItem toItem(ComplianceReminder entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        ComplianceReminderItem item = new ComplianceReminderItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);

        String empId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : "";
        item.setGsi1pk("COMP_REM_EMP#" + tenantId + "#" + empId);
        String dueDateStr = entity.getDueDate() != null ? entity.getDueDate().format(DATE_FMT) : "";
        item.setGsi1sk(dueDateStr + "#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setReminderType(entity.getReminderType() != null ? entity.getReminderType().name() : null);
        item.setEntityType(entity.getEntityType());
        item.setEntityId(entity.getEntityId() != null ? entity.getEntityId() : null);
        item.setEmployeeId(entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : null);
        item.setTitle(entity.getTitle());
        item.setDescription(entity.getDescription());
        item.setDueDate(entity.getDueDate() != null ? entity.getDueDate().format(DATE_FMT) : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setSentAt(entity.getSentAt() != null ? entity.getSentAt().format(ISO_FMT) : null);
        item.setAcknowledgedAt(entity.getAcknowledgedAt() != null ? entity.getAcknowledgedAt().format(ISO_FMT) : null);
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : null);

        return item;
    }
}
