package com.arthmatic.shumelahire.dto.integration;

import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;
import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;
import com.arthmatic.shumelahire.entity.integration.SyncDirection;
import com.arthmatic.shumelahire.entity.integration.SyncFrequency;

import java.time.LocalDateTime;

public class SageSyncScheduleResponse {

    private Long id;
    private Long connectorId;
    private String connectorName;
    private SageSyncEntityType entityType;
    private SyncDirection direction;
    private SyncFrequency frequency;
    private String cronExpression;
    private Boolean isActive;
    private LocalDateTime lastRunAt;
    private LocalDateTime nextRunAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SageSyncScheduleResponse() {}

    public SageSyncScheduleResponse(SageSyncSchedule entity) {
        this.id = entity.getId();
        this.connectorId = entity.getConnector().getId();
        this.connectorName = entity.getConnector().getName();
        this.entityType = entity.getEntityType();
        this.direction = entity.getDirection();
        this.frequency = entity.getFrequency();
        this.cronExpression = entity.getCronExpression();
        this.isActive = entity.getIsActive();
        this.lastRunAt = entity.getLastRunAt();
        this.nextRunAt = entity.getNextRunAt();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    public static SageSyncScheduleResponse fromEntity(SageSyncSchedule entity) {
        return new SageSyncScheduleResponse(entity);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConnectorId() { return connectorId; }
    public void setConnectorId(Long connectorId) { this.connectorId = connectorId; }

    public String getConnectorName() { return connectorName; }
    public void setConnectorName(String connectorName) { this.connectorName = connectorName; }

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
