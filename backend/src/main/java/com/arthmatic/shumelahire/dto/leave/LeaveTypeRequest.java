package com.arthmatic.shumelahire.dto.leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class LeaveTypeRequest {

    @NotBlank(message = "Leave type name is required")
    private String name;

    @NotBlank(message = "Leave type code is required")
    private String code;

    private String description;

    @NotNull(message = "Default days per year is required")
    private BigDecimal defaultDaysPerYear;

    private BigDecimal maxCarryForwardDays;
    private Boolean requiresMedicalCertificate;
    private Integer medicalCertThresholdDays;
    private Boolean isPaid;
    private Boolean allowEncashment;
    private BigDecimal encashmentRate;
    private String colorCode;

    // Getters and Setters
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

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }
}
