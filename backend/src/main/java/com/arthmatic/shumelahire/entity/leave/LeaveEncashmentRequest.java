package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeaveEncashmentRequest extends TenantAwareEntity {

    private Long id;

    private Employee employee;

    private LeaveType leaveType;

    private BigDecimal days;

    private BigDecimal ratePerDay;

    private BigDecimal totalAmount;

    private LeaveEncashmentStatus status = LeaveEncashmentStatus.PENDING;

    private String reason;

    private LocalDateTime requestedAt;

    private Employee hrApprovedBy;

    private LocalDateTime hrApprovedAt;

    private Employee financeApprovedBy;

    private LocalDateTime financeApprovedAt;

    private String decisionComment;

    private Integer cycleYear;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public BigDecimal getDays() { return days; }
    public void setDays(BigDecimal days) { this.days = days; }

    public BigDecimal getRatePerDay() { return ratePerDay; }
    public void setRatePerDay(BigDecimal ratePerDay) { this.ratePerDay = ratePerDay; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public LeaveEncashmentStatus getStatus() { return status; }
    public void setStatus(LeaveEncashmentStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public Employee getHrApprovedBy() { return hrApprovedBy; }
    public void setHrApprovedBy(Employee hrApprovedBy) { this.hrApprovedBy = hrApprovedBy; }

    public LocalDateTime getHrApprovedAt() { return hrApprovedAt; }
    public void setHrApprovedAt(LocalDateTime hrApprovedAt) { this.hrApprovedAt = hrApprovedAt; }

    public Employee getFinanceApprovedBy() { return financeApprovedBy; }
    public void setFinanceApprovedBy(Employee financeApprovedBy) { this.financeApprovedBy = financeApprovedBy; }

    public LocalDateTime getFinanceApprovedAt() { return financeApprovedAt; }
    public void setFinanceApprovedAt(LocalDateTime financeApprovedAt) { this.financeApprovedAt = financeApprovedAt; }

    public String getDecisionComment() { return decisionComment; }
    public void setDecisionComment(String decisionComment) { this.decisionComment = decisionComment; }

    public Integer getCycleYear() { return cycleYear; }
    public void setCycleYear(Integer cycleYear) { this.cycleYear = cycleYear; }
}
