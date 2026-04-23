package com.arthmatic.shumelahire.dto.leave;

import com.arthmatic.shumelahire.entity.leave.LeavePolicy;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeavePolicyResponse {

    private String id;
    private String leaveTypeId;
    private String leaveTypeName;
    private String name;
    private String description;
    private String accrualMethod;
    private BigDecimal daysPerCycle;
    private Integer cycleStartMonth;
    private Integer minServiceMonths;
    private String applicableEmploymentTypes;
    private String applicableDepartments;
    private Boolean allowNegativeBalance;
    private Integer maxConsecutiveDays;
    private Integer minNoticeDays;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LeavePolicyResponse() {}

    public static LeavePolicyResponse fromEntity(LeavePolicy entity) {
        LeavePolicyResponse r = new LeavePolicyResponse();
        r.id = entity.getId();
        r.leaveTypeId = entity.getLeaveType().getId();
        r.leaveTypeName = entity.getLeaveType().getName();
        r.name = entity.getName();
        r.description = entity.getDescription();
        r.accrualMethod = entity.getAccrualMethod().name();
        r.daysPerCycle = entity.getDaysPerCycle();
        r.cycleStartMonth = entity.getCycleStartMonth();
        r.minServiceMonths = entity.getMinServiceMonths();
        r.applicableEmploymentTypes = entity.getApplicableEmploymentTypes();
        r.applicableDepartments = entity.getApplicableDepartments();
        r.allowNegativeBalance = entity.getAllowNegativeBalance();
        r.maxConsecutiveDays = entity.getMaxConsecutiveDays();
        r.minNoticeDays = entity.getMinNoticeDays();
        r.isActive = entity.getIsActive();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(String leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }

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

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
