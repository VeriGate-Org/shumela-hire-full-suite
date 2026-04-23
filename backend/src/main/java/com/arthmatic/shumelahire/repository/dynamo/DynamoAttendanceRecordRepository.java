package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.attendance.AttendanceRecord;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.AttendanceStatus;
import com.arthmatic.shumelahire.entity.attendance.ClockMethod;
import com.arthmatic.shumelahire.repository.AttendanceRecordDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.AttendanceRecordItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoAttendanceRecordRepository extends DynamoRepository<AttendanceRecordItem, AttendanceRecord>
        implements AttendanceRecordDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoAttendanceRecordRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, AttendanceRecordItem.class);
    }

    @Override
    protected String entityType() {
        return "ATTENDANCE";
    }

    @Override
    public List<AttendanceRecord> findByEmployeeId(String employeeId) {
        String gsi1Pk = "ATT_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk);
    }

    @Override
    public Optional<AttendanceRecord> findOpenSession(String employeeId) {
        String gsi1Pk = "ATT_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk).stream()
                .filter(r -> r.getClockOut() == null)
                .max(Comparator.comparing(AttendanceRecord::getClockIn));
    }

    @Override
    public List<AttendanceRecord> findByDateRange(LocalDateTime start, LocalDateTime end) {
        return findAll().stream()
                .filter(r -> !r.getClockIn().isBefore(start) && !r.getClockIn().isAfter(end))
                .sorted(Comparator.comparing(AttendanceRecord::getClockIn).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<AttendanceRecord> findByDepartmentAndDateRange(
            String department, LocalDateTime start, LocalDateTime end) {
        return findAll().stream()
                .filter(r -> r.getEmployee() != null && r.getEmployee().getDepartment() != null
                        && department.equals(r.getEmployee().getDepartment()))
                .filter(r -> !r.getClockIn().isBefore(start) && !r.getClockIn().isAfter(end))
                .sorted(Comparator.comparing(AttendanceRecord::getClockIn).reversed())
                .collect(Collectors.toList());
    }

    @Override
    protected AttendanceRecord toEntity(AttendanceRecordItem item) {
        if (item == null) {
            return null;
        }

        AttendanceRecord entity = new AttendanceRecord();
        if (item.getId() != null) { entity.setId(item.getId()); }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        entity.setClockIn(item.getClockIn() != null ? LocalDateTime.parse(item.getClockIn(), ISO_FMT) : null);
        entity.setClockOut(item.getClockOut() != null ? LocalDateTime.parse(item.getClockOut(), ISO_FMT) : null);
        entity.setClockMethod(item.getClockMethod() != null ? ClockMethod.valueOf(item.getClockMethod()) : null);
        entity.setClockInLatitude(item.getClockInLatitude() != null ? Double.parseDouble(item.getClockInLatitude()) : null);
        entity.setClockInLongitude(item.getClockInLongitude() != null ? Double.parseDouble(item.getClockInLongitude()) : null);
        entity.setClockOutLatitude(item.getClockOutLatitude() != null ? Double.parseDouble(item.getClockOutLatitude()) : null);
        entity.setClockOutLongitude(item.getClockOutLongitude() != null ? Double.parseDouble(item.getClockOutLongitude()) : null);
        entity.setStatus(item.getStatus() != null ? AttendanceStatus.valueOf(item.getStatus()) : null);
        entity.setTotalHours(item.getTotalHours() != null ? new BigDecimal(item.getTotalHours()) : null);
        entity.setNotes(item.getNotes());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected AttendanceRecordItem toItem(AttendanceRecord entity) {
        if (entity == null) {
            return null;
        }

        AttendanceRecordItem item = new AttendanceRecordItem();
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());
        item.setEmployeeId(entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : null);
        item.setClockIn(entity.getClockIn() != null ? entity.getClockIn().format(ISO_FMT) : null);
        item.setClockOut(entity.getClockOut() != null ? entity.getClockOut().format(ISO_FMT) : null);
        item.setClockMethod(entity.getClockMethod() != null ? entity.getClockMethod().name() : null);
        item.setClockInLatitude(entity.getClockInLatitude() != null ? String.valueOf(entity.getClockInLatitude()) : null);
        item.setClockInLongitude(entity.getClockInLongitude() != null ? String.valueOf(entity.getClockInLongitude()) : null);
        item.setClockOutLatitude(entity.getClockOutLatitude() != null ? String.valueOf(entity.getClockOutLatitude()) : null);
        item.setClockOutLongitude(entity.getClockOutLongitude() != null ? String.valueOf(entity.getClockOutLongitude()) : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setTotalHours(entity.getTotalHours() != null ? entity.getTotalHours().toPlainString() : null);
        item.setNotes(entity.getNotes());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : null);

        return item;
    }
}
