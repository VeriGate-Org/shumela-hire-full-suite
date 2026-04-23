package com.arthmatic.shumelahire.dto.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveBalance;
import java.math.BigDecimal;

public class LeaveBalanceResponse {

    private String id;
    private String employeeId;
    private String employeeName;
    private String leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private String colorCode;
    private Integer cycleYear;
    private BigDecimal entitledDays;
    private BigDecimal takenDays;
    private BigDecimal pendingDays;
    private BigDecimal carriedForwardDays;
    private BigDecimal adjustmentDays;
    private BigDecimal encashedDays;
    private BigDecimal availableDays;

    public LeaveBalanceResponse() {}

    public static LeaveBalanceResponse fromEntity(LeaveBalance entity) {
        LeaveBalanceResponse r = new LeaveBalanceResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee().getId();
        r.employeeName = entity.getEmployee().getFullName();
        r.leaveTypeId = entity.getLeaveType().getId();
        r.leaveTypeName = entity.getLeaveType().getName();
        r.leaveTypeCode = entity.getLeaveType().getCode();
        r.colorCode = entity.getLeaveType().getColorCode();
        r.cycleYear = entity.getCycleYear();
        r.entitledDays = entity.getEntitledDays();
        r.takenDays = entity.getTakenDays();
        r.pendingDays = entity.getPendingDays();
        r.carriedForwardDays = entity.getCarriedForwardDays();
        r.adjustmentDays = entity.getAdjustmentDays();
        r.encashedDays = entity.getEncashedDays();
        r.availableDays = entity.getAvailableDays();
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(String leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }

    public String getLeaveTypeCode() { return leaveTypeCode; }
    public void setLeaveTypeCode(String leaveTypeCode) { this.leaveTypeCode = leaveTypeCode; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

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

    public BigDecimal getAvailableDays() { return availableDays; }
    public void setAvailableDays(BigDecimal availableDays) { this.availableDays = availableDays; }
}
