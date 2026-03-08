package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.LeaveEncashmentResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.leave.*;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.leave.LeaveBalanceRepository;
import com.arthmatic.shumelahire.repository.leave.LeaveEncashmentRequestRepository;
import com.arthmatic.shumelahire.repository.leave.LeaveTypeRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveEncashmentService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveEncashmentService.class);

    @Autowired
    private LeaveEncashmentRequestRepository encashmentRepository;

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public LeaveEncashmentResponse requestEncashment(Long employeeId, Long leaveTypeId, BigDecimal days, String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + leaveTypeId));

        if (!Boolean.TRUE.equals(leaveType.getAllowEncashment())) {
            throw new IllegalArgumentException("Leave type does not allow encashment: " + leaveType.getName());
        }

        int currentYear = Year.now().getValue();

        // Check available balance
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndCycleYear(employeeId, leaveTypeId, currentYear)
                .orElseThrow(() -> new IllegalArgumentException("No leave balance found for current year"));

        BigDecimal available = balance.getAvailableDays();
        if (days.compareTo(available) > 0) {
            throw new IllegalArgumentException("Requested days (" + days + ") exceeds available balance (" + available + ")");
        }

        BigDecimal rate = leaveType.getEncashmentRate();
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Encashment rate not configured for leave type: " + leaveType.getName());
        }

        LeaveEncashmentRequest request = new LeaveEncashmentRequest();
        request.setEmployee(employee);
        request.setLeaveType(leaveType);
        request.setDays(days);
        request.setRatePerDay(rate);
        request.setTotalAmount(days.multiply(rate));
        request.setStatus(LeaveEncashmentStatus.PENDING);
        request.setReason(reason);
        request.setCycleYear(currentYear);

        request = encashmentRepository.save(request);

        auditLogService.saveLog(employeeId.toString(), "CREATE", "LEAVE_ENCASHMENT",
                request.getId().toString(), "Requested encashment of " + days + " days for " + leaveType.getName());

        logger.info("Leave encashment request created: {} for employee {}", request.getId(), employeeId);
        return LeaveEncashmentResponse.fromEntity(request);
    }

    public LeaveEncashmentResponse hrApprove(Long requestId, Long approverId) {
        LeaveEncashmentRequest request = encashmentRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Encashment request not found: " + requestId));

        if (request.getStatus() != LeaveEncashmentStatus.PENDING) {
            throw new IllegalArgumentException("Request is not in PENDING status");
        }

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        request.setStatus(LeaveEncashmentStatus.HR_APPROVED);
        request.setHrApprovedBy(approver);
        request.setHrApprovedAt(LocalDateTime.now());
        request = encashmentRepository.save(request);

        auditLogService.saveLog(approverId.toString(), "HR_APPROVE", "LEAVE_ENCASHMENT",
                request.getId().toString(), "HR approved encashment request");

        logger.info("Leave encashment HR approved: {} by {}", requestId, approverId);
        return LeaveEncashmentResponse.fromEntity(request);
    }

    public LeaveEncashmentResponse financeApprove(Long requestId, Long approverId) {
        LeaveEncashmentRequest request = encashmentRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Encashment request not found: " + requestId));

        if (request.getStatus() != LeaveEncashmentStatus.HR_APPROVED) {
            throw new IllegalArgumentException("Request must be HR_APPROVED before finance approval");
        }

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        request.setStatus(LeaveEncashmentStatus.FINANCE_APPROVED);
        request.setFinanceApprovedBy(approver);
        request.setFinanceApprovedAt(LocalDateTime.now());
        request = encashmentRepository.save(request);

        // Deduct encashed days from leave balance
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndCycleYear(
                        request.getEmployee().getId(),
                        request.getLeaveType().getId(),
                        request.getCycleYear())
                .orElse(null);

        if (balance != null) {
            balance.setEncashedDays(balance.getEncashedDays().add(request.getDays()));
            leaveBalanceRepository.save(balance);
        }

        auditLogService.saveLog(approverId.toString(), "FINANCE_APPROVE", "LEAVE_ENCASHMENT",
                request.getId().toString(),
                "Finance approved encashment of " + request.getDays() + " days, amount: " + request.getTotalAmount());

        logger.info("Leave encashment finance approved: {} by {}", requestId, approverId);
        return LeaveEncashmentResponse.fromEntity(request);
    }

    public LeaveEncashmentResponse reject(Long requestId, Long approverId, String comment) {
        LeaveEncashmentRequest request = encashmentRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Encashment request not found: " + requestId));

        if (request.getStatus() == LeaveEncashmentStatus.FINANCE_APPROVED ||
            request.getStatus() == LeaveEncashmentStatus.REJECTED ||
            request.getStatus() == LeaveEncashmentStatus.PROCESSED) {
            throw new IllegalArgumentException("Cannot reject request in " + request.getStatus() + " status");
        }

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        request.setStatus(LeaveEncashmentStatus.REJECTED);
        request.setDecisionComment(comment);
        request = encashmentRepository.save(request);

        auditLogService.saveLog(approverId.toString(), "REJECT", "LEAVE_ENCASHMENT",
                request.getId().toString(), "Rejected encashment request: " + (comment != null ? comment : ""));

        logger.info("Leave encashment rejected: {} by {}", requestId, approverId);
        return LeaveEncashmentResponse.fromEntity(request);
    }

    @Transactional(readOnly = true)
    public List<LeaveEncashmentResponse> getByEmployee(Long employeeId) {
        return encashmentRepository.findByEmployeeId(employeeId).stream()
                .map(LeaveEncashmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveEncashmentResponse> getPendingForHR() {
        return encashmentRepository.findByStatus(LeaveEncashmentStatus.PENDING).stream()
                .map(LeaveEncashmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveEncashmentResponse> getPendingForFinance() {
        return encashmentRepository.findByStatus(LeaveEncashmentStatus.HR_APPROVED).stream()
                .map(LeaveEncashmentResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
