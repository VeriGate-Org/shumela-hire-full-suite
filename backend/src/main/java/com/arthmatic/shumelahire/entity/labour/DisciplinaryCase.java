package com.arthmatic.shumelahire.entity.labour;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DisciplinaryCase extends TenantAwareEntity {

    private Long id;

    private Employee employee;

    private OffenceCategory offenceCategory;

    private String offenceDescription;

    private LocalDate incidentDate;

    private LocalDate hearingDate;

    private DisciplinaryCaseStatus status = DisciplinaryCaseStatus.OPEN;

    private DisciplinaryOutcome outcome;

    private LocalDate outcomeDate;

    private String notes;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public OffenceCategory getOffenceCategory() { return offenceCategory; }
    public void setOffenceCategory(OffenceCategory offenceCategory) { this.offenceCategory = offenceCategory; }
    public String getOffenceDescription() { return offenceDescription; }
    public void setOffenceDescription(String offenceDescription) { this.offenceDescription = offenceDescription; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public void setIncidentDate(LocalDate incidentDate) { this.incidentDate = incidentDate; }
    public LocalDate getHearingDate() { return hearingDate; }
    public void setHearingDate(LocalDate hearingDate) { this.hearingDate = hearingDate; }
    public DisciplinaryCaseStatus getStatus() { return status; }
    public void setStatus(DisciplinaryCaseStatus status) { this.status = status; }
    public DisciplinaryOutcome getOutcome() { return outcome; }
    public void setOutcome(DisciplinaryOutcome outcome) { this.outcome = outcome; }
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
