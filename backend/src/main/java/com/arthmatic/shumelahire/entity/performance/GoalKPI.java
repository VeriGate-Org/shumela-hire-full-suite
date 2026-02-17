package com.arthmatic.shumelahire.entity.performance;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "goal_kpis")
public class GoalKPI {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    @NotNull(message = "Performance goal is required")
    private PerformanceGoal goal;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "target_value", columnDefinition = "TEXT")
    private String targetValue;
    
    @Column(name = "measurement_unit", length = 50)
    private String measurementUnit;
    
    @Column(precision = 5, scale = 2)
    @DecimalMin(value = "0.0", message = "KPI weighting must be positive")
    @DecimalMax(value = "100.0", message = "KPI weighting cannot exceed 100%")
    private BigDecimal weighting;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "kpi_type")
    private KPIType type;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
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
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canBeEdited() {
        return goal != null && goal.canBeEdited() && isActive;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
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