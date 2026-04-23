package com.arthmatic.shumelahire.dto.leave;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class LeaveEncashmentCreateRequest {

    @NotNull(message = "Leave type ID is required")
    private String leaveTypeId;

    @NotNull(message = "Number of days is required")
    @Positive(message = "Days must be positive")
    private BigDecimal days;

    private String reason;

    public String getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(String leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public BigDecimal getDays() { return days; }
    public void setDays(BigDecimal days) { this.days = days; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
