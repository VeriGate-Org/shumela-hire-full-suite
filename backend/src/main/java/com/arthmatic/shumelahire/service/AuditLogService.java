package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.repository.AuditLogDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogDataRepository auditLogRepository;

    @Autowired
    public AuditLogService(AuditLogDataRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Save an audit log entry
     *
     * @param userId     The ID of the user performing the action
     * @param action     The action being performed (e.g., "CREATE", "UPDATE", "DELETE")
     * @param entityType The type of entity being acted upon (e.g., "REQUISITION", "APPLICATION")
     * @param entityId   The ID of the specific entity instance
     * @param details    Additional details about the action
     * @return The saved audit log entry
     */
    public AuditLog saveLog(String userId, String action, String entityType, String entityId, String details) {
        try {
            AuditLog auditLog = new AuditLog(userId, action, entityType, entityId, details);
            auditLog.setUserName(resolveCurrentUserName());
            AuditLog savedLog = auditLogRepository.save(auditLog);

            logger.info("Audit log saved: User {} performed {} on {} with ID {}",
                       userId, action, entityType, entityId);

            return savedLog;
        } catch (Exception e) {
            logger.error("Failed to save audit log: User {} performed {} on {} with ID {}",
                        userId, action, entityType, entityId, e);
            throw new RuntimeException("Failed to save audit log", e);
        }
    }

    /**
     * Log user action (with Long userId)
     */
    public AuditLog logUserAction(String userId, String action, String entityType, String details) {
        return saveLog(userId, action, entityType, null, details);
    }

    /**
     * Log system action — gracefully skips if no tenant context is set
     * (e.g. from background jobs or scheduled tasks)
     */
    public AuditLog logSystemAction(String action, String entityType, String details) {
        if (TenantContext.getCurrentTenant() == null) {
            logger.debug("Skipping audit log for system action {} on {} — no tenant context", action, entityType);
            return null;
        }
        return saveLog("SYSTEM", action, entityType, null, details);
    }

    /**
     * Get audit logs for a specific user
     */
    public List<AuditLog> getUserAuditLogs(String userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * Save an audit log entry without entity ID (for actions not tied to specific entities)
     */
    public AuditLog saveLog(String userId, String action, String entityType, String details) {
        return saveLog(userId, action, entityType, null, details);
    }

    /**
     * Get all audit logs for a specific user
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByUser(String userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * Get all audit logs for a specific entity
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByEntity(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    /**
     * Get all audit logs for a specific action
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByAction(String action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    /**
     * Get audit logs within a time range
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(startTime, endTime);
    }

    /**
     * Get all audit logs (for admin purposes)
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    /**
     * Get all audit logs with pagination
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    /**
     * Audit logs matching a free-text query, across the whole log rather than one page.
     *
     * <p><strong>Why this exists.</strong> The admin console filtered the fifty entries it had
     * already been handed. That is invisible while a tenant holds one page and quietly wrong the
     * moment it holds ten: searching for a term whose only matches sit on page six returns nothing,
     * with no indication that anything was missed. On the IDC tenant, typing {@code ESCALAT} — the
     * one search that produces the requisition escalation, the governance record the audit trail
     * exists to hold — returned zero results, because those entries had aged onto page six of ten.
     * A search that silently reports "no matches" for a record that is present is worse than no
     * search at all: it reads as evidence of absence.</p>
     *
     * <p>Matching is deliberately broad — action, entity, user, role and the detail payload — since
     * the console offers one box and a person searching an audit trail is as likely to type a name
     * or a reference as an action. Underscores are treated as spaces on <em>both</em> sides, so
     * {@code escalated to executive} finds {@code REQUISITION_ESCALATED_TO_EXECUTIVE}: the console
     * displays actions with the underscores stripped, and a search should match what is on screen
     * rather than what is in storage.</p>
     *
     * <p>Cost is a filter over a list the repository already materialises — {@code findAll(Pageable)}
     * reads the whole table and slices it in memory regardless — so scanning every entry here adds
     * no reads. Should the log outgrow that, this and {@code findAll(Pageable)} need the same fix,
     * not different ones.</p>
     */
    public Page<AuditLog> searchLogs(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return getAllLogs(pageable);
        }
        String needle = normaliseForSearch(query);

        List<AuditLog> matched = auditLogRepository.findAll().stream()
                .filter(log -> matches(log, needle))
                // Newest first, and a null timestamp sorts last rather than throwing — the same
                // rule DynamoAuditLogRepository applies, so paged and searched views agree.
                .sorted(Comparator.comparing(
                        AuditLog::getTimestamp,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), matched.size());
        List<AuditLog> pageContent = start < matched.size() ? matched.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, matched.size());
    }

    /** Lower-cased, with underscores read as spaces so screen text and stored text both match. */
    private static String normaliseForSearch(String value) {
        return value == null ? "" : value.toLowerCase().replace('_', ' ');
    }

    private static boolean matches(AuditLog log, String needle) {
        if (log == null) return false;
        for (String field : new String[] {
                log.getAction(), log.getEntityType(), log.getEntityId(),
                log.getDetails(), log.getUserRole(), log.getUserName(), log.getUserId() }) {
            if (field != null && normaliseForSearch(field).contains(needle)) return true;
        }
        return false;
    }

    /**
     * Get audit logs by entity type with pagination
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable);
    }

    /**
     * Save an audit log entry with userRole
     */
    public AuditLog saveLog(String userId, String action, String entityType, String entityId, String details, String userRole) {
        try {
            AuditLog auditLog = new AuditLog(userId, action, entityType, entityId, details, userRole);
            auditLog.setUserName(resolveCurrentUserName());
            AuditLog savedLog = auditLogRepository.save(auditLog);

            logger.info("Audit log saved: User {} ({}) performed {} on {} with ID {}",
                       userId, userRole, action, entityType, entityId);

            return savedLog;
        } catch (Exception e) {
            logger.error("Failed to save audit log: User {} performed {} on {} with ID {}",
                        userId, action, entityType, entityId, e);
            throw new RuntimeException("Failed to save audit log", e);
        }
    }

    /**
     * Get recent logs for a specific entity
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogsByEntity(String entityType, String entityId) {
        return auditLogRepository.findRecentLogsByEntity(entityType, entityId);
    }

    /**
     * Get count of logs by action type
     */
    @Transactional(readOnly = true)
    public long getLogCountByAction(String action) {
        return auditLogRepository.countByAction(action);
    }

    /**
     * Resolve the display name of the currently authenticated user from the security context.
     * Falls back to null if no auth context or no name claims are available.
     */
    private String resolveCurrentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;

            Object principal = auth.getPrincipal();
            if (principal instanceof Jwt jwt) {
                // Try Cognito user attributes
                String name = jwt.getClaimAsString("name");
                if (name != null && !name.isBlank()) return name;
                String given = jwt.getClaimAsString("given_name");
                String family = jwt.getClaimAsString("family_name");
                if (given != null || family != null) {
                    return ((given != null ? given : "") + " " + (family != null ? family : "")).trim();
                }
                String email = jwt.getClaimAsString("email");
                if (email != null) return email;
            }

            String principalName = auth.getName();
            if (principalName != null && !principalName.isBlank()) return principalName;
        } catch (Exception e) {
            logger.debug("Could not resolve user name for audit log", e);
        }
        return null;
    }

    // Convenience methods used by recruitment services
    public void logApplicantAction(String applicantId, String action, String entityType, String details) {
        saveLog(applicantId != null ? applicantId : "SYSTEM", action, entityType, details);
    }

    public void logAuthAction(String userId, String action, String entityType, String details) {
        saveLog(userId, action, entityType, details);
    }

    public void logDocumentAction(String userId, String action, String entityType, String details) {
        saveLog(userId, action, entityType, details);
    }

    public void logJobAdAction(String userId, String action, String entityType, String details) {
        saveLog(userId != null ? userId : "SYSTEM", action, entityType, details);
    }
}