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
@Table(name = "leave_types")
public class LeaveType extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "default_days_per_year", nullable = false, precision = 5, scale = 2)
    private BigDecimal defaultDaysPerYear = BigDecimal.ZERO;

    @Column(name = "max_carry_forward_days", precision = 5, scale = 2)
    private BigDecimal maxCarryForwardDays = BigDecimal.ZERO;

    @Column(name = "requires_medical_certificate", nullable = false)
    private Boolean requiresMedicalCertificate = false;

    @Column(name = "medical_cert_threshold_days")
    private Integer medicalCertThresholdDays = 2;

    @Column(name = "is_paid", nullable = false)
    private Boolean isPaid = true;

    @Column(name = "allow_encashment", nullable = false)
    private Boolean allowEncashment = false;

    @Column(name = "encashment_rate", precision = 10, scale = 2)
    private BigDecimal encashmentRate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "color_code", length = 7)
    private String colorCode = "#3B82F6";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getDefaultDaysPerYear() { return defaultDaysPerYear; }
    public void setDefaultDaysPerYear(BigDecimal defaultDaysPerYear) { this.defaultDaysPerYear = defaultDaysPerYear; }

    public BigDecimal getMaxCarryForwardDays() { return maxCarryForwardDays; }
    public void setMaxCarryForwardDays(BigDecimal maxCarryForwardDays) { this.maxCarryForwardDays = maxCarryForwardDays; }

    public Boolean getRequiresMedicalCertificate() { return requiresMedicalCertificate; }
    public void setRequiresMedicalCertificate(Boolean requiresMedicalCertificate) { this.requiresMedicalCertificate = requiresMedicalCertificate; }

    public Integer getMedicalCertThresholdDays() { return medicalCertThresholdDays; }
    public void setMedicalCertThresholdDays(Integer medicalCertThresholdDays) { this.medicalCertThresholdDays = medicalCertThresholdDays; }

    public Boolean getIsPaid() { return isPaid; }
    public void setIsPaid(Boolean isPaid) { this.isPaid = isPaid; }

    public Boolean getAllowEncashment() { return allowEncashment; }
    public void setAllowEncashment(Boolean allowEncashment) { this.allowEncashment = allowEncashment; }

    public BigDecimal getEncashmentRate() { return encashmentRate; }
    public void setEncashmentRate(BigDecimal encashmentRate) { this.encashmentRate = encashmentRate; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
