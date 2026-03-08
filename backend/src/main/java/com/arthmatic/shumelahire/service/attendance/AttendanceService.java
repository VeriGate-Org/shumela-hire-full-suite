package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.*;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.attendance.AttendanceRecordRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private GeofenceService geofenceService;

    @Autowired
    private AuditLogService auditLogService;

    public AttendanceRecord clockIn(Long employeeId, ClockMethod method, Double latitude, Double longitude) {
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

        auditLogService.saveLog(employeeId.toString(), "CLOCK_IN", "ATTENDANCE",
                record.getId().toString(), "Clocked in via " + method);
        logger.info("Employee {} clocked in via {}", employeeId, method);
        return record;
    }

    public AttendanceRecord clockOut(Long employeeId, Double latitude, Double longitude) {
        AttendanceRecord record = attendanceRecordRepository.findOpenSession(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("No open clock-in session found"));

        record.setClockOut(LocalDateTime.now());
        record.setClockOutLatitude(latitude);
        record.setClockOutLongitude(longitude);

        Duration duration = Duration.between(record.getClockIn(), record.getClockOut());
        BigDecimal hours = BigDecimal.valueOf(duration.toMinutes()).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        record.setTotalHours(hours);

        record = attendanceRecordRepository.save(record);

        auditLogService.saveLog(employeeId.toString(), "CLOCK_OUT", "ATTENDANCE",
                record.getId().toString(), "Clocked out. Total hours: " + hours);
        logger.info("Employee {} clocked out. Hours: {}", employeeId, hours);
        return record;
    }

    @Transactional(readOnly = true)
    public Page<AttendanceRecord> getByEmployee(Long employeeId, Pageable pageable) {
        return attendanceRecordRepository.findByEmployeeId(employeeId, pageable);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getByDateRange(LocalDateTime start, LocalDateTime end) {
        return attendanceRecordRepository.findByDateRange(start, end);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getTeamAttendance(String department, LocalDateTime start, LocalDateTime end) {
        return attendanceRecordRepository.findByDepartmentAndDateRange(department, start, end);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<AttendanceRecord> getOpenSession(Long employeeId) {
        return attendanceRecordRepository.findOpenSession(employeeId);
    }

    public AttendanceRecord createManualEntry(Long employeeId, LocalDateTime clockIn, LocalDateTime clockOut, String notes) {
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

        auditLogService.saveLog(employeeId.toString(), "MANUAL_ENTRY", "ATTENDANCE",
                record.getId().toString(), "Manual attendance entry created");
        logger.info("Manual attendance entry created for employee {}", employeeId);
        return record;
    }

    public AttendanceRecord approveManualEntry(Long id) {
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
