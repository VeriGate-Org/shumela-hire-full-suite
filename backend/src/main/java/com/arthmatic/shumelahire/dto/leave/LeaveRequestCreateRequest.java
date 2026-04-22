package com.arthmatic.shumelahire.dto.leave;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class LeaveRequestCreateRequest {

    @NotNull(message = "Leave type ID is required")
    private Long leaveTypeId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    // BUG-004 fix: server-side validation — end date must not be before start date
    @AssertTrue(message = "End date must be on or after the start date")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) return true;
        return !endDate.isBefore(startDate);
    }

    private Boolean isHalfDay;
    private String halfDayPeriod;
    private String reason;
    private String medicalCertificateUrl;

    // Getters and Setters
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Boolean getIsHalfDay() { return isHalfDay; }
    public void setIsHalfDay(Boolean isHalfDay) { this.isHalfDay = isHalfDay; }

    public String getHalfDayPeriod() { return halfDayPeriod; }
    public void setHalfDayPeriod(String halfDayPeriod) { this.halfDayPeriod = halfDayPeriod; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getMedicalCertificateUrl() { return medicalCertificateUrl; }
    public void setMedicalCertificateUrl(String medicalCertificateUrl) { this.medicalCertificateUrl = medicalCertificateUrl; }
}
