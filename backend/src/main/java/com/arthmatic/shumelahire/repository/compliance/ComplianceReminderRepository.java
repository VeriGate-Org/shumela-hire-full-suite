package com.arthmatic.shumelahire.repository.compliance;

import com.arthmatic.shumelahire.entity.compliance.ComplianceReminder;
import com.arthmatic.shumelahire.entity.compliance.ReminderStatus;
import com.arthmatic.shumelahire.entity.compliance.ReminderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ComplianceReminderRepository extends JpaRepository<ComplianceReminder, Long> {

    Page<ComplianceReminder> findByStatus(ReminderStatus status, Pageable pageable);

    Page<ComplianceReminder> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<ComplianceReminder> findByReminderType(ReminderType reminderType, Pageable pageable);

    @Query("SELECT cr FROM ComplianceReminder cr WHERE cr.dueDate <= :date AND cr.status = 'PENDING'")
    List<ComplianceReminder> findDueReminders(@Param("date") LocalDate date);

    @Query("SELECT cr FROM ComplianceReminder cr WHERE cr.dueDate < :date AND cr.status IN ('PENDING', 'SENT')")
    List<ComplianceReminder> findOverdueReminders(@Param("date") LocalDate date);

    @Query("SELECT cr FROM ComplianceReminder cr WHERE cr.dueDate BETWEEN :startDate AND :endDate AND cr.status = 'PENDING'")
    List<ComplianceReminder> findUpcomingReminders(@Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);

    long countByStatus(ReminderStatus status);
}
