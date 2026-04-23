package com.arthmatic.shumelahire.controller.leave;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.leave.*;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;
import com.arthmatic.shumelahire.service.leave.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
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

    @Autowired
    private LeaveEncashmentService leaveEncashmentService;

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
    public ResponseEntity<?> updateLeaveType(@PathVariable String id,
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
            @RequestParam(required = false) String leaveTypeId) {
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
    public ResponseEntity<?> updateLeavePolicy(@PathVariable String id,
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
            @RequestParam String employeeId,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(leaveBalanceService.getBalancesForEmployee(employeeId, year));
    }

    // ---- Leave Requests ----

    @PostMapping("/requests")
    public ResponseEntity<?> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateRequest request,
                                                @RequestParam String employeeId) {
        try {
            LeaveRequestResponse response = leaveRequestService.create(request, employeeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<List<LeaveRequestResponse>> getRequests(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String status) {
        if (employeeId != null) {
            return ResponseEntity.ok(leaveRequestService.getByEmployee(employeeId));
        }
        if (status != null) {
            return ResponseEntity.ok(leaveRequestService.getAllByStatus(
                    LeaveRequestStatus.valueOf(status)));
        }
        return ResponseEntity.ok(leaveRequestService.getAllByStatus(LeaveRequestStatus.PENDING));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequest(@PathVariable String id) {
        try {
            return ResponseEntity.ok(leaveRequestService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/requests/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<List<LeaveRequestResponse>> getPendingApprovals(
            @RequestParam String managerId) {
        return ResponseEntity.ok(leaveRequestService.getPendingApprovals(managerId));
    }

    @PutMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> approveRequest(@PathVariable String id,
                                            @RequestParam String approverId) {
        try {
            LeaveRequestResponse response = leaveRequestService.approve(id, approverId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> rejectRequest(@PathVariable String id,
                                           @RequestParam String approverId,
                                           @RequestBody(required = false) LeaveDecisionRequest decision) {
        try {
            LeaveRequestResponse response = leaveRequestService.reject(id, approverId, decision);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}/cancel")
    public ResponseEntity<?> cancelRequest(@PathVariable String id,
                                           @RequestParam String employeeId,
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

    @GetMapping("/analytics/trends")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> getAnalyticsTrends() {
        return ResponseEntity.ok(leaveAnalyticsService.getAnalyticsTrends());
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
    public ResponseEntity<?> deleteHoliday(@PathVariable String id) {
        try {
            publicHolidayService.delete(id, "SYSTEM");
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ---- Leave Encashment ----

    @PostMapping("/encashment")
    public ResponseEntity<?> requestEncashment(@Valid @RequestBody LeaveEncashmentCreateRequest request,
                                                @RequestParam String employeeId) {
        try {
            LeaveEncashmentResponse response = leaveEncashmentService.requestEncashment(
                    employeeId, request.getLeaveTypeId(), request.getDays(), request.getReason());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/encashment")
    public ResponseEntity<List<LeaveEncashmentResponse>> getEncashmentRequests(
            @RequestParam String employeeId) {
        return ResponseEntity.ok(leaveEncashmentService.getByEmployee(employeeId));
    }

    @GetMapping("/encashment/pending/hr")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<List<LeaveEncashmentResponse>> getPendingEncashmentHR() {
        return ResponseEntity.ok(leaveEncashmentService.getPendingForHR());
    }

    @GetMapping("/encashment/pending/finance")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<List<LeaveEncashmentResponse>> getPendingEncashmentFinance() {
        return ResponseEntity.ok(leaveEncashmentService.getPendingForFinance());
    }

    @PutMapping("/encashment/{id}/hr-approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> hrApproveEncashment(@PathVariable String id,
                                                  @RequestParam String approverId) {
        try {
            return ResponseEntity.ok(leaveEncashmentService.hrApprove(id, approverId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/encashment/{id}/finance-approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> financeApproveEncashment(@PathVariable String id,
                                                       @RequestParam String approverId) {
        try {
            return ResponseEntity.ok(leaveEncashmentService.financeApprove(id, approverId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/encashment/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> rejectEncashment(@PathVariable String id,
                                               @RequestParam String approverId,
                                               @RequestParam(required = false) String comment) {
        try {
            return ResponseEntity.ok(leaveEncashmentService.reject(id, approverId, comment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
