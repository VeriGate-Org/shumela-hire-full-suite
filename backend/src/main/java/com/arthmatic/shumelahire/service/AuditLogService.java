package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditLogService(AuditLogRepository auditLogRepository) {
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
    public AuditLog logUserAction(Long userId, String action, String entityType, String details) {
        return saveLog(userId.toString(), action, entityType, null, details);
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

    // Convenience methods used by recruitment services
    public void logApplicantAction(Long applicantId, String action, String entityType, String details) {
        saveLog(applicantId != null ? applicantId.toString() : "SYSTEM", action, entityType, details);
    }

    public void logAuthAction(String userId, String action, String entityType, String details) {
        saveLog(userId, action, entityType, details);
    }

    public void logDocumentAction(String userId, String action, String entityType, String details) {
        saveLog(userId, action, entityType, details);
    }

    public void logJobAdAction(Long userId, String action, String entityType, String details) {
        saveLog(userId != null ? userId.toString() : "SYSTEM", action, entityType, details);
    }
}