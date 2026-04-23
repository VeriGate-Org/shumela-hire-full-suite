package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PerformanceGoal extends TenantAwareEntity {
    
    private String id;
    
    @NotNull(message = "Performance contract is required")
    private PerformanceContract contract;
    
    private String title;
    
    private String description;
    
    // SMART criteria stored as JSON
    private String smartCriteria;
    
    private GoalType type;
    
    @DecimalMin(value = "0.0", message = "Weighting must be positive")
    @DecimalMax(value = "100.0", message = "Weighting cannot exceed 100%")
    private BigDecimal weighting;
    
    private String targetValue;
    
    private String measurementCriteria;
    
    private Boolean isActive = true;
    
    private Integer sortOrder;

    private String parentGoalId;

    private Integer cascadeLevel = 0;

    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Relationships
    private List<GoalKPI> kpis;
    
    // Constructors
    public PerformanceGoal() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceGoal(PerformanceContract contract, String title, GoalType type, BigDecimal weighting) {
        this();
        this.contract = contract;
        this.title = title;
        this.type = type;
        this.weighting = weighting;
    }
    
    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canBeEdited() {
        return contract != null && contract.canBeEdited() && isActive;
    }
    
    public void activate() {
        this.isActive = true;
    }
    
    public void deactivate() {
        this.isActive = false;
    }
    
    public BigDecimal getWeightingDecimal() {
        return weighting != null ? weighting.divide(new BigDecimal("100")) : BigDecimal.ZERO;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public PerformanceContract getContract() { return contract; }
    public void setContract(PerformanceContract contract) { this.contract = contract; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getSmartCriteria() { return smartCriteria; }
    public void setSmartCriteria(String smartCriteria) { this.smartCriteria = smartCriteria; }
    
    public GoalType getType() { return type; }
    public void setType(GoalType type) { this.type = type; }
    
    public BigDecimal getWeighting() { return weighting; }
    public void setWeighting(BigDecimal weighting) { this.weighting = weighting; }
    
    public String getTargetValue() { return targetValue; }
    public void setTargetValue(String targetValue) { this.targetValue = targetValue; }
    
    public String getMeasurementCriteria() { return measurementCriteria; }
    public void setMeasurementCriteria(String measurementCriteria) { this.measurementCriteria = measurementCriteria; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<GoalKPI> getKpis() { return kpis; }
    public void setKpis(List<GoalKPI> kpis) { this.kpis = kpis; }

    public String getParentGoalId() { return parentGoalId; }
    public void setParentGoalId(String parentGoalId) { this.parentGoalId = parentGoalId; }

    public Integer getCascadeLevel() { return cascadeLevel; }
    public void setCascadeLevel(Integer cascadeLevel) { this.cascadeLevel = cascadeLevel; }
}