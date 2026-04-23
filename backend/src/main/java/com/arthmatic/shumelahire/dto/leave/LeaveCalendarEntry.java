package com.arthmatic.shumelahire.dto.leave;

import java.time.LocalDate;

public class LeaveCalendarEntry {

    private String id;
    private String employeeName;
    private String department;
    private String leaveTypeName;
    private String colorCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;

    public LeaveCalendarEntry() {}

    public LeaveCalendarEntry(String id, String employeeName, String department,
                              String leaveTypeName, String colorCode,
                              LocalDate startDate, LocalDate endDate, String status) {
        this.id = id;
        this.employeeName = employeeName;
        this.department = department;
        this.leaveTypeName = leaveTypeName;
        this.colorCode = colorCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
