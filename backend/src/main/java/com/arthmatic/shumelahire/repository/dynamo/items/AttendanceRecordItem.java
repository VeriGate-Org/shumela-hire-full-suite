package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

@DynamoDbBean
public class AttendanceRecordItem {
    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String id;
    private String tenantId;
    private String employeeId;
    private String clockIn;
    private String clockOut;
    private String clockMethod;
    private String clockInLatitude;
    private String clockInLongitude;
    private String clockOutLatitude;
    private String clockOutLongitude;
    private String status;
    private String totalHours;
    private String notes;
    private String createdAt;
    private String updatedAt;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() {
        return pk;
    }

    public void setPk(String pk) {
        this.pk = pk;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() {
        return sk;
    }

    public void setSk(String sk) {
        this.sk = sk;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() {
        return gsi1pk;
    }

    public void setGsi1pk(String gsi1pk) {
        this.gsi1pk = gsi1pk;
    }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() {
        return gsi1sk;
    }

    public void setGsi1sk(String gsi1sk) {
        this.gsi1sk = gsi1sk;
    }

    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @DynamoDbAttribute("tenantId")
    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    @DynamoDbAttribute("employeeId")
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    @DynamoDbAttribute("clockIn")
    public String getClockIn() {
        return clockIn;
    }

    public void setClockIn(String clockIn) {
        this.clockIn = clockIn;
    }

    @DynamoDbAttribute("clockOut")
    public String getClockOut() {
        return clockOut;
    }

    public void setClockOut(String clockOut) {
        this.clockOut = clockOut;
    }

    @DynamoDbAttribute("clockMethod")
    public String getClockMethod() {
        return clockMethod;
    }

    public void setClockMethod(String clockMethod) {
        this.clockMethod = clockMethod;
    }

    @DynamoDbAttribute("clockInLatitude")
    public String getClockInLatitude() {
        return clockInLatitude;
    }

    public void setClockInLatitude(String clockInLatitude) {
        this.clockInLatitude = clockInLatitude;
    }

    @DynamoDbAttribute("clockInLongitude")
    public String getClockInLongitude() {
        return clockInLongitude;
    }

    public void setClockInLongitude(String clockInLongitude) {
        this.clockInLongitude = clockInLongitude;
    }

    @DynamoDbAttribute("clockOutLatitude")
    public String getClockOutLatitude() {
        return clockOutLatitude;
    }

    public void setClockOutLatitude(String clockOutLatitude) {
        this.clockOutLatitude = clockOutLatitude;
    }

    @DynamoDbAttribute("clockOutLongitude")
    public String getClockOutLongitude() {
        return clockOutLongitude;
    }

    public void setClockOutLongitude(String clockOutLongitude) {
        this.clockOutLongitude = clockOutLongitude;
    }

    @DynamoDbAttribute("status")
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @DynamoDbAttribute("totalHours")
    public String getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(String totalHours) {
        this.totalHours = totalHours;
    }

    @DynamoDbAttribute("notes")
    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @DynamoDbAttribute("createdAt")
    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    @DynamoDbAttribute("updatedAt")
    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
