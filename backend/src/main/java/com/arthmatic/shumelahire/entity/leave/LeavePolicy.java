package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_policies")
public class LeavePolicy extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "accrual_method", nullable = false, length = 30)
    private AccrualMethod accrualMethod = AccrualMethod.ANNUAL;

    @NotNull
    @Column(name = "days_per_cycle", nullable = false, precision = 5, scale = 2)
    private BigDecimal daysPerCycle;

    @Column(name = "cycle_start_month", nullable = false)
    private Integer cycleStartMonth = 1;

    @Column(name = "min_service_months")
    private Integer minServiceMonths = 0;

    @Column(name = "applicable_employment_types", columnDefinition = "TEXT")
    private String applicableEmploymentTypes;

    @Column(name = "applicable_departments", columnDefinition = "TEXT")
    private String applicableDepartments;

    @Column(name = "allow_negative_balance", nullable = false)
    private Boolean allowNegativeBalance = false;

    @Column(name = "max_consecutive_days")
    private Integer maxConsecutiveDays;

    @Column(name = "min_notice_days")
    private Integer minNoticeDays = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public AccrualMethod getAccrualMethod() { return accrualMethod; }
    public void setAccrualMethod(AccrualMethod accrualMethod) { this.accrualMethod = accrualMethod; }

    public BigDecimal getDaysPerCycle() { return daysPerCycle; }
    public void setDaysPerCycle(BigDecimal daysPerCycle) { this.daysPerCycle = daysPerCycle; }

    public Integer getCycleStartMonth() { return cycleStartMonth; }
    public void setCycleStartMonth(Integer cycleStartMonth) { this.cycleStartMonth = cycleStartMonth; }

    public Integer getMinServiceMonths() { return minServiceMonths; }
    public void setMinServiceMonths(Integer minServiceMonths) { this.minServiceMonths = minServiceMonths; }

    public String getApplicableEmploymentTypes() { return applicableEmploymentTypes; }
    public void setApplicableEmploymentTypes(String applicableEmploymentTypes) { this.applicableEmploymentTypes = applicableEmploymentTypes; }

    public String getApplicableDepartments() { return applicableDepartments; }
    public void setApplicableDepartments(String applicableDepartments) { this.applicableDepartments = applicableDepartments; }

    public Boolean getAllowNegativeBalance() { return allowNegativeBalance; }
    public void setAllowNegativeBalance(Boolean allowNegativeBalance) { this.allowNegativeBalance = allowNegativeBalance; }

    public Integer getMaxConsecutiveDays() { return maxConsecutiveDays; }
    public void setMaxConsecutiveDays(Integer maxConsecutiveDays) { this.maxConsecutiveDays = maxConsecutiveDays; }

    public Integer getMinNoticeDays() { return minNoticeDays; }
    public void setMinNoticeDays(Integer minNoticeDays) { this.minNoticeDays = minNoticeDays; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
