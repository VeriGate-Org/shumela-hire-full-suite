package com.arthmatic.shumelahire.entity.analytics;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "succession_plans")
public class SuccessionPlan extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "position_title", nullable = false, length = 200)
    private String positionTitle;

    @Column(name = "department", length = 200)
    private String department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_holder_id")
    private Employee currentHolder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "successor_id")
    private Employee successor;

    @Enumerated(EnumType.STRING)
    @Column(name = "readiness_level", nullable = false, length = 30)
    private ReadinessLevel readinessLevel;

    @Column(name = "development_actions", columnDefinition = "TEXT")
    private String developmentActions;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SuccessionPlanStatus status = SuccessionPlanStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SuccessionPlan() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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
