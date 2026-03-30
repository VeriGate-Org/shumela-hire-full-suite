package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.compliance.ComplianceReminder;
import com.arthmatic.shumelahire.entity.compliance.ReminderStatus;
import com.arthmatic.shumelahire.entity.compliance.ReminderType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ComplianceReminderDataRepository {
    Optional<ComplianceReminder> findById(String id);
    ComplianceReminder save(ComplianceReminder entity);
    List<ComplianceReminder> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<ComplianceReminder> findByStatus(ReminderStatus status);
    List<ComplianceReminder> findByEmployeeId(String employeeId);
    List<ComplianceReminder> findByReminderType(ReminderType reminderType);
    List<ComplianceReminder> findDueReminders(LocalDate date);
    List<ComplianceReminder> findOverdueReminders(LocalDate date);
    List<ComplianceReminder> findUpcomingReminders(LocalDate startDate, LocalDate endDate);
    long countByStatus(ReminderStatus status);
}
