package com.arthmatic.shumelahire.dto.labour;

import com.arthmatic.shumelahire.entity.labour.DisciplinaryCase;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DisciplinaryCaseResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String offenceCategory;
    private String offenceDescription;
    private LocalDate incidentDate;
    private LocalDate hearingDate;
    private String status;
    private String outcome;
    private LocalDate outcomeDate;
    private String notes;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DisciplinaryCaseResponse() {}

    public static DisciplinaryCaseResponse fromEntity(DisciplinaryCase entity) {
        DisciplinaryCaseResponse r = new DisciplinaryCaseResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.offenceCategory = entity.getOffenceCategory() != null ? entity.getOffenceCategory().name() : null;
        r.offenceDescription = entity.getOffenceDescription();
        r.incidentDate = entity.getIncidentDate();
        r.hearingDate = entity.getHearingDate();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.outcome = entity.getOutcome() != null ? entity.getOutcome().name() : null;
        r.outcomeDate = entity.getOutcomeDate();
        r.notes = entity.getNotes();
        r.createdBy = entity.getCreatedBy();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getOffenceCategory() { return offenceCategory; }
    public void setOffenceCategory(String offenceCategory) { this.offenceCategory = offenceCategory; }
    public String getOffenceDescription() { return offenceDescription; }
    public void setOffenceDescription(String offenceDescription) { this.offenceDescription = offenceDescription; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public void setIncidentDate(LocalDate incidentDate) { this.incidentDate = incidentDate; }
    public LocalDate getHearingDate() { return hearingDate; }
    public void setHearingDate(LocalDate hearingDate) { this.hearingDate = hearingDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public LocalDate getOutcomeDate() { return outcomeDate; }
    public void setOutcomeDate(LocalDate outcomeDate) { this.outcomeDate = outcomeDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
