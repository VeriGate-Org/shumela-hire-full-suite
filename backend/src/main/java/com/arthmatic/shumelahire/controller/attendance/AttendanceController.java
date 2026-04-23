package com.arthmatic.shumelahire.controller.attendance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.attendance.AttendanceRecord;
import com.arthmatic.shumelahire.entity.attendance.ClockMethod;
import com.arthmatic.shumelahire.entity.attendance.OvertimeRecord;
import com.arthmatic.shumelahire.service.attendance.AttendanceService;
import com.arthmatic.shumelahire.service.attendance.OvertimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@FeatureGate("TIME_ATTENDANCE")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private OvertimeService overtimeService;

    @PostMapping("/clock-in")
    public ResponseEntity<?> clockIn(@RequestParam String employeeId,
                                     @RequestParam(defaultValue = "MANUAL") String method,
                                     @RequestParam(required = false) Double latitude,
                                     @RequestParam(required = false) Double longitude) {
        try {
            AttendanceRecord record = attendanceService.clockIn(employeeId, ClockMethod.valueOf(method), latitude, longitude);
            return ResponseEntity.status(HttpStatus.CREATED).body(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/clock-out")
    public ResponseEntity<?> clockOut(@RequestParam String employeeId,
                                      @RequestParam(required = false) Double latitude,
                                      @RequestParam(required = false) Double longitude) {
        try {
            AttendanceRecord record = attendanceService.clockOut(employeeId, latitude, longitude);
            return ResponseEntity.ok(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/records")
    public ResponseEntity<List<AttendanceRecord>> getRecords(@RequestParam String employeeId) {
        return ResponseEntity.ok(attendanceService.getByEmployee(employeeId));
    }

    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<List<AttendanceRecord>> getTeamAttendance(
            @RequestParam String department,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getTeamAttendance(department,
                startDate.atStartOfDay(), endDate.atTime(23, 59, 59)));
    }

    // ---- Overtime ----

    @PostMapping("/overtime")
    public ResponseEntity<?> submitOvertime(@RequestParam String employeeId,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                            @RequestParam BigDecimal hours,
                                            @RequestParam(required = false) String reason) {
        try {
            OvertimeRecord record = overtimeService.submit(employeeId, date, hours, reason);
            return ResponseEntity.status(HttpStatus.CREATED).body(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/overtime/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> approveOvertime(@PathVariable String id, @RequestParam String approverId) {
        try {
            return ResponseEntity.ok(overtimeService.approve(id, approverId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/overtime/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> rejectOvertime(@PathVariable String id, @RequestParam String approverId) {
        try {
            return ResponseEntity.ok(overtimeService.reject(id, approverId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/overtime")
    public ResponseEntity<List<OvertimeRecord>> getOvertime(@RequestParam String employeeId) {
        return ResponseEntity.ok(overtimeService.getByEmployee(employeeId));
    }

    @GetMapping("/overtime/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<List<OvertimeRecord>> getPendingOvertime() {
        return ResponseEntity.ok(overtimeService.getPending());
    }

    // ---- Status ----

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(@RequestParam String employeeId) {
        try {
            java.util.Optional<AttendanceRecord> openSession = attendanceService.getOpenSession(employeeId);
            if (openSession.isPresent()) {
                return ResponseEntity.ok(openSession.get());
            }
            return ResponseEntity.ok(Map.of("clockedIn", false));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Manual Entry ----

    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> createManualEntry(@RequestBody Map<String, Object> body) {
        try {
            String employeeId = body.get("employeeId").toString();
            LocalDateTime clockIn = LocalDateTime.parse((String) body.get("clockIn"));
            LocalDateTime clockOut = body.get("clockOut") != null ? LocalDateTime.parse((String) body.get("clockOut")) : null;
            String notes = (String) body.get("notes");

            AttendanceRecord record = attendanceService.createManualEntry(employeeId, clockIn, clockOut, notes);
            return ResponseEntity.status(HttpStatus.CREATED).body(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/manual/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> approveManualEntry(@PathVariable String id) {
        try {
            AttendanceRecord record = attendanceService.approveManualEntry(id);
            return ResponseEntity.ok(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
