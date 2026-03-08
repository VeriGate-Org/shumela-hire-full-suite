package com.arthmatic.shumelahire.dto.integration;

public class SsoGroupMapping {

    private String adGroupName;
    private String mappedRole;

    public SsoGroupMapping() {}

    public SsoGroupMapping(String adGroupName, String mappedRole) {
        this.adGroupName = adGroupName;
        this.mappedRole = mappedRole;
    }

    public String getAdGroupName() { return adGroupName; }
    public void setAdGroupName(String adGroupName) { this.adGroupName = adGroupName; }

    public String getMappedRole() { return mappedRole; }
    public void setMappedRole(String mappedRole) { this.mappedRole = mappedRole; }
}
