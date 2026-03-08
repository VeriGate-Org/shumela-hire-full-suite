package com.arthmatic.shumelahire.dto.integration;

import java.util.Map;

public class SsoTestResult {

    private boolean success;
    private String message;
    private Map<String, String> discoveredEndpoints;

    public SsoTestResult() {}

    public SsoTestResult(boolean success, String message, Map<String, String> discoveredEndpoints) {
        this.success = success;
        this.message = message;
        this.discoveredEndpoints = discoveredEndpoints;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Map<String, String> getDiscoveredEndpoints() { return discoveredEndpoints; }
    public void setDiscoveredEndpoints(Map<String, String> discoveredEndpoints) { this.discoveredEndpoints = discoveredEndpoints; }
}
