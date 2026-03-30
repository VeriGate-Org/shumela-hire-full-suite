package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class PerformanceTemplate extends TenantAwareEntity {
    
    private Long id;
    
    @NotBlank(message = "Template name is required")
    private String name;
    
    private String description;
    
    private String department;
    
    private String jobLevel;
    
    private String jobFamily;
    
    // JSON structure defining goal categories and KPIs
    private String goalTemplate;
    
    // JSON structure defining KPI definitions
    private String kpiTemplate;
    
    private Boolean isActive = true;
    
    private Boolean isDefault = false;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private String createdBy;
    
    // Constructors
    public PerformanceTemplate() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceTemplate(String name, String createdBy) {
        this();
        this.name = name;
        this.createdBy = createdBy;
    }
    
    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canBeDeleted() {
        return isActive && !isDefault;
    }
    
    public void activate() {
        this.isActive = true;
    }
    
    public void deactivate() {
        if (isDefault) {
            throw new IllegalStateException("Default templates cannot be deactivated");
        }
        this.isActive = false;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public String getJobLevel() { return jobLevel; }
    public void setJobLevel(String jobLevel) { this.jobLevel = jobLevel; }
    
    public String getJobFamily() { return jobFamily; }
    public void setJobFamily(String jobFamily) { this.jobFamily = jobFamily; }
    
    public String getGoalTemplate() { return goalTemplate; }
    public void setGoalTemplate(String goalTemplate) { this.goalTemplate = goalTemplate; }
    
    public String getKpiTemplate() { return kpiTemplate; }
    public void setKpiTemplate(String kpiTemplate) { this.kpiTemplate = kpiTemplate; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}