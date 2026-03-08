package com.arthmatic.shumelahire.service.compliance;

import com.arthmatic.shumelahire.dto.compliance.ComplianceReminderResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.compliance.ComplianceReminder;
import com.arthmatic.shumelahire.entity.compliance.ReminderStatus;
import com.arthmatic.shumelahire.entity.compliance.ReminderType;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.compliance.ComplianceReminderRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplianceReminderService {

    private static final Logger logger = LoggerFactory.getLogger(ComplianceReminderService.class);

    @Autowired
    private ComplianceReminderRepository reminderRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    public ComplianceReminderResponse createReminder(String reminderType, String entityType,
                                                      Long entityId, Long employeeId,
                                                      String title, String description,
                                                      LocalDate dueDate) {
        ComplianceReminder reminder = new ComplianceReminder();
        reminder.setReminderType(ReminderType.valueOf(reminderType));
        reminder.setEntityType(entityType);
        reminder.setEntityId(entityId);
        reminder.setTitle(title);
        reminder.setDescription(description);
        reminder.setDueDate(dueDate);
        reminder.setStatus(ReminderStatus.PENDING);

        if (employeeId != null) {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            reminder.setEmployee(employee);
        }

        reminder = reminderRepository.save(reminder);

        auditLogService.saveLog("SYSTEM", "CREATE", "COMPLIANCE_REMINDER",
                reminder.getId().toString(), "Created reminder: " + title);
        logger.info("Compliance reminder created: {} due {}", title, dueDate);

        return ComplianceReminderResponse.fromEntity(reminder);
    }

    @Transactional(readOnly = true)
    public ComplianceReminderResponse getReminder(Long id) {
        ComplianceReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found: " + id));
        return ComplianceReminderResponse.fromEntity(reminder);
    }

    @Transactional(readOnly = true)
    public Page<ComplianceReminderResponse> getAllReminders(Pageable pageable) {
        return reminderRepository.findAll(pageable).map(ComplianceReminderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ComplianceReminderResponse> getRemindersByStatus(String status, Pageable pageable) {
        return reminderRepository.findByStatus(ReminderStatus.valueOf(status), pageable)
                .map(ComplianceReminderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ComplianceReminderResponse> getRemindersByEmployee(Long employeeId, Pageable pageable) {
        return reminderRepository.findByEmployeeId(employeeId, pageable)
                .map(ComplianceReminderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ComplianceReminderResponse> getUpcomingReminders(int daysAhead) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(daysAhead);
        return reminderRepository.findUpcomingReminders(startDate, endDate).stream()
                .map(ComplianceReminderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ComplianceReminderResponse acknowledge(Long id) {
        ComplianceReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found: " + id));

        reminder.setStatus(ReminderStatus.ACKNOWLEDGED);
        reminder.setAcknowledgedAt(LocalDateTime.now());
        reminder = reminderRepository.save(reminder);

        auditLogService.saveLog("SYSTEM", "ACKNOWLEDGE", "COMPLIANCE_REMINDER",
                id.toString(), "Acknowledged reminder: " + reminder.getTitle());
        return ComplianceReminderResponse.fromEntity(reminder);
    }

    public void markAsSent(Long id) {
        ComplianceReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found: " + id));

        reminder.setStatus(ReminderStatus.SENT);
        reminder.setSentAt(LocalDateTime.now());
        reminderRepository.save(reminder);
    }

    public void markOverdue(Long id) {
        ComplianceReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found: " + id));

        reminder.setStatus(ReminderStatus.OVERDUE);
        reminderRepository.save(reminder);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReminderStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", reminderRepository.countByStatus(ReminderStatus.PENDING));
        stats.put("sent", reminderRepository.countByStatus(ReminderStatus.SENT));
        stats.put("acknowledged", reminderRepository.countByStatus(ReminderStatus.ACKNOWLEDGED));
        stats.put("overdue", reminderRepository.countByStatus(ReminderStatus.OVERDUE));
        stats.put("total", reminderRepository.count());
        return stats;
    }
}
