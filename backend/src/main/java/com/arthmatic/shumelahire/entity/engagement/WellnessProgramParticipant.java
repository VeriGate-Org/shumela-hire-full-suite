package com.arthmatic.shumelahire.entity.engagement;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class WellnessProgramParticipant extends TenantAwareEntity {

    private Long id;

    private WellnessProgram program;

    private Employee employee;

    private LocalDateTime joinedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public WellnessProgram getProgram() { return program; }
    public void setProgram(WellnessProgram program) { this.program = program; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
