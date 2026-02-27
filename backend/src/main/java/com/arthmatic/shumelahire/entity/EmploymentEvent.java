package com.arthmatic.shumelahire.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employment_events")
public class EmploymentEvent extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private EmploymentEventType eventType;

    @NotNull
    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @NotNull
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Before/after snapshots
    @Column(name = "previous_department", length = 200)
    private String previousDepartment;

    @Column(name = "new_department", length = 200)
    private String newDepartment;

    @Column(name = "previous_job_title", length = 200)
    private String previousJobTitle;

    @Column(name = "new_job_title", length = 200)
    private String newJobTitle;

    @Column(name = "previous_job_grade", length = 50)
    private String previousJobGrade;

    @Column(name = "new_job_grade", length = 50)
    private String newJobGrade;

    @Column(name = "previous_reporting_manager_id")
    private Long previousReportingManagerId;

    @Column(name = "new_reporting_manager_id")
    private Long newReportingManagerId;

    @Column(name = "previous_location", length = 200)
    private String previousLocation;

    @Column(name = "new_location", length = 200)
    private String newLocation;

    @Column(name = "recorded_by", length = 255)
    private String recordedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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
