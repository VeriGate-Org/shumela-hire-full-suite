package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmploymentEvent extends TenantAwareEntity {

    private String id;

    @NotNull
    private Employee employee;

    @NotNull
    private EmploymentEventType eventType;

    @NotNull
    private LocalDate eventDate;

    @NotNull
    private LocalDate effectiveDate;

    private String description;

    private String notes;

    // Before/after snapshots
    private String previousDepartment;

    private String newDepartment;

    private String previousJobTitle;

    private String newJobTitle;

    private String previousJobGrade;

    private String newJobGrade;

    private String previousReportingManagerId;

    private String newReportingManagerId;

    private String previousLocation;

    private String newLocation;

    private String recordedBy;

    private LocalDateTime createdAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public EmploymentEventType getEventType() { return eventType; }
    public void setEventType(EmploymentEventType eventType) { this.eventType = eventType; }

    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPreviousDepartment() { return previousDepartment; }
    public void setPreviousDepartment(String previousDepartment) { this.previousDepartment = previousDepartment; }

    public String getNewDepartment() { return newDepartment; }
    public void setNewDepartment(String newDepartment) { this.newDepartment = newDepartment; }

    public String getPreviousJobTitle() { return previousJobTitle; }
    public void setPreviousJobTitle(String previousJobTitle) { this.previousJobTitle = previousJobTitle; }

    public String getNewJobTitle() { return newJobTitle; }
    public void setNewJobTitle(String newJobTitle) { this.newJobTitle = newJobTitle; }

    public String getPreviousJobGrade() { return previousJobGrade; }
    public void setPreviousJobGrade(String previousJobGrade) { this.previousJobGrade = previousJobGrade; }

    public String getNewJobGrade() { return newJobGrade; }
    public void setNewJobGrade(String newJobGrade) { this.newJobGrade = newJobGrade; }

    public String getPreviousReportingManagerId() { return previousReportingManagerId; }
    public void setPreviousReportingManagerId(String previousReportingManagerId) { this.previousReportingManagerId = previousReportingManagerId; }

    public String getNewReportingManagerId() { return newReportingManagerId; }
    public void setNewReportingManagerId(String newReportingManagerId) { this.newReportingManagerId = newReportingManagerId; }

    public String getPreviousLocation() { return previousLocation; }
    public void setPreviousLocation(String previousLocation) { this.previousLocation = previousLocation; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
