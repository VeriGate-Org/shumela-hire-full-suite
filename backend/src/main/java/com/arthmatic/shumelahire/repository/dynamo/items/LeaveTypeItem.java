package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;

import java.time.Instant;

@DynamoDbBean
public class LeaveTypeItem {
    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;

    private String id;
    private String tenantId;
    private String name;
    private String code;
    private String description;
    private String defaultDaysPerYear;
    private String maxCarryForwardDays;
    private Boolean requiresMedicalCertificate;
    private Integer medicalCertThresholdDays;
    private Boolean isPaid;
    private Boolean allowEncashment;
    private String encashmentRate;
    private Boolean isActive;
    private String colorCode;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDefaultDaysPerYear() {
        return defaultDaysPerYear;
    }

    public void setDefaultDaysPerYear(String defaultDaysPerYear) {
        this.defaultDaysPerYear = defaultDaysPerYear;
    }

    public String getMaxCarryForwardDays() {
        return maxCarryForwardDays;
    }

    public void setMaxCarryForwardDays(String maxCarryForwardDays) {
        this.maxCarryForwardDays = maxCarryForwardDays;
    }

    public Boolean getRequiresMedicalCertificate() {
        return requiresMedicalCertificate;
    }

    public void setRequiresMedicalCertificate(Boolean requiresMedicalCertificate) {
        this.requiresMedicalCertificate = requiresMedicalCertificate;
    }

    public Integer getMedicalCertThresholdDays() {
        return medicalCertThresholdDays;
    }

    public void setMedicalCertThresholdDays(Integer medicalCertThresholdDays) {
        this.medicalCertThresholdDays = medicalCertThresholdDays;
    }

    public Boolean getIsPaid() {
        return isPaid;
    }

    public void setIsPaid(Boolean isPaid) {
        this.isPaid = isPaid;
    }

    public Boolean getAllowEncashment() {
        return allowEncashment;
    }

    public void setAllowEncashment(Boolean allowEncashment) {
        this.allowEncashment = allowEncashment;
    }

    public String getEncashmentRate() {
        return encashmentRate;
    }

    public void setEncashmentRate(String encashmentRate) {
        this.encashmentRate = encashmentRate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getColorCode() {
        return colorCode;
    }

    public void setColorCode(String colorCode) {
        this.colorCode = colorCode;
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
