package com.arthmatic.shumelahire.dto.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeaveTypeResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private BigDecimal defaultDaysPerYear;
    private BigDecimal maxCarryForwardDays;
    private Boolean requiresMedicalCertificate;
    private Integer medicalCertThresholdDays;
    private Boolean isPaid;
    private Boolean allowEncashment;
    private BigDecimal encashmentRate;
    private Boolean isActive;
    private String colorCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LeaveTypeResponse() {}

    public static LeaveTypeResponse fromEntity(LeaveType entity) {
        LeaveTypeResponse r = new LeaveTypeResponse();
        r.id = entity.getId();
        r.name = entity.getName();
        r.code = entity.getCode();
        r.description = entity.getDescription();
        r.defaultDaysPerYear = entity.getDefaultDaysPerYear();
        r.maxCarryForwardDays = entity.getMaxCarryForwardDays();
        r.requiresMedicalCertificate = entity.getRequiresMedicalCertificate();
        r.medicalCertThresholdDays = entity.getMedicalCertThresholdDays();
        r.isPaid = entity.getIsPaid();
        r.allowEncashment = entity.getAllowEncashment();
        r.encashmentRate = entity.getEncashmentRate();
        r.isActive = entity.getIsActive();
        r.colorCode = entity.getColorCode();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

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
