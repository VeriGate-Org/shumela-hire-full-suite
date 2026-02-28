package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.User;

import java.time.LocalDateTime;

/**
 * Safe DTO for admin user listing.
 * Excludes sensitive fields: password, tokens, twoFactorSecret, failedLoginAttempts, lockedUntil, ssoUserId, tenantId.
 */
public class UserAdminResponse {

    private String id;
    private String name;
    private String email;
    private String username;
    private String roleId;
    private String roleName;
    private String status;
    private LocalDateTime lastLogin;
    private String department;
    private String jobTitle;
    private String phone;
    private String location;
    private boolean emailVerified;
    private boolean twoFactorEnabled;
    private LocalDateTime createdAt;

    public UserAdminResponse() {}

    public static UserAdminResponse fromEntity(User user) {
        UserAdminResponse r = new UserAdminResponse();
        r.setId(String.valueOf(user.getId()));
        r.setName(
            ((user.getFirstName() != null ? user.getFirstName() : "") + " " +
             (user.getLastName() != null ? user.getLastName() : "")).trim()
        );
        r.setEmail(user.getEmail());
        r.setUsername(user.getUsername());
        r.setRoleId(user.getRole().name().toLowerCase());
        r.setRoleName(user.getRole().getDisplayName());
        r.setStatus(user.isEnabled() ? "active" : "inactive");
        r.setLastLogin(user.getLastLogin());
        r.setDepartment(user.getDepartment() != null ? user.getDepartment() : "");
        r.setJobTitle(user.getJobTitle() != null ? user.getJobTitle() : "");
        r.setPhone(user.getPhone() != null ? user.getPhone() : "");
        r.setLocation(user.getLocation() != null ? user.getLocation() : "");
        r.setEmailVerified(user.isEmailVerified());
        r.setTwoFactorEnabled(user.isTwoFactorEnabled());
        r.setCreatedAt(user.getCreatedAt());
        // TODO: encrypt twoFactorSecret at rest (Fix #13)
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRoleId() { return roleId; }
    public void setRoleId(String roleId) { this.roleId = roleId; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
