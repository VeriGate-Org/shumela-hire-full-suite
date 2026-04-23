package com.arthmatic.shumelahire.dto.integration;

import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;
import com.arthmatic.shumelahire.entity.integration.SyncDirection;
import com.arthmatic.shumelahire.entity.integration.SyncFrequency;

public class SageSyncScheduleRequest {

    private String connectorId;
    private SageSyncEntityType entityType;
    private SyncDirection direction;
    private SyncFrequency frequency;
    private String cronExpression;

    public SageSyncScheduleRequest() {}

    public String getConnectorId() { return connectorId; }
    public void setConnectorId(String connectorId) { this.connectorId = connectorId; }

    public SageSyncEntityType getEntityType() { return entityType; }
    public void setEntityType(SageSyncEntityType entityType) { this.entityType = entityType; }

    public SyncDirection getDirection() { return direction; }
    public void setDirection(SyncDirection direction) { this.direction = direction; }

    public SyncFrequency getFrequency() { return frequency; }
    public void setFrequency(SyncFrequency frequency) { this.frequency = frequency; }

    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }
}
