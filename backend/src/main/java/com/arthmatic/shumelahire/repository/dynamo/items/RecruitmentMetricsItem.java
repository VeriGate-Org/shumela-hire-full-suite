package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the RecruitmentMetrics entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  RECRUITMENT_METRICS#{id}
 *
 * GSI1 (metric type):
 *   GSI1PK: METRIC_TYPE#{tenantId}#{metricType}
 *   GSI1SK: RECRUITMENT_METRICS#{metricDate}
 *
 * GSI6 (date range):
 *   GSI6PK: METRIC_DATE#{tenantId}
 *   GSI6SK: RECRUITMENT_METRICS#{metricDate}
 */
@DynamoDbBean
public class RecruitmentMetricsItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String metricDate;
    private String metricType;
    private String metricCategory;
    private String metricName;
    private String metricValue;
    private String department;
    private String jobPostingId;
    private String recruiterId;
    private String hiringManagerId;
    private String periodStartDate;
    private String periodEndDate;
    private String targetValue;
    private String previousPeriodValue;
    private String variancePercentage;
    private String trendDirection;
    private String benchmarkValue;
    private String notes;
    private String dataSource;
    private String calculationMethod;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
    private String createdBy;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI1: Metric type index ----------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // -- GSI6: Date range index -----------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getMetricDate() { return metricDate; }
    public void setMetricDate(String metricDate) { this.metricDate = metricDate; }

    public String getMetricType() { return metricType; }
    public void setMetricType(String metricType) { this.metricType = metricType; }

    public String getMetricCategory() { return metricCategory; }
    public void setMetricCategory(String metricCategory) { this.metricCategory = metricCategory; }

    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }

    public String getMetricValue() { return metricValue; }
    public void setMetricValue(String metricValue) { this.metricValue = metricValue; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getRecruiterId() { return recruiterId; }
    public void setRecruiterId(String recruiterId) { this.recruiterId = recruiterId; }

    public String getHiringManagerId() { return hiringManagerId; }
    public void setHiringManagerId(String hiringManagerId) { this.hiringManagerId = hiringManagerId; }

    public String getPeriodStartDate() { return periodStartDate; }
    public void setPeriodStartDate(String periodStartDate) { this.periodStartDate = periodStartDate; }

    public String getPeriodEndDate() { return periodEndDate; }
    public void setPeriodEndDate(String periodEndDate) { this.periodEndDate = periodEndDate; }

    public String getTargetValue() { return targetValue; }
    public void setTargetValue(String targetValue) { this.targetValue = targetValue; }

    public String getPreviousPeriodValue() { return previousPeriodValue; }
    public void setPreviousPeriodValue(String previousPeriodValue) { this.previousPeriodValue = previousPeriodValue; }

    public String getVariancePercentage() { return variancePercentage; }
    public void setVariancePercentage(String variancePercentage) { this.variancePercentage = variancePercentage; }

    public String getTrendDirection() { return trendDirection; }
    public void setTrendDirection(String trendDirection) { this.trendDirection = trendDirection; }

    public String getBenchmarkValue() { return benchmarkValue; }
    public void setBenchmarkValue(String benchmarkValue) { this.benchmarkValue = benchmarkValue; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }

    public String getCalculationMethod() { return calculationMethod; }
    public void setCalculationMethod(String calculationMethod) { this.calculationMethod = calculationMethod; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
