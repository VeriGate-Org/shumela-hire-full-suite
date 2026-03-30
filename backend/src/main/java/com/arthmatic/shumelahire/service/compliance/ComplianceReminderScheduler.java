package com.arthmatic.shumelahire.service.compliance;

import com.arthmatic.shumelahire.entity.compliance.ComplianceReminder;
import com.arthmatic.shumelahire.entity.compliance.ReminderStatus;
import com.arthmatic.shumelahire.repository.ComplianceReminderDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ComplianceReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ComplianceReminderScheduler.class);

    @Autowired
    private ComplianceReminderDataRepository reminderRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Runs daily at 8:00 AM to process due reminders.
     * Sends notifications for reminders that are due today or earlier.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void processDueReminders() {
        logger.info("Processing due compliance reminders...");

        LocalDate today = LocalDate.now();

        // Find pending reminders that are due
        List<ComplianceReminder> dueReminders = reminderRepository.findDueReminders(today);

        for (ComplianceReminder reminder : dueReminders) {
            try {
                reminder.setStatus(ReminderStatus.SENT);
                reminder.setSentAt(LocalDateTime.now());
                reminderRepository.save(reminder);

                logger.info("Sent compliance reminder: {} for employee {}",
                        reminder.getTitle(),
                        reminder.getEmployee() != null ? reminder.getEmployee().getId() : "N/A");
            } catch (Exception e) {
                logger.error("Failed to process reminder {}: {}", reminder.getId(), e.getMessage());
            }
        }

        logger.info("Processed {} due compliance reminders", dueReminders.size());
    }

    /**
     * Runs daily at 9:00 AM to mark overdue reminders.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void markOverdueReminders() {
        logger.info("Checking for overdue compliance reminders...");

        LocalDate today = LocalDate.now();
        List<ComplianceReminder> overdueReminders = reminderRepository.findOverdueReminders(today);

        int count = 0;
        for (ComplianceReminder reminder : overdueReminders) {
            if (reminder.getDueDate().isBefore(today)) {
                reminder.setStatus(ReminderStatus.OVERDUE);
                reminderRepository.save(reminder);
                count++;

                logger.warn("Compliance reminder overdue: {} (due: {})",
                        reminder.getTitle(), reminder.getDueDate());
            }
        }

        if (count > 0) {
            auditLogService.logSystemAction("MARK_OVERDUE", "COMPLIANCE_REMINDER",
                    "Marked " + count + " compliance reminders as overdue");
        }

        logger.info("Marked {} compliance reminders as overdue", count);
    }

    /**
     * Runs weekly on Monday at 7:00 AM to scan for upcoming expiries in the next 30 days.
     */
    @Scheduled(cron = "0 0 7 * * MON")
    @Transactional
    public void scanUpcomingExpiries() {
        logger.info("Scanning for upcoming compliance expiries...");

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(30);

        List<ComplianceReminder> upcoming = reminderRepository.findUpcomingReminders(startDate, endDate);

        logger.info("Found {} upcoming compliance reminders in the next 30 days", upcoming.size());

        if (!upcoming.isEmpty()) {
            auditLogService.logSystemAction("SCAN_UPCOMING", "COMPLIANCE_REMINDER",
                    "Found " + upcoming.size() + " upcoming compliance reminders");
        }
    }
}
