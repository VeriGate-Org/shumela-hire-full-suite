package com.arthmatic.shumelahire.dto.leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class LeavePolicyRequest {

    @NotNull(message = "Leave type ID is required")
    private Long leaveTypeId;

    @NotBlank(message = "Policy name is required")
    private String name;

    private String description;

    @NotBlank(message = "Accrual method is required")
    private String accrualMethod;

    @NotNull(message = "Days per cycle is required")
    private BigDecimal daysPerCycle;

    private Integer cycleStartMonth;
    private Integer minServiceMonths;
    private String applicableEmploymentTypes;
    private String applicableDepartments;
    private Boolean allowNegativeBalance;
    private Integer maxConsecutiveDays;
    private Integer minNoticeDays;

    // Getters and Setters
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAccrualMethod() { return accrualMethod; }
    public void setAccrualMethod(String accrualMethod) { this.accrualMethod = accrualMethod; }

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
}
