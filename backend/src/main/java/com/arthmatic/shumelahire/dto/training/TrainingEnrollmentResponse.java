package com.arthmatic.shumelahire.dto.training;

import com.arthmatic.shumelahire.entity.training.TrainingEnrollment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TrainingEnrollmentResponse {

    private Long id;
    private Long sessionId;
    private String courseTitle;
    private String courseCode;
    private Long employeeId;
    private String employeeName;
    private String status;
    private BigDecimal score;
    private String certificateUrl;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
    private LocalDateTime sessionStartDate;
    private LocalDateTime sessionEndDate;
    private LocalDateTime createdAt;

    public TrainingEnrollmentResponse() {}

    public static TrainingEnrollmentResponse fromEntity(TrainingEnrollment entity) {
        TrainingEnrollmentResponse r = new TrainingEnrollmentResponse();
        r.id = entity.getId();
        r.sessionId = entity.getSession() != null ? entity.getSession().getId() : null;
        if (entity.getSession() != null && entity.getSession().getCourse() != null) {
            r.courseTitle = entity.getSession().getCourse().getTitle();
            r.courseCode = entity.getSession().getCourse().getCode();
        }
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ? entity.getEmployee().getFullName() : null;
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.score = entity.getScore();
        r.certificateUrl = entity.getCertificateUrl();
        r.enrolledAt = entity.getEnrolledAt();
        r.completedAt = entity.getCompletedAt();
        if (entity.getSession() != null) {
            r.sessionStartDate = entity.getSession().getStartDate();
            r.sessionEndDate = entity.getSession().getEndDate();
        }
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getSessionStartDate() { return sessionStartDate; }
    public void setSessionStartDate(LocalDateTime sessionStartDate) { this.sessionStartDate = sessionStartDate; }

    public LocalDateTime getSessionEndDate() { return sessionEndDate; }
    public void setSessionEndDate(LocalDateTime sessionEndDate) { this.sessionEndDate = sessionEndDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
