package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balances",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_leave_balance_unique",
           columnNames = {"tenant_id", "employee_id", "leave_type_id", "cycle_year"}))
public class LeaveBalance extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @NotNull
    @Column(name = "cycle_year", nullable = false)
    private Integer cycleYear;

    @Column(name = "entitled_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal entitledDays = BigDecimal.ZERO;

    @Column(name = "taken_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal takenDays = BigDecimal.ZERO;

    @Column(name = "pending_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal pendingDays = BigDecimal.ZERO;

    @Column(name = "carried_forward_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal carriedForwardDays = BigDecimal.ZERO;

    @Column(name = "adjustment_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal adjustmentDays = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public BigDecimal getAvailableDays() {
        return entitledDays
                .add(carriedForwardDays)
                .add(adjustmentDays)
                .subtract(takenDays)
                .subtract(pendingDays);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public Integer getCycleYear() { return cycleYear; }
    public void setCycleYear(Integer cycleYear) { this.cycleYear = cycleYear; }

    public BigDecimal getEntitledDays() { return entitledDays; }
    public void setEntitledDays(BigDecimal entitledDays) { this.entitledDays = entitledDays; }

    public BigDecimal getTakenDays() { return takenDays; }
    public void setTakenDays(BigDecimal takenDays) { this.takenDays = takenDays; }

    public BigDecimal getPendingDays() { return pendingDays; }
    public void setPendingDays(BigDecimal pendingDays) { this.pendingDays = pendingDays; }

    public BigDecimal getCarriedForwardDays() { return carriedForwardDays; }
    public void setCarriedForwardDays(BigDecimal carriedForwardDays) { this.carriedForwardDays = carriedForwardDays; }

    public BigDecimal getAdjustmentDays() { return adjustmentDays; }
    public void setAdjustmentDays(BigDecimal adjustmentDays) { this.adjustmentDays = adjustmentDays; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
