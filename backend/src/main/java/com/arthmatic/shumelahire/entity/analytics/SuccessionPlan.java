package com.arthmatic.shumelahire.entity.analytics;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class SuccessionPlan extends TenantAwareEntity {

    private String id;

    private String positionTitle;

    private String department;

    private Employee currentHolder;

    private Employee successor;

    private ReadinessLevel readinessLevel;

    private String developmentActions;

    private SuccessionPlanStatus status = SuccessionPlanStatus.DRAFT;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public SuccessionPlan() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Employee getCurrentHolder() { return currentHolder; }
    public void setCurrentHolder(Employee currentHolder) { this.currentHolder = currentHolder; }

    public Employee getSuccessor() { return successor; }
    public void setSuccessor(Employee successor) { this.successor = successor; }

    public ReadinessLevel getReadinessLevel() { return readinessLevel; }
    public void setReadinessLevel(ReadinessLevel readinessLevel) { this.readinessLevel = readinessLevel; }

    public String getDevelopmentActions() { return developmentActions; }
    public void setDevelopmentActions(String developmentActions) { this.developmentActions = developmentActions; }

    public SuccessionPlanStatus getStatus() { return status; }
    public void setStatus(SuccessionPlanStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
