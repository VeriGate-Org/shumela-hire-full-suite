package com.arthmatic.shumelahire.dto.integration;

import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;
import com.arthmatic.shumelahire.entity.integration.SageSyncLog;
import com.arthmatic.shumelahire.entity.integration.SyncDirection;
import com.arthmatic.shumelahire.entity.integration.SyncStatus;

import java.time.LocalDateTime;

public class SageSyncLogResponse {

    private String id;
    private String scheduleId;
    private String connectorId;
    private String connectorName;
    private SageSyncEntityType entityType;
    private SyncDirection direction;
    private SyncStatus status;
    private Integer recordsProcessed;
    private Integer recordsSucceeded;
    private Integer recordsFailed;
    private String errorMessage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public SageSyncLogResponse() {}

    public SageSyncLogResponse(SageSyncLog entity) {
        this.id = entity.getId();
        this.scheduleId = entity.getSchedule() != null ? entity.getSchedule().getId() : null;
        this.connectorId = entity.getConnector().getId();
        this.connectorName = entity.getConnector().getName();
        this.entityType = entity.getEntityType();
        this.direction = entity.getDirection();
        this.status = entity.getStatus();
        this.recordsProcessed = entity.getRecordsProcessed();
        this.recordsSucceeded = entity.getRecordsSucceeded();
        this.recordsFailed = entity.getRecordsFailed();
        this.errorMessage = entity.getErrorMessage();
        this.startedAt = entity.getStartedAt();
        this.completedAt = entity.getCompletedAt();
    }

    public static SageSyncLogResponse fromEntity(SageSyncLog entity) {
        return new SageSyncLogResponse(entity);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }

    public String getConnectorId() { return connectorId; }
    public void setConnectorId(String connectorId) { this.connectorId = connectorId; }

    public String getConnectorName() { return connectorName; }
    public void setConnectorName(String connectorName) { this.connectorName = connectorName; }

    public SageSyncEntityType getEntityType() { return entityType; }
    public void setEntityType(SageSyncEntityType entityType) { this.entityType = entityType; }

    public SyncDirection getDirection() { return direction; }
    public void setDirection(SyncDirection direction) { this.direction = direction; }

    public SyncStatus getStatus() { return status; }
    public void setStatus(SyncStatus status) { this.status = status; }

    public Integer getRecordsProcessed() { return recordsProcessed; }
    public void setRecordsProcessed(Integer recordsProcessed) { this.recordsProcessed = recordsProcessed; }

    public Integer getRecordsSucceeded() { return recordsSucceeded; }
    public void setRecordsSucceeded(Integer recordsSucceeded) { this.recordsSucceeded = recordsSucceeded; }

    public Integer getRecordsFailed() { return recordsFailed; }
    public void setRecordsFailed(Integer recordsFailed) { this.recordsFailed = recordsFailed; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
