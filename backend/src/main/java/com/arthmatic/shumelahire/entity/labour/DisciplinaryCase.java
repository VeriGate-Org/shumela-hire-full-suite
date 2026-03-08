package com.arthmatic.shumelahire.entity.labour;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "disciplinary_cases")
public class DisciplinaryCase extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "offence_category", nullable = false, length = 20)
    private OffenceCategory offenceCategory;

    @Column(name = "offence_description", columnDefinition = "TEXT", nullable = false)
    private String offenceDescription;

    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(name = "hearing_date")
    private LocalDate hearingDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DisciplinaryCaseStatus status = DisciplinaryCaseStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private DisciplinaryOutcome outcome;

    @Column(name = "outcome_date")
    private LocalDate outcomeDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
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
