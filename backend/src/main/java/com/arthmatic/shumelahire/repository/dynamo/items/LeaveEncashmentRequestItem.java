package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;

import java.time.Instant;

@DynamoDbBean
public class LeaveEncashmentRequestItem {
    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;

    private String id;
    private String tenantId;
    private String employeeId;
    private String leaveTypeId;
    private String days;
    private String ratePerDay;
    private String totalAmount;
    private String status;
    private String reason;
    private Instant requestedAt;
    private String hrApprovedById;
    private String financeApprovedById;
    private Instant hrApprovedAt;
    private Instant financeApprovedAt;
    private String decisionComment;
    private Integer cycleYear;

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

    public String getDays() {
        return days;
    }

    public void setDays(String days) {
        this.days = days;
    }

    public String getRatePerDay() {
        return ratePerDay;
    }

    public void setRatePerDay(String ratePerDay) {
        this.ratePerDay = ratePerDay;
    }

    public String getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(String totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public String getHrApprovedById() {
        return hrApprovedById;
    }

    public void setHrApprovedById(String hrApprovedById) {
        this.hrApprovedById = hrApprovedById;
    }

    public String getFinanceApprovedById() {
        return financeApprovedById;
    }

    public void setFinanceApprovedById(String financeApprovedById) {
        this.financeApprovedById = financeApprovedById;
    }

    public Instant getHrApprovedAt() {
        return hrApprovedAt;
    }

    public void setHrApprovedAt(Instant hrApprovedAt) {
        this.hrApprovedAt = hrApprovedAt;
    }

    public Instant getFinanceApprovedAt() {
        return financeApprovedAt;
    }

    public void setFinanceApprovedAt(Instant financeApprovedAt) {
        this.financeApprovedAt = financeApprovedAt;
    }

    public String getDecisionComment() {
        return decisionComment;
    }

    public void setDecisionComment(String decisionComment) {
        this.decisionComment = decisionComment;
    }

    public Integer getCycleYear() {
        return cycleYear;
    }

    public void setCycleYear(Integer cycleYear) {
        this.cycleYear = cycleYear;
    }
}
