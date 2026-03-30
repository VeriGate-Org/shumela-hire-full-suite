package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;

import java.time.Instant;

@DynamoDbBean
public class LeavePolicyItem {
    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;

    private String id;
    private String tenantId;
    private String leaveTypeId;
    private String name;
    private String description;
    private String accrualMethod;
    private String daysPerCycle;
    private Integer cycleStartMonth;
    private Integer minServiceMonths;
    private String applicableEmploymentTypes;
    private String applicableDepartments;
    private Boolean allowNegativeBalance;
    private Integer maxConsecutiveDays;
    private Integer minNoticeDays;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    public void setPk(String pk) {
        this.pk = pk;
    }

    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }

    public void setSk(String sk) {
        this.sk = sk;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    public String getGsi1pk() {
        return gsi1pk;
    }

    public void setGsi1pk(String gsi1pk) {
        this.gsi1pk = gsi1pk;
    }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    public String getGsi1sk() {
        return gsi1sk;
    }

    public void setGsi1sk(String gsi1sk) {
        this.gsi1sk = gsi1sk;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(String leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAccrualMethod() {
        return accrualMethod;
    }

    public void setAccrualMethod(String accrualMethod) {
        this.accrualMethod = accrualMethod;
    }

    public String getDaysPerCycle() {
        return daysPerCycle;
    }

    public void setDaysPerCycle(String daysPerCycle) {
        this.daysPerCycle = daysPerCycle;
    }

    public Integer getCycleStartMonth() {
        return cycleStartMonth;
    }

    public void setCycleStartMonth(Integer cycleStartMonth) {
        this.cycleStartMonth = cycleStartMonth;
    }

    public Integer getMinServiceMonths() {
        return minServiceMonths;
    }

    public void setMinServiceMonths(Integer minServiceMonths) {
        this.minServiceMonths = minServiceMonths;
    }

    public String getApplicableEmploymentTypes() {
        return applicableEmploymentTypes;
    }

    public void setApplicableEmploymentTypes(String applicableEmploymentTypes) {
        this.applicableEmploymentTypes = applicableEmploymentTypes;
    }

    public String getApplicableDepartments() {
        return applicableDepartments;
    }

    public void setApplicableDepartments(String applicableDepartments) {
        this.applicableDepartments = applicableDepartments;
    }

    public Boolean getAllowNegativeBalance() {
        return allowNegativeBalance;
    }

    public void setAllowNegativeBalance(Boolean allowNegativeBalance) {
        this.allowNegativeBalance = allowNegativeBalance;
    }

    public Integer getMaxConsecutiveDays() {
        return maxConsecutiveDays;
    }

    public void setMaxConsecutiveDays(Integer maxConsecutiveDays) {
        this.maxConsecutiveDays = maxConsecutiveDays;
    }

    public Integer getMinNoticeDays() {
        return minNoticeDays;
    }

    public void setMinNoticeDays(Integer minNoticeDays) {
        this.minNoticeDays = minNoticeDays;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
