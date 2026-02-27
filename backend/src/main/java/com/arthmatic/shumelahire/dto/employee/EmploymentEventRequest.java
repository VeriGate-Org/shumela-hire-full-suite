package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.EmploymentEventType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class EmploymentEventRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Event type is required")
    private EmploymentEventType eventType;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;

    private String description;
    private String notes;

    // Change details
    private String newDepartment;
    private String newJobTitle;
    private String newJobGrade;
    private Long newReportingManagerId;
    private String newLocation;

    public EmploymentEventRequest() {}

    // Getters and Setters
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

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

    public String getNewDepartment() { return newDepartment; }
    public void setNewDepartment(String newDepartment) { this.newDepartment = newDepartment; }

    public String getNewJobTitle() { return newJobTitle; }
    public void setNewJobTitle(String newJobTitle) { this.newJobTitle = newJobTitle; }

    public String getNewJobGrade() { return newJobGrade; }
    public void setNewJobGrade(String newJobGrade) { this.newJobGrade = newJobGrade; }

    public Long getNewReportingManagerId() { return newReportingManagerId; }
    public void setNewReportingManagerId(Long newReportingManagerId) { this.newReportingManagerId = newReportingManagerId; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }
}
