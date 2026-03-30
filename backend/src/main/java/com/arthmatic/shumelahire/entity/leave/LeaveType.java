package com.arthmatic.shumelahire.entity.leave;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeaveType extends TenantAwareEntity {

    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    private String code;

    private String description;

    @NotNull
    private BigDecimal defaultDaysPerYear = BigDecimal.ZERO;

    private BigDecimal maxCarryForwardDays = BigDecimal.ZERO;

    private Boolean requiresMedicalCertificate = false;

    private Integer medicalCertThresholdDays = 2;

    private Boolean isPaid = true;

    private Boolean allowEncashment = false;

    private BigDecimal encashmentRate;

    private Boolean isActive = true;

    private String colorCode = "#3B82F6";

    private LocalDateTime createdAt;

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
