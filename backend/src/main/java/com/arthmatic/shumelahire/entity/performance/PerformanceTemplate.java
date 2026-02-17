package com.arthmatic.shumelahire.entity.performance;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Entity
@Table(name = "performance_templates")
public class PerformanceTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Template name is required")
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 100)
    private String department;
    
    @Column(name = "job_level", length = 50)
    private String jobLevel;
    
    @Column(name = "job_family", length = 100)
    private String jobFamily;
    
    // JSON structure defining goal categories and KPIs
    @Column(name = "goal_template", columnDefinition = "TEXT")
    private String goalTemplate;
    
    // JSON structure defining KPI definitions
    @Column(name = "kpi_template", columnDefinition = "TEXT")
    private String kpiTemplate;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "is_default")
    private Boolean isDefault = false;
    
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;
    
    // Constructors
    public PerformanceTemplate() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceTemplate(String name, String tenantId, String createdBy) {
        this();
        this.name = name;
        this.tenantId = tenantId;
        this.createdBy = createdBy;
    }
    
    // Lifecycle callbacks
    @PreUpdate
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
    
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}