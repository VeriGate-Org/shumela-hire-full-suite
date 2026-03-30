package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the PipelineTransition entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  PIPELINE_TRANS#{id}
 *
 * GSI1 (by toStage, sorted by creation date):
 *   GSI1PK: PTRANS_TO_STAGE#{toStage}
 *   GSI1SK: PIPELINE_TRANS#{createdAt_ISO}
 *
 * GSI2 (by application, sorted by creation date):
 *   GSI2PK: PTRANS_APP#{applicationId}
 *   GSI2SK: PIPELINE_TRANS#{createdAt_ISO}
 *
 * GSI6 (recent activity / date range per tenant):
 *   GSI6PK: PTRANS_CREATED#{tenantId}
 *   GSI6SK: PIPELINE_TRANS#{createdAt_ISO}
 */
@DynamoDbBean
public class PipelineTransitionItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String applicationId;
    private String fromStage;
    private String toStage;
    private String transitionType;
    private String reason;
    private String notes;
    private Boolean automated;
    private String triggeredByInterviewId;
    private String triggeredByAssessmentId;
    private String metadata;
    private String createdBy;
    private String createdAt;
    private String effectiveAt;
    private Long durationInPreviousStageHours;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI1: By toStage, sorted by creation date ----------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // -- GSI2: By application, sorted by creation date ------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI6: Recent activity / date range per tenant ------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getFromStage() { return fromStage; }
    public void setFromStage(String fromStage) { this.fromStage = fromStage; }

    public String getToStage() { return toStage; }
    public void setToStage(String toStage) { this.toStage = toStage; }

    public String getTransitionType() { return transitionType; }
    public void setTransitionType(String transitionType) { this.transitionType = transitionType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Boolean getAutomated() { return automated; }
    public void setAutomated(Boolean automated) { this.automated = automated; }

    public String getTriggeredByInterviewId() { return triggeredByInterviewId; }
    public void setTriggeredByInterviewId(String triggeredByInterviewId) { this.triggeredByInterviewId = triggeredByInterviewId; }

    public String getTriggeredByAssessmentId() { return triggeredByAssessmentId; }
    public void setTriggeredByAssessmentId(String triggeredByAssessmentId) { this.triggeredByAssessmentId = triggeredByAssessmentId; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getEffectiveAt() { return effectiveAt; }
    public void setEffectiveAt(String effectiveAt) { this.effectiveAt = effectiveAt; }

    public Long getDurationInPreviousStageHours() { return durationInPreviousStageHours; }
    public void setDurationInPreviousStageHours(Long durationInPreviousStageHours) { this.durationInPreviousStageHours = durationInPreviousStageHours; }
}
