package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.*;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.AttendanceRecordDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

    @Autowired
    private AttendanceRecordDataRepository attendanceRecordRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private GeofenceService geofenceService;

    @Autowired
    private AuditLogService auditLogService;

    public AttendanceRecord clockIn(String employeeId, ClockMethod method, Double latitude, Double longitude) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        // Check for open session
        attendanceRecordRepository.findOpenSession(employeeId)
                .ifPresent(r -> { throw new IllegalArgumentException("Already clocked in. Please clock out first."); });

        // Validate geofence if applicable
        if (method == ClockMethod.GEOFENCE && latitude != null && longitude != null) {
            if (!geofenceService.isWithinAnyGeofence(latitude, longitude)) {
                throw new IllegalArgumentException("You are not within an authorized geofence location");
            }
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setClockIn(LocalDateTime.now());
        record.setClockMethod(method);
        record.setClockInLatitude(latitude);
        record.setClockInLongitude(longitude);
        record.setStatus(AttendanceStatus.PRESENT);
        record = attendanceRecordRepository.save(record);

        auditLogService.saveLog(employeeId, "CLOCK_IN", "ATTENDANCE",
                record.getId().toString(), "Clocked in via " + method);
        logger.info("Employee {} clocked in via {}", employeeId, method);
        return record;
    }

    public AttendanceRecord clockOut(String employeeId, Double latitude, Double longitude) {
        AttendanceRecord record = attendanceRecordRepository.findOpenSession(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("No open clock-in session found"));

        record.setClockOut(LocalDateTime.now());
        record.setClockOutLatitude(latitude);
        record.setClockOutLongitude(longitude);

        Duration duration = Duration.between(record.getClockIn(), record.getClockOut());
        BigDecimal hours = BigDecimal.valueOf(duration.toMinutes()).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        record.setTotalHours(hours);

        record = attendanceRecordRepository.save(record);

        auditLogService.saveLog(employeeId, "CLOCK_OUT", "ATTENDANCE",
                record.getId().toString(), "Clocked out. Total hours: " + hours);
        logger.info("Employee {} clocked out. Hours: {}", employeeId, hours);
        return record;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getByEmployee(String employeeId) {
        List<AttendanceRecord> records = attendanceRecordRepository.findByEmployeeId(employeeId);
        enrichAttendanceRecords(records);
        return records;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getByDateRange(LocalDateTime start, LocalDateTime end) {
        List<AttendanceRecord> records = attendanceRecordRepository.findByDateRange(start, end);
        enrichAttendanceRecords(records);
        return records;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getTeamAttendance(String department, LocalDateTime start, LocalDateTime end) {
        List<AttendanceRecord> records = attendanceRecordRepository.findByDepartmentAndDateRange(department, start, end);
        enrichAttendanceRecords(records);
        return records;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<AttendanceRecord> getOpenSession(String employeeId) {
        java.util.Optional<AttendanceRecord> session = attendanceRecordRepository.findOpenSession(employeeId);
        session.ifPresent(r -> enrichAttendanceRecords(List.of(r)));
        return session;
    }

    private void enrichAttendanceRecords(List<AttendanceRecord> records) {
        Set<String> employeeIds = new HashSet<>();
        for (AttendanceRecord r : records) {
            if (r.getEmployee() != null && r.getEmployee().getId() != null) {
                employeeIds.add(r.getEmployee().getId());
            }
        }
        if (employeeIds.isEmpty()) return;

        Map<String, Employee> employeeMap = new HashMap<>();
        for (String id : employeeIds) {
            employeeRepository.findById(id).ifPresent(emp -> employeeMap.put(id, emp));
        }

        for (AttendanceRecord r : records) {
            if (r.getEmployee() != null && employeeMap.containsKey(r.getEmployee().getId())) {
                r.setEmployee(employeeMap.get(r.getEmployee().getId()));
            }
        }
    }

    public AttendanceRecord createManualEntry(String employeeId, LocalDateTime clockIn, LocalDateTime clockOut, String notes) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setClockIn(clockIn);
        record.setClockOut(clockOut);
        record.setClockMethod(ClockMethod.MANUAL);
        record.setStatus(AttendanceStatus.PENDING_APPROVAL);
        record.setNotes(notes);

        if (clockOut != null) {
            Duration duration = Duration.between(clockIn, clockOut);
            BigDecimal hours = BigDecimal.valueOf(duration.toMinutes())
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            record.setTotalHours(hours);
        }

        record = attendanceRecordRepository.save(record);

        auditLogService.saveLog(employeeId, "MANUAL_ENTRY", "ATTENDANCE",
                record.getId().toString(), "Manual attendance entry created");
        logger.info("Manual attendance entry created for employee {}", employeeId);
        return record;
    }

    public AttendanceRecord approveManualEntry(String id) {
        AttendanceRecord record = attendanceRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attendance record not found: " + id));

        if (record.getStatus() != AttendanceStatus.PENDING_APPROVAL) {
            throw new IllegalArgumentException("Record is not pending approval");
        }

        record.setStatus(AttendanceStatus.PRESENT);
        record = attendanceRecordRepository.save(record);

        auditLogService.saveLog("SYSTEM", "APPROVE", "ATTENDANCE",
                record.getId().toString(), "Manual attendance entry approved");
        logger.info("Manual attendance entry {} approved", id);
        return record;
    }
}
