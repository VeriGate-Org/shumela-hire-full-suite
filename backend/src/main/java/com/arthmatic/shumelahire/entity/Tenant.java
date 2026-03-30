package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class Tenant {

    @Size(max = 50)
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    @Size(max = 63)
    private String subdomain;

    private String status = "ACTIVE";

    private String plan = "STANDARD";

    @NotBlank
    private String contactEmail;

    private String contactName;

    private Integer maxUsers = 50;

    private String settings = "{}";

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Tenant() {
        this.createdAt = LocalDateTime.now();
    }

    public Tenant(String id, String name, String subdomain, String contactEmail) {
        this();
        this.id = id;
        this.name = name;
        this.subdomain = subdomain;
        this.contactEmail = contactEmail;
    }

    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return "ACTIVE".equals(status) || "TRIAL".equals(status);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
