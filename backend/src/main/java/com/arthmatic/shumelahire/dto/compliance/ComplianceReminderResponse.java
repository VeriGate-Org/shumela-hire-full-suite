package com.arthmatic.shumelahire.dto.compliance;

import com.arthmatic.shumelahire.entity.compliance.ComplianceReminder;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ComplianceReminderResponse {

    private Long id;
    private String reminderType;
    private String entityType;
    private Long entityId;
    private Long employeeId;
    private String employeeName;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime sentAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ComplianceReminderResponse() {}

    public static ComplianceReminderResponse fromEntity(ComplianceReminder entity) {
        ComplianceReminderResponse r = new ComplianceReminderResponse();
        r.id = entity.getId();
        r.reminderType = entity.getReminderType() != null ? entity.getReminderType().name() : null;
        r.entityType = entity.getEntityType();
        r.entityId = entity.getEntityId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.title = entity.getTitle();
        r.description = entity.getDescription();
        r.dueDate = entity.getDueDate();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.sentAt = entity.getSentAt();
        r.acknowledgedAt = entity.getAcknowledgedAt();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
