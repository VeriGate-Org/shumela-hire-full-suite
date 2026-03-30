package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeavePolicy extends TenantAwareEntity {

    private Long id;

    private LeaveType leaveType;

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private AccrualMethod accrualMethod = AccrualMethod.ANNUAL;

    @NotNull
    private BigDecimal daysPerCycle;

    private Integer cycleStartMonth = 1;

    private Integer minServiceMonths = 0;

    private String applicableEmploymentTypes;

    private String applicableDepartments;

    private Boolean allowNegativeBalance = false;

    private Integer maxConsecutiveDays;

    private Integer minNoticeDays = 0;

    private Boolean isActive = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public AccrualMethod getAccrualMethod() { return accrualMethod; }
    public void setAccrualMethod(AccrualMethod accrualMethod) { this.accrualMethod = accrualMethod; }

    public BigDecimal getDaysPerCycle() { return daysPerCycle; }
    public void setDaysPerCycle(BigDecimal daysPerCycle) { this.daysPerCycle = daysPerCycle; }

    public Integer getCycleStartMonth() { return cycleStartMonth; }
    public void setCycleStartMonth(Integer cycleStartMonth) { this.cycleStartMonth = cycleStartMonth; }

    public Integer getMinServiceMonths() { return minServiceMonths; }
    public void setMinServiceMonths(Integer minServiceMonths) { this.minServiceMonths = minServiceMonths; }

    public String getApplicableEmploymentTypes() { return applicableEmploymentTypes; }
    public void setApplicableEmploymentTypes(String applicableEmploymentTypes) { this.applicableEmploymentTypes = applicableEmploymentTypes; }

    public String getApplicableDepartments() { return applicableDepartments; }
    public void setApplicableDepartments(String applicableDepartments) { this.applicableDepartments = applicableDepartments; }

    public Boolean getAllowNegativeBalance() { return allowNegativeBalance; }
    public void setAllowNegativeBalance(Boolean allowNegativeBalance) { this.allowNegativeBalance = allowNegativeBalance; }

    public Integer getMaxConsecutiveDays() { return maxConsecutiveDays; }
    public void setMaxConsecutiveDays(Integer maxConsecutiveDays) { this.maxConsecutiveDays = maxConsecutiveDays; }

    public Integer getMinNoticeDays() { return minNoticeDays; }
    public void setMinNoticeDays(Integer minNoticeDays) { this.minNoticeDays = minNoticeDays; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
