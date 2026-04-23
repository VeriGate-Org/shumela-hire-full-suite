package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GDPR Compliance Service
 * Handles data privacy, consent management, and user rights
 */
@Service
public class GDPRComplianceService {

    private static final Logger logger = LoggerFactory.getLogger(GDPRComplianceService.class);

    @Autowired
    private UserDataRepository userRepository;

    @Autowired
    private DataEncryptionService encryptionService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Generate user data export (Right to Data Portability)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> exportUserData(String userId) {
        logger.info("Starting data export for user ID: {}", userId);
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            logger.warn("User not found for data export: {}", userId);
            return null;
        }

        Map<String, Object> exportData = new HashMap<>();
        
        // Basic user information
        Map<String, Object> basicInfo = new HashMap<>();
        basicInfo.put("id", user.getId());
        basicInfo.put("username", user.getUsername());
        basicInfo.put("email", user.getEmail());
        basicInfo.put("firstName", user.getFirstName());
        basicInfo.put("lastName", user.getLastName());
        basicInfo.put("role", user.getRole().getDisplayName());
        basicInfo.put("createdAt", user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        basicInfo.put("updatedAt", user.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        basicInfo.put("lastLogin", user.getLastLogin() != null ? 
                user.getLastLogin().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        basicInfo.put("emailVerified", user.isEmailVerified());
        basicInfo.put("accountStatus", Map.of(
            "enabled", user.isEnabled(),
            "accountNonExpired", user.isAccountNonExpired(),
            "accountNonLocked", user.isAccountNonLocked(),
            "credentialsNonExpired", user.isCredentialsNonExpired()
        ));
        
        exportData.put("basicInformation", basicInfo);

        // Security information
        Map<String, Object> securityInfo = new HashMap<>();
        securityInfo.put("twoFactorEnabled", user.isTwoFactorEnabled());
        securityInfo.put("failedLoginAttempts", user.getFailedLoginAttempts());
        securityInfo.put("lockedUntil", user.getLockedUntil() != null ? 
                user.getLockedUntil().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        
        exportData.put("securityInformation", securityInfo);

        // Audit logs (last 100 entries)
        try {
            List<Map<String, Object>> auditLogs = auditLogService.getUserAuditLogs(userId)
                    .stream()
                    .limit(100)
                    .map(log -> {
                        Map<String, Object> logMap = new HashMap<>();
                        logMap.put("timestamp", log.getTimestamp().toString());
                        logMap.put("action", log.getAction());
                        logMap.put("entityType", log.getEntityType());
                        logMap.put("details", log.getDetails());
                        return logMap;
                    })
                    .collect(Collectors.toList());
            exportData.put("auditLogs", auditLogs);
        } catch (Exception e) {
            logger.warn("Failed to export audit logs for user {}: {}", userId, e.getMessage());
        }

        // Export metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("exportedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        metadata.put("exportedBy", "GDPR Compliance Service");
        metadata.put("dataRetentionPolicy", "Data exported as per GDPR Article 20");
        metadata.put("format", "JSON");
        
        exportData.put("metadata", metadata);

        // Log the export operation
        auditLogService.logUserAction(
            userId, 
            "DATA_EXPORT", 
            "User", 
            "User data exported for GDPR compliance"
        );

        logger.info("Data export completed for user ID: {}", userId);
        return exportData;
    }

    /**
     * Delete user data (Right to be Forgotten)
     */
    @Transactional
    public boolean deleteUserData(String userId, String reason) {
        logger.info("Starting data deletion for user ID: {} with reason: {}", userId, reason);
        
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                logger.warn("User not found for data deletion: {}", userId);
                return false;
            }

            // Log the deletion request
            auditLogService.logUserAction(
                userId, 
                "DATA_DELETION_REQUEST", 
                "User", 
                "Data deletion requested: " + reason
            );

            // Anonymize user data instead of hard delete (for audit trail)
            anonymizeUserData(user);
            
            // Update user status
            user.setEnabled(false);
            user.setUsername("deleted_user_" + userId);
            user.setEmail("deleted_" + userId + "@deleted.local");
            user.setFirstName("DELETED");
            user.setLastName("DELETED");
            
            userRepository.save(user);

            // Log the completed deletion
            auditLogService.logSystemAction(
                "DATA_DELETION_COMPLETED", 
                "User", 
                "User data deleted for user ID: " + userId
            );

            logger.info("Data deletion completed for user ID: {}", userId);
            return true;

        } catch (Exception e) {
            logger.error("Data deletion failed for user ID {}: {}", userId, e.getMessage());
            return false;
        }
    }

    /**
     * Anonymize user data
     */
    private void anonymizeUserData(User user) {
        user.setPasswordResetToken(null);
        user.setPasswordResetExpires(null);
        user.setEmailVerificationToken(null);
        user.setTwoFactorSecret(null);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
    }

    /**
     * Generate privacy report
     */
    public Map<String, Object> generatePrivacyReport(String userId) {
        logger.info("Generating privacy report for user ID: {}", userId);
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        Map<String, Object> report = new HashMap<>();
        
        // Data categories
        List<Map<String, Object>> dataCategories = Arrays.asList(
            createDataCategory("Personal Information", 
                "Name, email, username", 
                "Account creation and identification", 
                "Legitimate interest, Contract performance"),
            createDataCategory("Authentication Data", 
                "Password hash, login history", 
                "Security and account protection", 
                "Legitimate interest, Security"),
            createDataCategory("Usage Data", 
                "Login times, feature usage", 
                "Service improvement and analytics", 
                "Legitimate interest"),
            createDataCategory("Audit Logs", 
                "System interactions, changes", 
                "Compliance and security monitoring", 
                "Legal obligation, Legitimate interest")
        );
        
        report.put("dataCategories", dataCategories);

        // User rights
        List<Map<String, String>> userRights = Arrays.asList(
            Map.of("right", "Right to Access", "status", "Available", "description", "Request copy of your data"),
            Map.of("right", "Right to Rectification", "status", "Available", "description", "Correct inaccurate data"),
            Map.of("right", "Right to Erasure", "status", "Available", "description", "Delete your data"),
            Map.of("right", "Right to Portability", "status", "Available", "description", "Export your data"),
            Map.of("right", "Right to Object", "status", "Available", "description", "Object to data processing"),
            Map.of("right", "Right to Restrict", "status", "Available", "description", "Restrict data processing")
        );
        
        report.put("userRights", userRights);

        // Data retention policy
        Map<String, Object> retention = Map.of(
            "policy", "Data retained as long as account is active",
            "deletionAfterInactivity", "2 years",
            "auditLogRetention", "7 years for compliance",
            "backupRetention", "30 days"
        );
        
        report.put("dataRetention", retention);

        // Consent information
        Map<String, Object> consent = Map.of(
            "marketingConsent", false,
            "analyticsConsent", true,
            "functionalConsent", true,
            "lastUpdated", user.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
        
        report.put("consent", consent);

        logger.info("Privacy report generated for user ID: {}", userId);
        return report;
    }

    /**
     * Create data category map
     */
    private Map<String, Object> createDataCategory(String category, String data, String purpose, String legalBasis) {
        Map<String, Object> dataCategory = new HashMap<>();
        dataCategory.put("category", category);
        dataCategory.put("dataTypes", data);
        dataCategory.put("purpose", purpose);
        dataCategory.put("legalBasis", legalBasis);
        dataCategory.put("retention", "Account lifetime + 2 years");
        return dataCategory;
    }

    /**
     * Process data subject request
     */
    @Transactional
    public String processDataSubjectRequest(String userId, String requestType, String details) {
        logger.info("Processing data subject request: {} for user ID: {}", requestType, userId);
        
        String requestId = "DSR-" + System.currentTimeMillis();
        
        // Log the request
        auditLogService.logUserAction(
            userId, 
            "DATA_SUBJECT_REQUEST", 
            "GDPR", 
            String.format("Request ID: %s, Type: %s, Details: %s", requestId, requestType, details)
        );

        switch (requestType.toUpperCase()) {
            case "ACCESS":
                return processAccessRequest(userId, requestId);
            case "RECTIFICATION":
                return processRectificationRequest(userId, requestId, details);
            case "ERASURE":
                return processErasureRequest(userId, requestId, details);
            case "PORTABILITY":
                return processPortabilityRequest(userId, requestId);
            case "OBJECTION":
                return processObjectionRequest(userId, requestId, details);
            case "RESTRICTION":
                return processRestrictionRequest(userId, requestId, details);
            default:
                logger.warn("Unknown data subject request type: {}", requestType);
                return null;
        }
    }

    private String processAccessRequest(String userId, String requestId) {
        logger.info("Processing access request {} for user {}", requestId, userId);
        return "Access request processed. Data export will be available within 30 days.";
    }

    private String processRectificationRequest(String userId, String requestId, String details) {
        logger.info("Processing rectification request {} for user {}", requestId, userId);
        return "Rectification request received. Data will be updated within 30 days.";
    }

    private String processErasureRequest(String userId, String requestId, String details) {
        logger.info("Processing erasure request {} for user {}", requestId, userId);
        return "Erasure request received. Data will be deleted within 30 days.";
    }

    private String processPortabilityRequest(String userId, String requestId) {
        logger.info("Processing portability request {} for user {}", requestId, userId);
        return "Portability request processed. Data export will be available within 30 days.";
    }

    private String processObjectionRequest(String userId, String requestId, String details) {
        logger.info("Processing objection request {} for user {}", requestId, userId);
        return "Objection request received. Processing will be restricted within 30 days.";
    }

    private String processRestrictionRequest(String userId, String requestId, String details) {
        logger.info("Processing restriction request {} for user {}", requestId, userId);
        return "Restriction request received. Processing will be limited within 30 days.";
    }

    /**
     * Check data retention compliance
     */
    public List<Map<String, Object>> checkDataRetentionCompliance() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusYears(2);
        List<User> inactiveUsers = userRepository.findInactiveUsers(cutoffDate);
        
        return inactiveUsers.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("userId", user.getId());
                    userMap.put("username", user.getUsername());
                    userMap.put("lastLogin", user.getLastLogin() != null ? 
                        user.getLastLogin().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "Never");
                    userMap.put("createdAt", user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    userMap.put("recommendation", "Consider data deletion or user contact");
                    return userMap;
                })
                .collect(Collectors.toList());
    }
}
