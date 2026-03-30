package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class TenantOnboardingService {

    @Autowired
    private TenantDataRepository tenantRepository;

    @Autowired
    private UserDataRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Tenant createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsBySubdomain(request.getSubdomain())) {
            throw new IllegalArgumentException("Subdomain already taken: " + request.getSubdomain());
        }

        String tenantId = UUID.randomUUID().toString().substring(0, 8) + "-" + request.getSubdomain();

        Tenant tenant = new Tenant(tenantId, request.getName(), request.getSubdomain(), request.getContactEmail());
        tenant.setContactName(request.getContactName());
        tenant.setPlan(request.getPlan() != null ? request.getPlan() : "STANDARD");
        tenant.setMaxUsers(request.getMaxUsers() != null ? request.getMaxUsers() : 50);

        tenant = tenantRepository.save(tenant);

        // Create initial admin user for the tenant
        TenantContext.setCurrentTenant(tenantId);
        try {
            createInitialAdmin(tenantId, request);
        } finally {
            TenantContext.clear();
        }

        return tenant;
    }

    public Tenant updateTenant(String tenantId, UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        if (request.getName() != null) {
            tenant.setName(request.getName());
        }
        if (request.getContactEmail() != null) {
            tenant.setContactEmail(request.getContactEmail());
        }
        if (request.getContactName() != null) {
            tenant.setContactName(request.getContactName());
        }
        if (request.getPlan() != null) {
            tenant.setPlan(request.getPlan());
        }
        if (request.getMaxUsers() != null) {
            tenant.setMaxUsers(request.getMaxUsers());
        }
        if (request.getStatus() != null) {
            tenant.setStatus(request.getStatus());
        }
        if (request.getSettings() != null) {
            tenant.setSettings(request.getSettings());
        }

        return tenantRepository.save(tenant);
    }

    public void suspendTenant(String tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));
        tenant.setStatus("SUSPENDED");
        tenantRepository.save(tenant);
    }

    public void activateTenant(String tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));
        tenant.setStatus("ACTIVE");
        tenantRepository.save(tenant);
    }

    private void createInitialAdmin(String tenantId, CreateTenantRequest request) {
        User admin = new User();
        admin.setUsername(request.getAdminUsername() != null ? request.getAdminUsername() : "admin");
        admin.setEmail(request.getContactEmail());
        admin.setPassword(passwordEncoder.encode(request.getAdminPassword() != null ? request.getAdminPassword() : UUID.randomUUID().toString()));
        admin.setFirstName(request.getContactName() != null ? request.getContactName().split(" ")[0] : "Admin");
        admin.setLastName(request.getContactName() != null && request.getContactName().contains(" ")
                ? request.getContactName().substring(request.getContactName().indexOf(" ") + 1) : "");
        admin.setRole(User.Role.ADMIN);
        admin.setEmailVerified(true);
        admin.setTenantId(tenantId);

        userRepository.save(admin);
    }

    // Request classes

    public static class CreateTenantRequest {
        private String name;
        private String subdomain;
        private String contactEmail;
        private String contactName;
        private String plan;
        private Integer maxUsers;
        private String adminUsername;
        private String adminPassword;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSubdomain() { return subdomain; }
        public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
        public String getContactEmail() { return contactEmail; }
        public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
        public String getContactName() { return contactName; }
        public void setContactName(String contactName) { this.contactName = contactName; }
        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
        public Integer getMaxUsers() { return maxUsers; }
        public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }
        public String getAdminUsername() { return adminUsername; }
        public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }
        public String getAdminPassword() { return adminPassword; }
        public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
    }

    public static class UpdateTenantRequest {
        private String name;
        private String contactEmail;
        private String contactName;
        private String plan;
        private Integer maxUsers;
        private String status;
        private String settings;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getContactEmail() { return contactEmail; }
        public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
        public String getContactName() { return contactName; }
        public void setContactName(String contactName) { this.contactName = contactName; }
        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
        public Integer getMaxUsers() { return maxUsers; }
        public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getSettings() { return settings; }
        public void setSettings(String settings) { this.settings = settings; }
    }
}
