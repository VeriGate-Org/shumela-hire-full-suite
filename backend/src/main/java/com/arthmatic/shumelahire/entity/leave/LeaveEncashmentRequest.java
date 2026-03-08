package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_encashment_requests")
public class LeaveEncashmentRequest extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal days;

    @Column(name = "rate_per_day", nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerDay;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveEncashmentStatus status = LeaveEncashmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hr_approved_by")
    private Employee hrApprovedBy;

    @Column(name = "hr_approved_at")
    private LocalDateTime hrApprovedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finance_approved_by")
    private Employee financeApprovedBy;

    @Column(name = "finance_approved_at")
    private LocalDateTime financeApprovedAt;

    @Column(name = "decision_comment", columnDefinition = "TEXT")
    private String decisionComment;

    @Column(name = "cycle_year", nullable = false)
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
