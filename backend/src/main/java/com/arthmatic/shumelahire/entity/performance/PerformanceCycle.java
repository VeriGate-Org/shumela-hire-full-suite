package com.arthmatic.shumelahire.entity.performance;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "performance_cycles")
public class PerformanceCycle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Cycle name is required")
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @NotNull(message = "Mid-year deadline is required")
    @Column(name = "mid_year_deadline", nullable = false)
    private LocalDate midYearDeadline;
    
    @NotNull(message = "Final review deadline is required")
    @Column(name = "final_review_deadline", nullable = false)
    private LocalDate finalReviewDeadline;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CycleStatus status = CycleStatus.PLANNING;
    
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;
    
    @Column(name = "is_default")
    private Boolean isDefault = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", nullable = false)
    private String createdBy;
    
    // Relationships
    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PerformanceContract> contracts;
    
    // Constructors
    public PerformanceCycle() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceCycle(String name, LocalDate startDate, LocalDate endDate, String tenantId, String createdBy) {
        this();
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.tenantId = tenantId;
        this.createdBy = createdBy;
    }
    
    // Lifecycle callbacks
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean isActive() {
        LocalDate now = LocalDate.now();
        return status == CycleStatus.ACTIVE && 
               !now.isBefore(startDate) && 
               !now.isAfter(endDate);
    }
    
    public boolean isInMidYearPeriod() {
        LocalDate now = LocalDate.now();
        return isActive() && !now.isAfter(midYearDeadline);
    }
    
    public boolean isInFinalReviewPeriod() {
        LocalDate now = LocalDate.now();
        return isActive() && now.isAfter(midYearDeadline) && !now.isAfter(finalReviewDeadline);
    }
    
    public boolean canBeActivated() {
        return status == CycleStatus.PLANNING;
    }
    
    public boolean canBeClosed() {
        return status == CycleStatus.ACTIVE && LocalDate.now().isAfter(finalReviewDeadline);
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    
    public LocalDate getMidYearDeadline() { return midYearDeadline; }
    public void setMidYearDeadline(LocalDate midYearDeadline) { this.midYearDeadline = midYearDeadline; }
    
    public LocalDate getFinalReviewDeadline() { return finalReviewDeadline; }
    public void setFinalReviewDeadline(LocalDate finalReviewDeadline) { this.finalReviewDeadline = finalReviewDeadline; }
    
    public CycleStatus getStatus() { return status; }
    public void setStatus(CycleStatus status) { this.status = status; }
    
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public List<PerformanceContract> getContracts() { return contracts; }
    public void setContracts(List<PerformanceContract> contracts) { this.contracts = contracts; }
}