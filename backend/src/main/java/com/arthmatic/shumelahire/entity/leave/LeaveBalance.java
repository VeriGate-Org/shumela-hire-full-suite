package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeaveBalance extends TenantAwareEntity {

    private Long id;

    private Employee employee;

    private LeaveType leaveType;

    @NotNull
    private Integer cycleYear;

    private BigDecimal entitledDays = BigDecimal.ZERO;

    private BigDecimal takenDays = BigDecimal.ZERO;

    private BigDecimal pendingDays = BigDecimal.ZERO;

    private BigDecimal carriedForwardDays = BigDecimal.ZERO;

    private BigDecimal adjustmentDays = BigDecimal.ZERO;

    private BigDecimal encashedDays = BigDecimal.ZERO;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public BigDecimal getAvailableDays() {
        return entitledDays
                .add(carriedForwardDays)
                .add(adjustmentDays)
                .subtract(takenDays)
                .subtract(pendingDays)
                .subtract(encashedDays);
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

    public BigDecimal getEncashedDays() { return encashedDays; }
    public void setEncashedDays(BigDecimal encashedDays) { this.encashedDays = encashedDays; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
