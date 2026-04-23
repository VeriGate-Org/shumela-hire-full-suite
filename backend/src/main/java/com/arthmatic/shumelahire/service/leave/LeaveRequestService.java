package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.LeaveDecisionRequest;
import com.arthmatic.shumelahire.dto.leave.LeaveRequestCreateRequest;
import com.arthmatic.shumelahire.dto.leave.LeaveRequestResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.leave.*;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.LeaveRequestDataRepository;
import com.arthmatic.shumelahire.repository.LeaveTypeDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveRequestService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveRequestService.class);

    @Autowired
    private LeaveRequestDataRepository leaveRequestRepository;

    @Autowired
    private LeaveTypeDataRepository leaveTypeRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private LeaveBalanceService leaveBalanceService;

    @Autowired
    private PublicHolidayService publicHolidayService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    public LeaveRequestResponse create(LeaveRequestCreateRequest request, String employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + request.getLeaveTypeId()));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        // Check for overlapping requests
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlappingForEmployee(
                employeeId, request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("You already have a leave request for this period");
        }

        // Calculate working days
        BigDecimal totalDays;
        if (Boolean.TRUE.equals(request.getIsHalfDay())) {
            totalDays = new BigDecimal("0.5");
        } else {
            totalDays = calculateWorkingDays(request.getStartDate(), request.getEndDate());
        }

        // Check balance
        int cycleYear = request.getStartDate().getYear();
        if (!leaveBalanceService.hasSufficientBalance(employeeId, leaveType.getId(), cycleYear, totalDays)) {
            throw new IllegalArgumentException("Insufficient leave balance. Available days are less than requested " + totalDays + " days");
        }

        // Check medical certificate requirement
        if (Boolean.TRUE.equals(leaveType.getRequiresMedicalCertificate())
                && totalDays.compareTo(new BigDecimal(leaveType.getMedicalCertThresholdDays())) > 0
                && (request.getMedicalCertificateUrl() == null || request.getMedicalCertificateUrl().isBlank())) {
            throw new IllegalArgumentException("Medical certificate is required for " + leaveType.getName()
                    + " exceeding " + leaveType.getMedicalCertThresholdDays() + " days");
        }

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(leaveType);
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setTotalDays(totalDays);
        leaveRequest.setIsHalfDay(request.getIsHalfDay() != null ? request.getIsHalfDay() : false);
        if (request.getHalfDayPeriod() != null) {
            leaveRequest.setHalfDayPeriod(HalfDayPeriod.valueOf(request.getHalfDayPeriod()));
        }
        leaveRequest.setReason(request.getReason());
        leaveRequest.setMedicalCertificateUrl(request.getMedicalCertificateUrl());
        leaveRequest.setStatus(LeaveRequestStatus.PENDING);

        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Add to pending balance
        leaveBalanceService.addPendingDays(employeeId, leaveType.getId(), cycleYear, totalDays);

        // Notify manager
        if (employee.getReportingManager() != null) {
            notificationService.notifyApprovalRequired(
                    employee.getReportingManager().getId(),
                    "Leave Request",
                    employee.getFullName() + " - " + leaveType.getName()
                            + " (" + request.getStartDate() + " to " + request.getEndDate() + ")");
        }

        auditLogService.saveLog(employeeId, "CREATE", "LEAVE_REQUEST",
                leaveRequest.getId().toString(),
                "Leave request submitted: " + leaveType.getName() + " from "
                        + request.getStartDate() + " to " + request.getEndDate());

        logger.info("Leave request created: ID {} for employee {} ({} days of {})",
                leaveRequest.getId(), employeeId, totalDays, leaveType.getName());

        return LeaveRequestResponse.fromEntity(leaveRequest);
    }

    public LeaveRequestResponse approve(String requestId, String approverId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + requestId));

        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalArgumentException("Leave request is not in PENDING status");
        }

        validateManagerAccess(leaveRequest.getEmployee().getId(), approverId);

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        leaveRequest.setStatus(LeaveRequestStatus.APPROVED);
        leaveRequest.setApprover(approver);
        leaveRequest.setApprovedAt(LocalDateTime.now());
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Move from pending to taken
        int cycleYear = leaveRequest.getStartDate().getYear();
        leaveBalanceService.confirmTakenDays(
                leaveRequest.getEmployee().getId(),
                leaveRequest.getLeaveType().getId(),
                cycleYear,
                leaveRequest.getTotalDays());

        // Notify employee
        notificationService.notifyApprovalGranted(
                leaveRequest.getEmployee().getId(),
                "Leave Request",
                leaveRequest.getLeaveType().getName() + " ("
                        + leaveRequest.getStartDate() + " to " + leaveRequest.getEndDate() + ")");

        auditLogService.saveLog(approverId, "APPROVE", "LEAVE_REQUEST",
                requestId, "Approved leave request for " + leaveRequest.getEmployee().getFullName());

        logger.info("Leave request {} approved by {}", requestId, approverId);
        return LeaveRequestResponse.fromEntity(leaveRequest);
    }

    public LeaveRequestResponse reject(String requestId, String approverId, LeaveDecisionRequest decision) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + requestId));

        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalArgumentException("Leave request is not in PENDING status");
        }

        validateManagerAccess(leaveRequest.getEmployee().getId(), approverId);

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        leaveRequest.setStatus(LeaveRequestStatus.REJECTED);
        leaveRequest.setApprover(approver);
        leaveRequest.setRejectionReason(decision != null ? decision.getReason() : null);
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Remove pending days
        int cycleYear = leaveRequest.getStartDate().getYear();
        leaveBalanceService.removePendingDays(
                leaveRequest.getEmployee().getId(),
                leaveRequest.getLeaveType().getId(),
                cycleYear,
                leaveRequest.getTotalDays());

        // Notify employee
        notificationService.notifyApprovalDenied(
                leaveRequest.getEmployee().getId(),
                "Leave Request",
                leaveRequest.getLeaveType().getName(),
                decision != null ? decision.getReason() : null);

        auditLogService.saveLog(approverId, "REJECT", "LEAVE_REQUEST",
                requestId, "Rejected leave request: " + (decision != null ? decision.getReason() : ""));

        logger.info("Leave request {} rejected by {}", requestId, approverId);
        return LeaveRequestResponse.fromEntity(leaveRequest);
    }

    public LeaveRequestResponse cancel(String requestId, String employeeId, LeaveDecisionRequest decision) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + requestId));

        if (!leaveRequest.getEmployee().getId().equals(employeeId)) {
            throw new IllegalArgumentException("You can only cancel your own leave requests");
        }

        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING
                && leaveRequest.getStatus() != LeaveRequestStatus.APPROVED) {
            throw new IllegalArgumentException("Leave request cannot be cancelled in its current status");
        }

        LeaveRequestStatus previousStatus = leaveRequest.getStatus();
        leaveRequest.setStatus(LeaveRequestStatus.CANCELLED);
        leaveRequest.setCancelledAt(LocalDateTime.now());
        leaveRequest.setCancellationReason(decision != null ? decision.getReason() : null);
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        int cycleYear = leaveRequest.getStartDate().getYear();
        if (previousStatus == LeaveRequestStatus.PENDING) {
            leaveBalanceService.removePendingDays(
                    employeeId, leaveRequest.getLeaveType().getId(), cycleYear, leaveRequest.getTotalDays());
        } else if (previousStatus == LeaveRequestStatus.APPROVED) {
            // Reverse taken days - add back as adjustment
            LeaveBalance balance = leaveBalanceService.getOrCreateBalance(
                    employeeId, leaveRequest.getLeaveType().getId(), cycleYear);
            balance.setTakenDays(balance.getTakenDays().subtract(leaveRequest.getTotalDays()));
            // Balance will be saved by the transaction
        }

        auditLogService.saveLog(employeeId, "CANCEL", "LEAVE_REQUEST",
                requestId, "Cancelled leave request");

        logger.info("Leave request {} cancelled by employee {}", requestId, employeeId);
        return LeaveRequestResponse.fromEntity(leaveRequest);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getByEmployee(String employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .map(LeaveRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getPendingApprovals(String managerId) {
        return leaveRequestRepository.findPendingForApprover(managerId).stream()
                .map(LeaveRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getAllByStatus(LeaveRequestStatus status) {
        return leaveRequestRepository.findByStatus(status).stream()
                .map(LeaveRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeaveRequestResponse getById(String id) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + id));
        return LeaveRequestResponse.fromEntity(request);
    }

    private void validateManagerAccess(String employeeId, String approverId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isLineManager = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LINE_MANAGER"));

        if (isLineManager) {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
            if (employee.getReportingManager() == null ||
                    !employee.getReportingManager().getId().equals(approverId)) {
                throw new AccessDeniedException("You can only approve requests for your direct reports");
            }
        }
    }

    public BigDecimal calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        BigDecimal workingDays = BigDecimal.ZERO;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek() != DayOfWeek.SATURDAY
                    && current.getDayOfWeek() != DayOfWeek.SUNDAY
                    && !publicHolidayService.isPublicHoliday(current)) {
                workingDays = workingDays.add(BigDecimal.ONE);
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }
}
