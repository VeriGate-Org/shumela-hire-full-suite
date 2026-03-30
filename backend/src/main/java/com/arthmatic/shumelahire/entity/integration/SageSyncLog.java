package com.arthmatic.shumelahire.entity.integration;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class SageSyncLog extends TenantAwareEntity {

    private Long id;

    private SageSyncSchedule schedule;

    private SageConnectorConfig connector;

    private SageSyncEntityType entityType;

    private SyncDirection direction;

    private SyncStatus status = SyncStatus.RUNNING;

    private Integer recordsProcessed = 0;

    private Integer recordsSucceeded = 0;

    private Integer recordsFailed = 0;

    private String errorMessage;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    public SageSyncLog() {
        this.startedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SageSyncSchedule getSchedule() { return schedule; }
    public void setSchedule(SageSyncSchedule schedule) { this.schedule = schedule; }

    public SageConnectorConfig getConnector() { return connector; }
    public void setConnector(SageConnectorConfig connector) { this.connector = connector; }

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
