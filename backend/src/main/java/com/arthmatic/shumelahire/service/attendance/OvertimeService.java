package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.OvertimeRecord;
import com.arthmatic.shumelahire.entity.attendance.OvertimeStatus;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.OvertimeRecordDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
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

import java.util.List;
import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional
public class OvertimeService {

    private static final Logger logger = LoggerFactory.getLogger(OvertimeService.class);

    @Autowired
    private OvertimeRecordDataRepository overtimeRecordRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private UserDataRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    public OvertimeRecord submit(String employeeId, LocalDate date, BigDecimal hours, String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        OvertimeRecord record = new OvertimeRecord();
        record.setEmployee(employee);
        record.setDate(date);
        record.setHours(hours);
        record.setReason(reason);
        record.setStatus(OvertimeStatus.PENDING);
        record = overtimeRecordRepository.save(record);

        if (employee.getReportingManager() != null) {
            notificationService.notifyApprovalRequired(
                    employee.getReportingManager().getId(), "Overtime", employee.getFullName() + " - " + hours + " hours");
        }

        auditLogService.saveLog(employeeId, "SUBMIT", "OVERTIME",
                record.getId().toString(), "Submitted overtime: " + hours + " hours on " + date);
        return record;
    }

    public OvertimeRecord approve(String recordId, String approverId) {
        OvertimeRecord record = overtimeRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Overtime record not found: " + recordId));

        validateManagerAccess(record.getEmployee().getId(), approverId);

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        record.setStatus(OvertimeStatus.APPROVED);
        record.setApprovedBy(approver);
        record.setApprovedAt(LocalDateTime.now());
        record = overtimeRecordRepository.save(record);

        notificationService.notifyApprovalGranted(record.getEmployee().getId(), "Overtime",
                record.getHours() + " hours on " + record.getDate());
        auditLogService.saveLog(approverId, "APPROVE", "OVERTIME", recordId, "Approved overtime");
        return record;
    }

    public OvertimeRecord reject(String recordId, String approverId) {
        OvertimeRecord record = overtimeRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Overtime record not found: " + recordId));

        validateManagerAccess(record.getEmployee().getId(), approverId);

        record.setStatus(OvertimeStatus.REJECTED);
        record = overtimeRecordRepository.save(record);

        notificationService.notifyApprovalDenied(record.getEmployee().getId(), "Overtime",
                record.getHours() + " hours", null);
        auditLogService.saveLog(approverId, "REJECT", "OVERTIME", recordId, "Rejected overtime");
        return record;
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

    @Transactional(readOnly = true)
    public List<OvertimeRecord> getByEmployee(String employeeId) {
        return overtimeRecordRepository.findByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public List<OvertimeRecord> getPending() {
        List<OvertimeRecord> records = overtimeRecordRepository.findByStatus(OvertimeStatus.PENDING);
        return scopeToCallerIfLineManager(records);
    }

    private List<OvertimeRecord> scopeToCallerIfLineManager(List<OvertimeRecord> records) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return records;

        boolean isLineManager = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LINE_MANAGER"));
        boolean isAdminOrHr = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_HR_MANAGER"));

        if (!isLineManager || isAdminOrHr) return records;

        String callerEmployeeId = resolveCallerEmployeeId(auth);
        if (callerEmployeeId == null) return List.of();

        return records.stream()
                .filter(r -> r.getEmployee() != null
                        && r.getEmployee().getReportingManager() != null
                        && callerEmployeeId.equals(r.getEmployee().getReportingManager().getId()))
                .collect(Collectors.toList());
    }

    private String resolveCallerEmployeeId(Authentication auth) {
        String username = auth.getName();
        if (username == null) return null;
        return userRepository.findByUsername(username)
                .map(u -> u.getEmail())
                .flatMap(employeeRepository::findByEmail)
                .map(Employee::getId)
                .orElse(null);
    }
}
