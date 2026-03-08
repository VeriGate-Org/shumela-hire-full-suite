package com.arthmatic.shumelahire.controller.compliance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.compliance.ComplianceReminderResponse;
import com.arthmatic.shumelahire.service.compliance.ComplianceReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance/reminders")
@FeatureGate("COMPLIANCE_REMINDERS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class ComplianceReminderController {

    @Autowired
    private ComplianceReminderService reminderService;

    @PostMapping
    public ResponseEntity<?> createReminder(
            @RequestParam String reminderType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate) {
        try {
            ComplianceReminderResponse reminder = reminderService.createReminder(
                    reminderType, entityType, entityId, employeeId, title, description, dueDate);
            return ResponseEntity.status(HttpStatus.CREATED).body(reminder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReminder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reminderService.getReminder(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<Page<ComplianceReminderResponse>> getReminders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        if (status != null) {
            return ResponseEntity.ok(reminderService.getRemindersByStatus(status, pageRequest));
        }
        if (employeeId != null) {
            return ResponseEntity.ok(reminderService.getRemindersByEmployee(employeeId, pageRequest));
        }
        return ResponseEntity.ok(reminderService.getAllReminders(pageRequest));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<ComplianceReminderResponse>> getUpcomingReminders(
            @RequestParam(defaultValue = "30") int daysAhead) {
        return ResponseEntity.ok(reminderService.getUpcomingReminders(daysAhead));
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeReminder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reminderService.acknowledge(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getReminderStats() {
        return ResponseEntity.ok(reminderService.getReminderStats());
    }
}
