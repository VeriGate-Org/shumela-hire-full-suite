package com.arthmatic.shumelahire.entity.integration;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class LmsSyncLog extends TenantAwareEntity {

    private Long id;

    private LmsConnectorConfig connector;

    private LmsSyncType syncType;

    private LmsSyncStatus status;

    private Integer recordsSynced = 0;

    private String errorMessage;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    public LmsSyncLog() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LmsConnectorConfig getConnector() { return connector; }
    public void setConnector(LmsConnectorConfig connector) { this.connector = connector; }

    public LmsSyncType getSyncType() { return syncType; }
    public void setSyncType(LmsSyncType syncType) { this.syncType = syncType; }

    public LmsSyncStatus getStatus() { return status; }
    public void setStatus(LmsSyncStatus status) { this.status = status; }

    public Integer getRecordsSynced() { return recordsSynced; }
    public void setRecordsSynced(Integer recordsSynced) { this.recordsSynced = recordsSynced; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
