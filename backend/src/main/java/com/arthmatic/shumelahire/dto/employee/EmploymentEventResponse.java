package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.entity.EmploymentEventType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmploymentEventResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private EmploymentEventType eventType;
    private LocalDate eventDate;
    private LocalDate effectiveDate;
    private String description;
    private String notes;
    private String previousDepartment;
    private String newDepartment;
    private String previousJobTitle;
    private String newJobTitle;
    private String previousJobGrade;
    private String newJobGrade;
    private Long previousReportingManagerId;
    private Long newReportingManagerId;
    private String previousLocation;
    private String newLocation;
    private String recordedBy;
    private LocalDateTime createdAt;

    public EmploymentEventResponse() {}

    public static EmploymentEventResponse fromEntity(EmploymentEvent event) {
        EmploymentEventResponse response = new EmploymentEventResponse();
        response.setId(event.getId());
        response.setEmployeeId(event.getEmployee().getId());
        response.setEmployeeName(event.getEmployee().getFullName());
        response.setEventType(event.getEventType());
        response.setEventDate(event.getEventDate());
        response.setEffectiveDate(event.getEffectiveDate());
        response.setDescription(event.getDescription());
        response.setNotes(event.getNotes());
        response.setPreviousDepartment(event.getPreviousDepartment());
        response.setNewDepartment(event.getNewDepartment());
        response.setPreviousJobTitle(event.getPreviousJobTitle());
        response.setNewJobTitle(event.getNewJobTitle());
        response.setPreviousJobGrade(event.getPreviousJobGrade());
        response.setNewJobGrade(event.getNewJobGrade());
        response.setPreviousReportingManagerId(event.getPreviousReportingManagerId());
        response.setNewReportingManagerId(event.getNewReportingManagerId());
        response.setPreviousLocation(event.getPreviousLocation());
        response.setNewLocation(event.getNewLocation());
        response.setRecordedBy(event.getRecordedBy());
        response.setCreatedAt(event.getCreatedAt());
        return response;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

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

    public Long getPreviousReportingManagerId() { return previousReportingManagerId; }
    public void setPreviousReportingManagerId(Long previousReportingManagerId) { this.previousReportingManagerId = previousReportingManagerId; }

    public Long getNewReportingManagerId() { return newReportingManagerId; }
    public void setNewReportingManagerId(Long newReportingManagerId) { this.newReportingManagerId = newReportingManagerId; }

    public String getPreviousLocation() { return previousLocation; }
    public void setPreviousLocation(String previousLocation) { this.previousLocation = previousLocation; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
