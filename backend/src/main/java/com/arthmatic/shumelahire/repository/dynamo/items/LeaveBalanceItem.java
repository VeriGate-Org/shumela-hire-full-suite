package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;

import java.time.Instant;

@DynamoDbBean
public class LeaveBalanceItem {
    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;

    private String id;
    private String tenantId;
    private String employeeId;
    private String leaveTypeId;
    private Integer cycleYear;
    private String entitledDays;
    private String takenDays;
    private String pendingDays;
    private String carriedForwardDays;
    private String adjustmentDays;
    private String encashedDays;
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

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(String leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public Integer getCycleYear() {
        return cycleYear;
    }

    public void setCycleYear(Integer cycleYear) {
        this.cycleYear = cycleYear;
    }

    public String getEntitledDays() {
        return entitledDays;
    }

    public void setEntitledDays(String entitledDays) {
        this.entitledDays = entitledDays;
    }

    public String getTakenDays() {
        return takenDays;
    }

    public void setTakenDays(String takenDays) {
        this.takenDays = takenDays;
    }

    public String getPendingDays() {
        return pendingDays;
    }

    public void setPendingDays(String pendingDays) {
        this.pendingDays = pendingDays;
    }

    public String getCarriedForwardDays() {
        return carriedForwardDays;
    }

    public void setCarriedForwardDays(String carriedForwardDays) {
        this.carriedForwardDays = carriedForwardDays;
    }

    public String getAdjustmentDays() {
        return adjustmentDays;
    }

    public void setAdjustmentDays(String adjustmentDays) {
        this.adjustmentDays = adjustmentDays;
    }

    public String getEncashedDays() {
        return encashedDays;
    }

    public void setEncashedDays(String encashedDays) {
        this.encashedDays = encashedDays;
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
