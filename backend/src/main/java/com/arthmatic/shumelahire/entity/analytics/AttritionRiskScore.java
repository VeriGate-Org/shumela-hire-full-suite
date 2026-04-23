package com.arthmatic.shumelahire.entity.analytics;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AttritionRiskScore extends TenantAwareEntity {

    private String id;

    private Employee employee;

    private BigDecimal riskScore;

    private RiskLevel riskLevel;

    private String factors;

    private LocalDateTime calculatedAt;

    private LocalDateTime createdAt;

    public AttritionRiskScore() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public BigDecimal getRiskScore() { return riskScore; }
    public void setRiskScore(BigDecimal riskScore) { this.riskScore = riskScore; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public String getFactors() { return factors; }
    public void setFactors(String factors) { this.factors = factors; }

    public LocalDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
