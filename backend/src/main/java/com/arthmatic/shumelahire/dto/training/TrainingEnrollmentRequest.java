package com.arthmatic.shumelahire.dto.training;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TrainingEnrollmentRequest {

    @NotNull
    private String sessionId;

    @NotNull
    private String employeeId;

    private String status;
    private BigDecimal score;
    private String certificateUrl;

    public TrainingEnrollmentRequest() {}

    // Getters and Setters
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }
}
