package com.arthmatic.shumelahire.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @Size(max = 50)
    private String id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Size(max = 63)
    @Column(nullable = false, unique = true)
    private String subdomain;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(nullable = false, length = 30)
    private String plan = "STANDARD";

    @NotBlank
    @Column(name = "contact_email", nullable = false)
    private String contactEmail;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "max_users")
    private Integer maxUsers = 50;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "settings")
    private String settings = "{}";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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

    @PreUpdate
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
