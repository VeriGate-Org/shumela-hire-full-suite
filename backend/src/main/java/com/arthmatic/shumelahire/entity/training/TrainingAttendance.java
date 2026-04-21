package com.arthmatic.shumelahire.entity.training;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class TrainingAttendance extends TenantAwareEntity {

    private Long id;

    @NotNull
    private Long sessionId;

    private Long enrollmentId;

    @NotNull
    private Long employeeId;

    private Boolean attended = false;

    private LocalDateTime checkInTime;

    private String notes;

    private LocalDateTime createdAt;

    public TrainingAttendance() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public Long getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(Long enrollmentId) { this.enrollmentId = enrollmentId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Boolean getAttended() { return attended; }
    public void setAttended(Boolean attended) { this.attended = attended; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
