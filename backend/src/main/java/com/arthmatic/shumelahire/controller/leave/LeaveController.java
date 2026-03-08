package com.arthmatic.shumelahire.controller.leave;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.leave.*;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;
import com.arthmatic.shumelahire.service.leave.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leave")
@FeatureGate("LEAVE_MANAGEMENT")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
public class LeaveController {

    private static final Logger logger = LoggerFactory.getLogger(LeaveController.class);

    @Autowired
    private LeaveTypeService leaveTypeService;

    @Autowired
    private LeavePolicyService leavePolicyService;

    @Autowired
    private LeaveBalanceService leaveBalanceService;

    @Autowired
    private LeaveRequestService leaveRequestService;

    @Autowired
    private LeaveCalendarService leaveCalendarService;

    @Autowired
    private LeaveAnalyticsService leaveAnalyticsService;

    @Autowired
    private PublicHolidayService publicHolidayService;

    // ---- Leave Types ----

    @GetMapping("/types")
    public ResponseEntity<List<LeaveTypeResponse>> getLeaveTypes(
            @RequestParam(required = false) Boolean activeOnly) {
        List<LeaveTypeResponse> types = Boolean.TRUE.equals(activeOnly)
                ? leaveTypeService.getActive()
                : leaveTypeService.getAll();
        return ResponseEntity.ok(types);
    }

    @PostMapping("/types")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createLeaveType(@Valid @RequestBody LeaveTypeRequest request) {
        try {
            LeaveTypeResponse response = leaveTypeService.create(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/types/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateLeaveType(@PathVariable Long id,
                                             @Valid @RequestBody LeaveTypeRequest request) {
        try {
            LeaveTypeResponse response = leaveTypeService.update(id, request, "SYSTEM");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Leave Policies ----

    @GetMapping("/policies")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<List<LeavePolicyResponse>> getLeavePolicies(
            @RequestParam(required = false) Long leaveTypeId) {
        List<LeavePolicyResponse> policies = leaveTypeId != null
                ? leavePolicyService.getByLeaveType(leaveTypeId)
                : leavePolicyService.getAll();
        return ResponseEntity.ok(policies);
    }

    @PostMapping("/policies")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createLeavePolicy(@Valid @RequestBody LeavePolicyRequest request) {
        try {
            LeavePolicyResponse response = leavePolicyService.create(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/policies/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateLeavePolicy(@PathVariable Long id,
                                               @Valid @RequestBody LeavePolicyRequest request) {
        try {
            LeavePolicyResponse response = leavePolicyService.update(id, request, "SYSTEM");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Leave Balances ----

    @GetMapping("/balances")
    public ResponseEntity<List<LeaveBalanceResponse>> getBalances(
            @RequestParam Long employeeId,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(leaveBalanceService.getBalancesForEmployee(employeeId, year));
    }

    // ---- Leave Requests ----

    @PostMapping("/requests")
    public ResponseEntity<?> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateRequest request,
                                                @RequestParam Long employeeId) {
        try {
            LeaveRequestResponse response = leaveRequestService.create(request, employeeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<Page<LeaveRequestResponse>> getRequests(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (employeeId != null) {
            return ResponseEntity.ok(leaveRequestService.getByEmployee(employeeId, pageable));
        }
        if (status != null) {
            return ResponseEntity.ok(leaveRequestService.getAllByStatus(
                    LeaveRequestStatus.valueOf(status), pageable));
        }
        return ResponseEntity.ok(leaveRequestService.getAllByStatus(LeaveRequestStatus.PENDING, pageable));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(leaveRequestService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/requests/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<Page<LeaveRequestResponse>> getPendingApprovals(
            @RequestParam Long managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(leaveRequestService.getPendingApprovals(managerId, pageable));
    }

    @PutMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> approveRequest(@PathVariable Long id,
                                            @RequestParam Long approverId) {
        try {
            LeaveRequestResponse response = leaveRequestService.approve(id, approverId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id,
                                           @RequestParam Long approverId,
                                           @RequestBody(required = false) LeaveDecisionRequest decision) {
        try {
            LeaveRequestResponse response = leaveRequestService.reject(id, approverId, decision);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}/cancel")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id,
                                           @RequestParam Long employeeId,
                                           @RequestBody(required = false) LeaveDecisionRequest decision) {
        try {
            LeaveRequestResponse response = leaveRequestService.cancel(id, employeeId, decision);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Calendar ----

    @GetMapping("/calendar")
    public ResponseEntity<List<LeaveCalendarEntry>> getCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(leaveCalendarService.getCalendarEntries(startDate, endDate, department));
    }

    // ---- Analytics ----

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(leaveAnalyticsService.getAnalytics());
    }

    // ---- Public Holidays ----

    @GetMapping("/holidays")
    public ResponseEntity<List<PublicHolidayResponse>> getHolidays() {
        return ResponseEntity.ok(publicHolidayService.getAll());
    }

    @PostMapping("/holidays")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createHoliday(@Valid @RequestBody PublicHolidayRequest request) {
        try {
            PublicHolidayResponse response = publicHolidayService.create(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/holidays/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deleteHoliday(@PathVariable Long id) {
        try {
            publicHolidayService.delete(id, "SYSTEM");
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
