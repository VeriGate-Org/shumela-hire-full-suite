package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Security Monitoring Service
 * Monitors and detects security threats, suspicious activities, and compliance violations
 */
@Service
public class SecurityMonitoringService {

    private static final Logger logger = LoggerFactory.getLogger(SecurityMonitoringService.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("SECURITY");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    // In-memory tracking for security events (in production, use Redis or database)
    private final Map<String, AtomicInteger> failedLoginAttempts = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lastFailedAttempt = new ConcurrentHashMap<>();
    private final Map<String, List<String>> suspiciousIPs = new ConcurrentHashMap<>();
    private final Set<String> blockedIPs = ConcurrentHashMap.newKeySet();

    // Security thresholds
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int SUSPICIOUS_ACTIVITY_THRESHOLD = 10;
    private static final int IP_BLOCK_MINUTES = 60;

    /**
     * Monitor failed login attempt
     */
    public void recordFailedLoginAttempt(String ipAddress, String username) {
        String key = ipAddress + ":" + username;
        
        failedLoginAttempts.computeIfAbsent(key, k -> new AtomicInteger(0)).incrementAndGet();
        lastFailedAttempt.put(key, LocalDateTime.now());

        int attempts = failedLoginAttempts.get(key).get();
        
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            blockIP(ipAddress, "Multiple failed login attempts");
            sendSecurityAlert("BRUTE_FORCE_DETECTED", 
                String.format("IP %s blocked after %d failed login attempts for user %s", 
                    ipAddress, attempts, username));
        }

        securityLogger.warn("Failed login attempt #{} from IP {} for user {}", 
            attempts, ipAddress, username);
    }

    /**
     * Record successful login
     */
    public void recordSuccessfulLogin(String ipAddress, String username) {
        String key = ipAddress + ":" + username;
        
        // Reset failed attempts on successful login
        failedLoginAttempts.remove(key);
        lastFailedAttempt.remove(key);
        
        securityLogger.info("Successful login from IP {} for user {}", ipAddress, username);
    }

    /**
     * Block suspicious IP address
     */
    public void blockIP(String ipAddress, String reason) {
        blockedIPs.add(ipAddress);
        
        // Log the IP block
        auditLogService.logSystemAction(
            "IP_BLOCKED", 
            "Security", 
            String.format("IP %s blocked: %s", ipAddress, reason)
        );
        
        securityLogger.warn("IP address {} blocked: {}", ipAddress, reason);
    }

    /**
     * Check if IP is blocked
     */
    public boolean isIPBlocked(String ipAddress) {
        return blockedIPs.contains(ipAddress);
    }

    /**
     * Unblock IP address
     */
    public void unblockIP(String ipAddress) {
        blockedIPs.remove(ipAddress);
        
        auditLogService.logSystemAction(
            "IP_UNBLOCKED", 
            "Security", 
            String.format("IP %s unblocked", ipAddress)
        );
        
        securityLogger.info("IP address {} unblocked", ipAddress);
    }

    /**
     * Detect suspicious activity patterns
     */
    public void detectSuspiciousActivity(String userId, String action, String details) {
        // Pattern detection logic
        List<String> patterns = new ArrayList<>();
        
        if (action.contains("FAILED") && details.contains("multiple")) {
            patterns.add("REPEATED_FAILURES");
        }
        
        if (action.contains("DELETE") && details.contains("bulk")) {
            patterns.add("BULK_DELETION");
        }
        
        if (action.contains("EXPORT") && details.contains("large")) {
            patterns.add("LARGE_DATA_EXPORT");
        }

        if (!patterns.isEmpty()) {
            sendSecurityAlert("SUSPICIOUS_ACTIVITY", 
                String.format("User %s: %s - Patterns: %s", userId, action, String.join(", ", patterns)));
        }
    }

    /**
     * Monitor privilege escalation attempts
     */
    public void monitorPrivilegeEscalation(String userId, String fromRole, String toRole) {
        User.Role from = User.Role.valueOf(fromRole);
        User.Role to = User.Role.valueOf(toRole);
        
        // Alert if attempting to escalate to higher privilege role
        if (to.getPriority() > from.getPriority()) {
            sendSecurityAlert("PRIVILEGE_ESCALATION_ATTEMPT", 
                String.format("User %s attempting to escalate from %s to %s", 
                    userId, fromRole, toRole));
        }
        
        securityLogger.info("Role change monitored: User {} from {} to {}", 
            userId, fromRole, toRole);
    }

    /**
     * Check for data breach indicators
     */
    public void checkDataBreachIndicators(String action, String entityType, int recordCount) {
        List<String> indicators = new ArrayList<>();
        
        if (recordCount > 1000 && action.contains("EXPORT")) {
            indicators.add("LARGE_DATA_EXPORT");
        }
        
        if (recordCount > 100 && action.contains("DELETE")) {
            indicators.add("BULK_DATA_DELETION");
        }
        
        if (action.contains("ACCESS") && entityType.equals("PII")) {
            indicators.add("PII_ACCESS");
        }

        if (!indicators.isEmpty()) {
            sendSecurityAlert("POTENTIAL_DATA_BREACH", 
                String.format("Action: %s, Entity: %s, Records: %d, Indicators: %s", 
                    action, entityType, recordCount, String.join(", ", indicators)));
        }
    }

    /**
     * Generate security report
     */
    public Map<String, Object> generateSecurityReport() {
        Map<String, Object> report = new HashMap<>();
        
        // Failed login statistics
        Map<String, Object> failedLogins = new HashMap<>();
        failedLogins.put("totalAttempts", failedLoginAttempts.size());
        failedLogins.put("uniqueIPs", failedLoginAttempts.keySet().stream()
            .map(key -> key.split(":")[0])
            .distinct()
            .count());
        failedLogins.put("recentAttempts", failedLoginAttempts.entrySet().stream()
            .filter(entry -> {
                String key = entry.getKey();
                LocalDateTime lastAttempt = lastFailedAttempt.get(key);
                return lastAttempt != null && lastAttempt.isAfter(LocalDateTime.now().minusHours(24));
            })
            .count());
        
        report.put("failedLogins", failedLogins);

        // Blocked IPs
        Map<String, Object> blockedIPsInfo = new HashMap<>();
        blockedIPsInfo.put("count", blockedIPs.size());
        blockedIPsInfo.put("addresses", new ArrayList<>(blockedIPs));
        
        report.put("blockedIPs", blockedIPsInfo);

        // Account security status
        List<User> allUsers = userRepository.findAll();
        Map<String, Object> accountSecurity = new HashMap<>();
        accountSecurity.put("totalUsers", allUsers.size());
        accountSecurity.put("enabledUsers", allUsers.stream().mapToInt(u -> u.isEnabled() ? 1 : 0).sum());
        accountSecurity.put("lockedAccounts", allUsers.stream()
            .mapToInt(u -> u.isAccountNonLocked() ? 0 : 1).sum());
        accountSecurity.put("twoFactorEnabled", allUsers.stream()
            .mapToInt(u -> u.isTwoFactorEnabled() ? 1 : 0).sum());
        accountSecurity.put("unverifiedEmails", allUsers.stream()
            .mapToInt(u -> u.isEmailVerified() ? 0 : 1).sum());
        
        report.put("accountSecurity", accountSecurity);

        // Security metrics
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("averagePasswordStrength", calculateAveragePasswordStrength());
        metrics.put("complianceScore", calculateComplianceScore());
        metrics.put("riskLevel", assessOverallRiskLevel());
        
        report.put("securityMetrics", metrics);

        // Recommendations
        List<String> recommendations = generateSecurityRecommendations(allUsers);
        report.put("recommendations", recommendations);

        report.put("generatedAt", LocalDateTime.now());
        
        return report;
    }

    /**
     * Send security alert
     */
    private void sendSecurityAlert(String alertType, String message) {
        securityLogger.error("SECURITY ALERT [{}]: {}", alertType, message);
        
        // In production, integrate with alerting systems (email, SMS, Slack, etc.)
        auditLogService.logSystemAction(
            "SECURITY_ALERT", 
            "Security", 
            String.format("Alert Type: %s, Message: %s", alertType, message)
        );
    }

    /**
     * Calculate average password strength (simplified)
     */
    private double calculateAveragePasswordStrength() {
        // In a real implementation, you'd analyze actual password complexity
        return 75.5; // Placeholder
    }

    /**
     * Calculate compliance score
     */
    private double calculateComplianceScore() {
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) return 100.0;
        
        double score = 100.0;
        
        // Deduct points for security issues
        long unverifiedUsers = users.stream().filter(u -> !u.isEmailVerified()).count();
        score -= (unverifiedUsers * 100.0 / users.size()) * 0.2;
        
        long disabledTwoFA = users.stream().filter(u -> !u.isTwoFactorEnabled()).count();
        score -= (disabledTwoFA * 100.0 / users.size()) * 0.3;
        
        long lockedAccounts = users.stream().filter(u -> !u.isAccountNonLocked()).count();
        score -= (lockedAccounts * 100.0 / users.size()) * 0.1;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Assess overall risk level
     */
    private String assessOverallRiskLevel() {
        double complianceScore = calculateComplianceScore();
        int blockedIPCount = blockedIPs.size();
        int failedAttemptCount = failedLoginAttempts.size();
        
        if (complianceScore < 60 || blockedIPCount > 10 || failedAttemptCount > 50) {
            return "HIGH";
        } else if (complianceScore < 80 || blockedIPCount > 5 || failedAttemptCount > 20) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    /**
     * Generate security recommendations
     */
    private List<String> generateSecurityRecommendations(List<User> users) {
        List<String> recommendations = new ArrayList<>();
        
        long unverifiedUsers = users.stream().filter(u -> !u.isEmailVerified()).count();
        if (unverifiedUsers > 0) {
            recommendations.add(String.format("Enable email verification for %d users", unverifiedUsers));
        }
        
        long disabledTwoFA = users.stream().filter(u -> !u.isTwoFactorEnabled()).count();
        if (disabledTwoFA > users.size() * 0.5) {
            recommendations.add("Enforce two-factor authentication for all users");
        }
        
        if (blockedIPs.size() > 5) {
            recommendations.add("Review and clean up blocked IP addresses");
        }
        
        if (failedLoginAttempts.size() > 20) {
            recommendations.add("Implement additional brute force protection measures");
        }
        
        return recommendations;
    }

    /**
     * Scheduled task to clean up old security events
     */
    @Scheduled(fixedDelay = 3600000) // Run every hour
    public void cleanupSecurityEvents() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        
        // Clean up old failed login attempts
        lastFailedAttempt.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
        failedLoginAttempts.entrySet().removeIf(entry -> 
            !lastFailedAttempt.containsKey(entry.getKey()));
        
        logger.debug("Security events cleanup completed");
    }

    /**
     * Check if user activity is suspicious
     */
    public boolean isActivitySuspicious(String userId, String action, Map<String, Object> context) {
        // Implement activity pattern analysis
        
        // Check for rapid consecutive actions
        if (context.containsKey("rapidActions") && (Boolean) context.get("rapidActions")) {
            return true;
        }
        
        // Check for unusual time activity
        LocalDateTime now = LocalDateTime.now();
        if (now.getHour() < 6 || now.getHour() > 22) {
            return true;
        }
        
        // Check for sensitive data access
        if (action.contains("EXPORT") || action.contains("DELETE")) {
            return true;
        }
        
        return false;
    }
}
