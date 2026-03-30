package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the DeviceRegistration entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  DEVICE_REG#{id}
 *
 * GSI2 (by employee, sorted by registration date):
 *   GSI2PK: DEVREG_EMPLOYEE#{employeeId}
 *   GSI2SK: DEVICE_REG#{registeredAt_ISO}
 *
 * GSI4 (unique device token lookup):
 *   GSI4PK: DEVREG_TOKEN#{deviceToken}
 *   GSI4SK: DEVICE_REG#{id}
 */
@DynamoDbBean
public class DeviceRegistrationItem {

    private String pk;
    private String sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String employeeId;
    private String deviceToken;
    private String platform;
    private String deviceName;
    private Boolean isActive;
    private String lastUsedAt;
    private String registeredAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI2: By employee, sorted by registration date -----------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI4: Unique device token lookup -------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getDeviceToken() { return deviceToken; }
    public void setDeviceToken(String deviceToken) { this.deviceToken = deviceToken; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(String lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public String getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(String registeredAt) { this.registeredAt = registeredAt; }
}
