package com.arthmatic.shumelahire.dto.integration;

import com.arthmatic.shumelahire.entity.integration.SageAuthMethod;
import com.arthmatic.shumelahire.entity.integration.SageConnectorType;

public class SageConnectorConfigRequest {

    private String name;
    private SageConnectorType connectorType;
    private SageAuthMethod authMethod;
    private String baseUrl;
    private String credentials;

    public SageConnectorConfigRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public SageConnectorType getConnectorType() { return connectorType; }
    public void setConnectorType(SageConnectorType connectorType) { this.connectorType = connectorType; }

    public SageAuthMethod getAuthMethod() { return authMethod; }
    public void setAuthMethod(SageAuthMethod authMethod) { this.authMethod = authMethod; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getCredentials() { return credentials; }
    public void setCredentials(String credentials) { this.credentials = credentials; }
}
