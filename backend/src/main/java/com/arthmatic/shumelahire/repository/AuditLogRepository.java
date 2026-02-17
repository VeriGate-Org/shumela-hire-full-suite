package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Find audit logs by user ID
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);

    // Find audit logs by entity type and ID
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);

    // Find audit logs by action
    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    // Find audit logs within a time range
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startTime, LocalDateTime endTime);

    // Custom query to find recent audit logs for a specific entity
    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentLogsByEntity(@Param("entityType") String entityType, @Param("entityId") String entityId);

    // Count audit logs by action
    long countByAction(String action);
}