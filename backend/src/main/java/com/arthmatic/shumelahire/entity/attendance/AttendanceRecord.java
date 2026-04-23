package com.arthmatic.shumelahire.entity.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AttendanceRecord extends TenantAwareEntity {

    private String id;

    private Employee employee;

    @NotNull
    private LocalDateTime clockIn;

    private LocalDateTime clockOut;

    @NotNull
    private ClockMethod clockMethod = ClockMethod.MANUAL;

    private Double clockInLatitude;

    private Double clockInLongitude;

    private Double clockOutLatitude;

    private Double clockOutLongitude;

    @NotNull
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    private BigDecimal totalHours;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public LocalDateTime getClockIn() { return clockIn; }
    public void setClockIn(LocalDateTime clockIn) { this.clockIn = clockIn; }
    public LocalDateTime getClockOut() { return clockOut; }
    public void setClockOut(LocalDateTime clockOut) { this.clockOut = clockOut; }
    public ClockMethod getClockMethod() { return clockMethod; }
    public void setClockMethod(ClockMethod clockMethod) { this.clockMethod = clockMethod; }
    public Double getClockInLatitude() { return clockInLatitude; }
    public void setClockInLatitude(Double clockInLatitude) { this.clockInLatitude = clockInLatitude; }
    public Double getClockInLongitude() { return clockInLongitude; }
    public void setClockInLongitude(Double clockInLongitude) { this.clockInLongitude = clockInLongitude; }
    public Double getClockOutLatitude() { return clockOutLatitude; }
    public void setClockOutLatitude(Double clockOutLatitude) { this.clockOutLatitude = clockOutLatitude; }
    public Double getClockOutLongitude() { return clockOutLongitude; }
    public void setClockOutLongitude(Double clockOutLongitude) { this.clockOutLongitude = clockOutLongitude; }
    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }
    public BigDecimal getTotalHours() { return totalHours; }
    public void setTotalHours(BigDecimal totalHours) { this.totalHours = totalHours; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
