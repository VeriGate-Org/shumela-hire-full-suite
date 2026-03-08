package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.OvertimeRecord;
import com.arthmatic.shumelahire.entity.attendance.OvertimeStatus;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.attendance.OvertimeRecordRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional
public class OvertimeService {

    private static final Logger logger = LoggerFactory.getLogger(OvertimeService.class);

    @Autowired
    private OvertimeRecordRepository overtimeRecordRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    public OvertimeRecord submit(Long employeeId, LocalDate date, BigDecimal hours, String reason) {
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

        auditLogService.saveLog(employeeId.toString(), "SUBMIT", "OVERTIME",
                record.getId().toString(), "Submitted overtime: " + hours + " hours on " + date);
        return record;
    }

    public OvertimeRecord approve(Long recordId, Long approverId) {
        OvertimeRecord record = overtimeRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Overtime record not found: " + recordId));
        Employee approver = employeeRepository.findById(approverId)
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
        OvertimeRecord record = overtimeRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Overtime record not found: " + recordId));
        record.setStatus(OvertimeStatus.REJECTED);
        record = overtimeRecordRepository.save(record);

        notificationService.notifyApprovalDenied(record.getEmployee().getId(), "Overtime",
                record.getHours() + " hours", null);
        auditLogService.saveLog(approverId.toString(), "REJECT", "OVERTIME", recordId.toString(), "Rejected overtime");
        return record;
    }

    @Transactional(readOnly = true)
    public Page<OvertimeRecord> getByEmployee(Long employeeId, Pageable pageable) {
        return overtimeRecordRepository.findByEmployeeId(employeeId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<OvertimeRecord> getPending(Pageable pageable) {
        return overtimeRecordRepository.findByStatus(OvertimeStatus.PENDING, pageable);
    }
}
