package com.arthmatic.shumelahire.entity.integration;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class SageSyncSchedule extends TenantAwareEntity {

    private Long id;

    private SageConnectorConfig connector;

    private SageSyncEntityType entityType;

    private SyncDirection direction = SyncDirection.IMPORT;

    private SyncFrequency frequency = SyncFrequency.DAILY;

    private String cronExpression;

    private Boolean isActive = true;

    private LocalDateTime lastRunAt;

    private LocalDateTime nextRunAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public SageSyncSchedule() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SageConnectorConfig getConnector() { return connector; }
    public void setConnector(SageConnectorConfig connector) { this.connector = connector; }

    public SageSyncEntityType getEntityType() { return entityType; }
    public void setEntityType(SageSyncEntityType entityType) { this.entityType = entityType; }

    public SyncDirection getDirection() { return direction; }
    public void setDirection(SyncDirection direction) { this.direction = direction; }

    public SyncFrequency getFrequency() { return frequency; }
    public void setFrequency(SyncFrequency frequency) { this.frequency = frequency; }

    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getLastRunAt() { return lastRunAt; }
    public void setLastRunAt(LocalDateTime lastRunAt) { this.lastRunAt = lastRunAt; }

    public LocalDateTime getNextRunAt() { return nextRunAt; }
    public void setNextRunAt(LocalDateTime nextRunAt) { this.nextRunAt = nextRunAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
