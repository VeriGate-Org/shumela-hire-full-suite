package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.OvertimeRecord;
import com.arthmatic.shumelahire.entity.attendance.OvertimeStatus;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.OvertimeRecordDataRepository;
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
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    public OvertimeRecord submit(Long employeeId, LocalDate date, BigDecimal hours, String reason) {
        Employee employee = employeeRepository.findById(String.valueOf(employeeId))
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

        auditLogService.saveLog(employeeId.toString(), "SUBMIT", "OVERTIME",
                record.getId().toString(), "Submitted overtime: " + hours + " hours on " + date);
        return record;
    }

    public OvertimeRecord approve(Long recordId, Long approverId) {
        OvertimeRecord record = overtimeRecordRepository.findById(String.valueOf(recordId))
                .orElseThrow(() -> new IllegalArgumentException("Overtime record not found: " + recordId));

        validateManagerAccess(record.getEmployee().getId(), approverId);

        Employee approver = employeeRepository.findById(String.valueOf(approverId))
                .orElseThrow(() -> new IllegalArgumentException("Approver not found: " + approverId));

        record.setStatus(OvertimeStatus.APPROVED);
        record.setApprovedBy(approver);
        record.setApprovedAt(LocalDateTime.now());
        record = overtimeRecordRepository.save(record);

        notificationService.notifyApprovalGranted(record.getEmployee().getId(), "Overtime",
                record.getHours() + " hours on " + record.getDate());
        auditLogService.saveLog(approverId.toString(), "APPROVE", "OVERTIME", recordId.toString(), "Approved overtime");
        return record;
    }

    public OvertimeRecord reject(Long recordId, Long approverId) {
        OvertimeRecord record = overtimeRecordRepository.findById(String.valueOf(recordId))
                .orElseThrow(() -> new IllegalArgumentException("Overtime record not found: " + recordId));

        validateManagerAccess(record.getEmployee().getId(), approverId);

        record.setStatus(OvertimeStatus.REJECTED);
        record = overtimeRecordRepository.save(record);

        notificationService.notifyApprovalDenied(record.getEmployee().getId(), "Overtime",
                record.getHours() + " hours", null);
        auditLogService.saveLog(approverId.toString(), "REJECT", "OVERTIME", recordId.toString(), "Rejected overtime");
        return record;
    }

    private void validateManagerAccess(Long employeeId, Long approverId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isLineManager = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LINE_MANAGER"));

        if (isLineManager) {
            Employee employee = employeeRepository.findById(String.valueOf(employeeId))
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
            if (employee.getReportingManager() == null ||
                    !employee.getReportingManager().getId().equals(approverId)) {
                throw new AccessDeniedException("You can only approve requests for your direct reports");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<OvertimeRecord> getByEmployee(Long employeeId) {
        return overtimeRecordRepository.findByEmployeeId(String.valueOf(employeeId));
    }

    @Transactional(readOnly = true)
    public List<OvertimeRecord> getPending() {
        return overtimeRecordRepository.findByStatus(OvertimeStatus.PENDING);
    }
}
