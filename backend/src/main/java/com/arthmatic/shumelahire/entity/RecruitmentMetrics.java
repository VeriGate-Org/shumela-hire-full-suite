package com.arthmatic.shumelahire.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class RecruitmentMetrics extends TenantAwareEntity {

    private String id;

    private LocalDate metricDate;

    private MetricType metricType;

    private String metricCategory; // APPLICATIONS, INTERVIEWS, OFFERS, HIRES, PIPELINE

    private String metricName;

    private BigDecimal metricValue;

    private String department;

    private String jobPostingId;

    private String recruiterId;

    private String hiringManagerId;

    private LocalDate periodStartDate;

    private LocalDate periodEndDate;

    private BigDecimal targetValue;

    private BigDecimal previousPeriodValue;

    private BigDecimal variancePercentage;

    private TrendDirection trendDirection;

    private BigDecimal benchmarkValue;

    private String notes;

    private String dataSource;

    private String calculationMethod;

    private Boolean isActive = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    // Constructors
    public RecruitmentMetrics() {
        this.createdAt = LocalDateTime.now();
    }

    public RecruitmentMetrics(LocalDate metricDate, MetricType metricType, String metricCategory, 
                            String metricName, BigDecimal metricValue) {
        this();
        this.metricDate = metricDate;
        this.metricType = metricType;
        this.metricCategory = metricCategory;
        this.metricName = metricName;
        this.metricValue = metricValue;
    }

    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean isAboveTarget() {
        return targetValue != null && metricValue.compareTo(targetValue) > 0;
    }

    public boolean isBelowTarget() {
        return targetValue != null && metricValue.compareTo(targetValue) < 0;
    }

    public BigDecimal getTargetVariance() {
        if (targetValue == null || targetValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return metricValue.subtract(targetValue)
                         .divide(targetValue, 4, RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100));
    }

    public BigDecimal getPeriodOverPeriodChange() {
        if (previousPeriodValue == null || previousPeriodValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return metricValue.subtract(previousPeriodValue)
                         .divide(previousPeriodValue, 4, RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100));
    }

    public String getPerformanceStatus() {
        if (targetValue == null) return "NO_TARGET";
        
        BigDecimal variance = getTargetVariance();
        if (variance.compareTo(BigDecimal.valueOf(10)) > 0) return "EXCEEDING";
        if (variance.compareTo(BigDecimal.valueOf(-10)) < 0) return "BELOW_TARGET";
        return "ON_TARGET";
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDate getMetricDate() {
        return metricDate;
    }

    public void setMetricDate(LocalDate metricDate) {
        this.metricDate = metricDate;
    }

    public MetricType getMetricType() {
        return metricType;
    }

    public void setMetricType(MetricType metricType) {
        this.metricType = metricType;
    }

    public String getMetricCategory() {
        return metricCategory;
    }

    public void setMetricCategory(String metricCategory) {
        this.metricCategory = metricCategory;
    }

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public BigDecimal getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(BigDecimal metricValue) {
        this.metricValue = metricValue;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getJobPostingId() {
        return jobPostingId;
    }

    public void setJobPostingId(String jobPostingId) {
        this.jobPostingId = jobPostingId;
    }

    public String getRecruiterId() {
        return recruiterId;
    }

    public void setRecruiterId(String recruiterId) {
        this.recruiterId = recruiterId;
    }

    public String getHiringManagerId() {
        return hiringManagerId;
    }

    public void setHiringManagerId(String hiringManagerId) {
        this.hiringManagerId = hiringManagerId;
    }

    public LocalDate getPeriodStartDate() {
        return periodStartDate;
    }

    public void setPeriodStartDate(LocalDate periodStartDate) {
        this.periodStartDate = periodStartDate;
    }

    public LocalDate getPeriodEndDate() {
        return periodEndDate;
    }

    public void setPeriodEndDate(LocalDate periodEndDate) {
        this.periodEndDate = periodEndDate;
    }

    public BigDecimal getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(BigDecimal targetValue) {
        this.targetValue = targetValue;
    }

    public BigDecimal getPreviousPeriodValue() {
        return previousPeriodValue;
    }

    public void setPreviousPeriodValue(BigDecimal previousPeriodValue) {
        this.previousPeriodValue = previousPeriodValue;
    }

    public BigDecimal getVariancePercentage() {
        return variancePercentage;
    }

    public void setVariancePercentage(BigDecimal variancePercentage) {
        this.variancePercentage = variancePercentage;
    }

    public TrendDirection getTrendDirection() {
        return trendDirection;
    }

    public void setTrendDirection(TrendDirection trendDirection) {
        this.trendDirection = trendDirection;
    }

    public BigDecimal getBenchmarkValue() {
        return benchmarkValue;
    }

    public void setBenchmarkValue(BigDecimal benchmarkValue) {
        this.benchmarkValue = benchmarkValue;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public String getCalculationMethod() {
        return calculationMethod;
    }

    public void setCalculationMethod(String calculationMethod) {
        this.calculationMethod = calculationMethod;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}