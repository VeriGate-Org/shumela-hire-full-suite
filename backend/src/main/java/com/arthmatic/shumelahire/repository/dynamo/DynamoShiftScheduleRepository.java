package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.Shift;
import com.arthmatic.shumelahire.entity.attendance.ShiftSchedule;
import com.arthmatic.shumelahire.entity.attendance.ShiftScheduleStatus;
import com.arthmatic.shumelahire.repository.ShiftScheduleDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ShiftScheduleItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoShiftScheduleRepository extends DynamoRepository<ShiftScheduleItem, ShiftSchedule>
        implements ShiftScheduleDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoShiftScheduleRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ShiftScheduleItem.class);
    }

    @Override
    protected String entityType() {
        return "SHIFT_SCHED";
    }

    protected String buildSortKey(ShiftScheduleItem item) {
        return entityType() + "#" + item.getId();
    }

    protected String buildGsi1Pk(ShiftScheduleItem item) {
        return "SS_EMP#" + item.getTenantId() + "#" + item.getEmployeeId();
    }

    protected String buildGsi1Sk(ShiftScheduleItem item) {
        return item.getScheduleDate() + "#" + item.getId();
    }

    @Override
    public List<ShiftSchedule> findByEmployeeIdAndScheduleDateBetween(
            String employeeId, LocalDate startDate, LocalDate endDate) {
        String gsi1Pk = "SS_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk).stream()
                .filter(s -> !s.getScheduleDate().isBefore(startDate) && !s.getScheduleDate().isAfter(endDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftSchedule> findByDateRange(LocalDate start, LocalDate end) {
        return findAll().stream()
                .filter(s -> !s.getScheduleDate().isBefore(start) && !s.getScheduleDate().isAfter(end))
                .sorted(Comparator.comparing(ShiftSchedule::getScheduleDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftSchedule> findByDepartmentAndDateRange(
            String department, LocalDate start, LocalDate end) {
        return findAll().stream()
                .filter(s -> s.getEmployee() != null && s.getEmployee().getDepartment() != null
                        && department.equals(s.getEmployee().getDepartment()))
                .filter(s -> !s.getScheduleDate().isBefore(start) && !s.getScheduleDate().isAfter(end))
                .sorted(Comparator.comparing(ShiftSchedule::getScheduleDate))
                .collect(Collectors.toList());
    }

    @Override
    protected ShiftSchedule toEntity(ShiftScheduleItem item) {
        if (item == null) {
            return null;
        }

        ShiftSchedule entity = new ShiftSchedule();
        entity.setId(safeParseLong(item.getId()));
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            employee.setId(safeParseLong(item.getEmployeeId()));
            entity.setEmployee(employee);
        }

        if (item.getShiftId() != null) {
            var shift = new Shift();
            shift.setId(safeParseLong(item.getShiftId()));
            entity.setShift(shift);
        }

        entity.setScheduleDate(item.getScheduleDate() != null ? LocalDate.parse(item.getScheduleDate(), DATE_FMT) : null);
        entity.setStatus(item.getStatus() != null ? ShiftScheduleStatus.valueOf(item.getStatus()) : null);
        entity.setNotes(item.getNotes());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected ShiftScheduleItem toItem(ShiftSchedule entity) {
        if (entity == null) {
            return null;
        }

        ShiftScheduleItem item = new ShiftScheduleItem();
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());
        item.setEmployeeId(entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId().toString() : null);
        item.setShiftId(entity.getShift() != null && entity.getShift().getId() != null
                ? entity.getShift().getId().toString() : null);
        item.setScheduleDate(entity.getScheduleDate() != null ? entity.getScheduleDate().format(DATE_FMT) : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setNotes(entity.getNotes());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : null);

        return item;
    }
}
