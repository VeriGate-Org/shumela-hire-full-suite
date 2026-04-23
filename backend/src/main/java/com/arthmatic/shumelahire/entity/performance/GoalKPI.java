package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class GoalKPI extends TenantAwareEntity {
    
    private String id;
    
    @NotNull(message = "Performance goal is required")
    private PerformanceGoal goal;
    
    private String name;
    
    private String description;
    
    private String targetValue;
    
    private String measurementUnit;
    
    @DecimalMin(value = "0.0", message = "KPI weighting must be positive")
    @DecimalMax(value = "100.0", message = "KPI weighting cannot exceed 100%")
    private BigDecimal weighting;
    
    private KPIType type;
    
    private Integer sortOrder;
    
    private Boolean isActive = true;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Constructors
    public GoalKPI() {
        this.createdAt = LocalDateTime.now();
    }
    
    public GoalKPI(PerformanceGoal goal, String name, String targetValue, BigDecimal weighting) {
        this();
        this.goal = goal;
        this.name = name;
        this.targetValue = targetValue;
        this.weighting = weighting;
    }
    
    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canBeEdited() {
        return goal != null && goal.canBeEdited() && isActive;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public PerformanceGoal getGoal() { return goal; }
    public void setGoal(PerformanceGoal goal) { this.goal = goal; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getTargetValue() { return targetValue; }
    public void setTargetValue(String targetValue) { this.targetValue = targetValue; }
    
    public String getMeasurementUnit() { return measurementUnit; }
    public void setMeasurementUnit(String measurementUnit) { this.measurementUnit = measurementUnit; }
    
    public BigDecimal getWeighting() { return weighting; }
    public void setWeighting(BigDecimal weighting) { this.weighting = weighting; }
    
    public KPIType getType() { return type; }
    public void setType(KPIType type) { this.type = type; }
    
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}