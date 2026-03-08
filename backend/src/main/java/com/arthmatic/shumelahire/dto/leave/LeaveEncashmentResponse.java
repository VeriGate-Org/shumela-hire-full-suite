package com.arthmatic.shumelahire.dto.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeaveEncashmentResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeName;
    private BigDecimal days;
    private BigDecimal ratePerDay;
    private BigDecimal totalAmount;
    private String status;
    private String reason;
    private LocalDateTime requestedAt;
    private Long hrApprovedById;
    private String hrApprovedByName;
    private LocalDateTime hrApprovedAt;
    private Long financeApprovedById;
    private String financeApprovedByName;
    private LocalDateTime financeApprovedAt;
    private String decisionComment;
    private Integer cycleYear;

    public LeaveEncashmentResponse() {}

    public static LeaveEncashmentResponse fromEntity(LeaveEncashmentRequest entity) {
        LeaveEncashmentResponse r = new LeaveEncashmentResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee().getId();
        r.employeeName = entity.getEmployee().getFullName();
        r.leaveTypeId = entity.getLeaveType().getId();
        r.leaveTypeName = entity.getLeaveType().getName();
        r.days = entity.getDays();
        r.ratePerDay = entity.getRatePerDay();
        r.totalAmount = entity.getTotalAmount();
        r.status = entity.getStatus().name();
        r.reason = entity.getReason();
        r.requestedAt = entity.getRequestedAt();
        r.hrApprovedById = entity.getHrApprovedBy() != null ? entity.getHrApprovedBy().getId() : null;
        r.hrApprovedByName = entity.getHrApprovedBy() != null ? entity.getHrApprovedBy().getFullName() : null;
        r.hrApprovedAt = entity.getHrApprovedAt();
        r.financeApprovedById = entity.getFinanceApprovedBy() != null ? entity.getFinanceApprovedBy().getId() : null;
        r.financeApprovedByName = entity.getFinanceApprovedBy() != null ? entity.getFinanceApprovedBy().getFullName() : null;
        r.financeApprovedAt = entity.getFinanceApprovedAt();
        r.decisionComment = entity.getDecisionComment();
        r.cycleYear = entity.getCycleYear();
        return r;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }
    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }
    public BigDecimal getDays() { return days; }
    public void setDays(BigDecimal days) { this.days = days; }
    public BigDecimal getRatePerDay() { return ratePerDay; }
    public void setRatePerDay(BigDecimal ratePerDay) { this.ratePerDay = ratePerDay; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
    public Long getHrApprovedById() { return hrApprovedById; }
    public void setHrApprovedById(Long hrApprovedById) { this.hrApprovedById = hrApprovedById; }
    public String getHrApprovedByName() { return hrApprovedByName; }
    public void setHrApprovedByName(String hrApprovedByName) { this.hrApprovedByName = hrApprovedByName; }
    public LocalDateTime getHrApprovedAt() { return hrApprovedAt; }
    public void setHrApprovedAt(LocalDateTime hrApprovedAt) { this.hrApprovedAt = hrApprovedAt; }
    public Long getFinanceApprovedById() { return financeApprovedById; }
    public void setFinanceApprovedById(Long financeApprovedById) { this.financeApprovedById = financeApprovedById; }
    public String getFinanceApprovedByName() { return financeApprovedByName; }
    public void setFinanceApprovedByName(String financeApprovedByName) { this.financeApprovedByName = financeApprovedByName; }
    public LocalDateTime getFinanceApprovedAt() { return financeApprovedAt; }
    public void setFinanceApprovedAt(LocalDateTime financeApprovedAt) { this.financeApprovedAt = financeApprovedAt; }
    public String getDecisionComment() { return decisionComment; }
    public void setDecisionComment(String decisionComment) { this.decisionComment = decisionComment; }
    public Integer getCycleYear() { return cycleYear; }
    public void setCycleYear(Integer cycleYear) { this.cycleYear = cycleYear; }
}
