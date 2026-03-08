package com.arthmatic.shumelahire.dto.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveRequestResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeDepartment;
    private Long leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private String colorCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private Boolean isHalfDay;
    private String halfDayPeriod;
    private String reason;
    private String medicalCertificateUrl;
    private String status;
    private Long approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LeaveRequestResponse() {}

    public static LeaveRequestResponse fromEntity(LeaveRequest entity) {
        LeaveRequestResponse r = new LeaveRequestResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee().getId();
        r.employeeName = entity.getEmployee().getFullName();
        r.employeeDepartment = entity.getEmployee().getDepartment();
        r.leaveTypeId = entity.getLeaveType().getId();
        r.leaveTypeName = entity.getLeaveType().getName();
        r.leaveTypeCode = entity.getLeaveType().getCode();
        r.colorCode = entity.getLeaveType().getColorCode();
        r.startDate = entity.getStartDate();
        r.endDate = entity.getEndDate();
        r.totalDays = entity.getTotalDays();
        r.isHalfDay = entity.getIsHalfDay();
        r.halfDayPeriod = entity.getHalfDayPeriod() != null ? entity.getHalfDayPeriod().name() : null;
        r.reason = entity.getReason();
        r.medicalCertificateUrl = entity.getMedicalCertificateUrl();
        r.status = entity.getStatus().name();
        if (entity.getApprover() != null) {
            r.approverId = entity.getApprover().getId();
            r.approverName = entity.getApprover().getFullName();
        }
        r.approvedAt = entity.getApprovedAt();
        r.rejectionReason = entity.getRejectionReason();
        r.cancelledAt = entity.getCancelledAt();
        r.cancellationReason = entity.getCancellationReason();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeDepartment() { return employeeDepartment; }
    public void setEmployeeDepartment(String employeeDepartment) { this.employeeDepartment = employeeDepartment; }

    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }

    public String getLeaveTypeCode() { return leaveTypeCode; }
    public void setLeaveTypeCode(String leaveTypeCode) { this.leaveTypeCode = leaveTypeCode; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public BigDecimal getTotalDays() { return totalDays; }
    public void setTotalDays(BigDecimal totalDays) { this.totalDays = totalDays; }

    public Boolean getIsHalfDay() { return isHalfDay; }
    public void setIsHalfDay(Boolean isHalfDay) { this.isHalfDay = isHalfDay; }

    public String getHalfDayPeriod() { return halfDayPeriod; }
    public void setHalfDayPeriod(String halfDayPeriod) { this.halfDayPeriod = halfDayPeriod; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getMedicalCertificateUrl() { return medicalCertificateUrl; }
    public void setMedicalCertificateUrl(String medicalCertificateUrl) { this.medicalCertificateUrl = medicalCertificateUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getApproverId() { return approverId; }
    public void setApproverId(Long approverId) { this.approverId = approverId; }

    public String getApproverName() { return approverName; }
    public void setApproverName(String approverName) { this.approverName = approverName; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
