package com.arthmatic.shumelahire.entity.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ShiftSchedule extends TenantAwareEntity {

    private Long id;

    private Employee employee;

    private Shift shift;

    @NotNull
    private LocalDate scheduleDate;

    @NotNull
    private ShiftScheduleStatus status = ShiftScheduleStatus.SCHEDULED;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public Shift getShift() { return shift; }
    public void setShift(Shift shift) { this.shift = shift; }
    public LocalDate getScheduleDate() { return scheduleDate; }
    public void setScheduleDate(LocalDate scheduleDate) { this.scheduleDate = scheduleDate; }
    public ShiftScheduleStatus getStatus() { return status; }
    public void setStatus(ShiftScheduleStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
