package com.arthmatic.shumelahire.controller.attendance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.attendance.Shift;
import com.arthmatic.shumelahire.entity.attendance.ShiftSchedule;
import com.arthmatic.shumelahire.service.attendance.ShiftScheduleService;
import com.arthmatic.shumelahire.service.attendance.ShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shifts")
@FeatureGate("SHIFT_SCHEDULING")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class ShiftController {

    @Autowired
    private ShiftService shiftService;

    @Autowired
    private ShiftScheduleService shiftScheduleService;

    @GetMapping
    public ResponseEntity<List<Shift>> getShifts(@RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(Boolean.TRUE.equals(activeOnly) ? shiftService.getActive() : shiftService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> createShift(@RequestBody Map<String, Object> body) {
        try {
            Shift shift = shiftService.create(
                    (String) body.get("name"),
                    (String) body.get("code"),
                    LocalTime.parse((String) body.get("startTime")),
                    LocalTime.parse((String) body.get("endTime")),
                    body.get("breakMinutes") != null ? ((Number) body.get("breakMinutes")).intValue() : 0,
                    (String) body.get("colorCode"),
                    "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(shift);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Schedules ----

    @GetMapping("/schedules")
    public ResponseEntity<List<ShiftSchedule>> getSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String department) {
        List<ShiftSchedule> schedules = department != null
                ? shiftScheduleService.getByDepartment(department, startDate, endDate)
                : shiftScheduleService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(schedules);
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> assignShift(@RequestParam String employeeId,
                                         @RequestParam String shiftId,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            ShiftSchedule schedule = shiftScheduleService.assign(employeeId, shiftId, date, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/schedules/employee")
    public ResponseEntity<List<ShiftSchedule>> getEmployeeSchedules(
            @RequestParam String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(shiftScheduleService.getByEmployeeAndDateRange(employeeId, startDate, endDate));
    }

    @PostMapping("/schedules/swap")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> swapShifts(@RequestBody Map<String, Object> body) {
        try {
            String scheduleId1 = body.get("scheduleId1").toString();
            String scheduleId2 = body.get("scheduleId2").toString();
            shiftScheduleService.swapSchedules(scheduleId1, scheduleId2);
            return ResponseEntity.ok(Map.of("message", "Shifts swapped successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
