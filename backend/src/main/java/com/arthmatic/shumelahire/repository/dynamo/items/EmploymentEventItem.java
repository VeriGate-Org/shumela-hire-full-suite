package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the EmploymentEvent entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  EMPEVENT#{id}
 *
 * GSI1 (event type queries):
 *   GSI1PK: EMPEVENT_TYPE#{tenantId}#{eventType}
 *   GSI1SK: EMPEVENT#{eventDate}#{id}
 *
 * GSI2 (FK lookup — events by employee):
 *   GSI2PK: EMPEVENT_EMP#{tenantId}#{employeeId}
 *   GSI2SK: EMPEVENT#{eventDate}#{id}
 *
 * GSI6 (date range — effective date):
 *   GSI6PK: EMPEVENT_DATE#{tenantId}
 *   GSI6SK: #{effectiveDate}#{id}
 */
@DynamoDbBean
public class EmploymentEventItem {

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
    private String employeeId;
    private String eventType;
    private String eventDate;
    private String effectiveDate;
    private String description;
    private String notes;
    private String previousDepartment;
    private String newDepartment;
    private String previousJobTitle;
    private String newJobTitle;
    private String previousJobGrade;
    private String newJobGrade;
    private String previousReportingManagerId;
    private String newReportingManagerId;
    private String previousLocation;
    private String newLocation;
    private String recordedBy;
    private String createdAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Event type queries ─────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: Events by employee ─────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI6: Effective date range ───────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(String effectiveDate) { this.effectiveDate = effectiveDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPreviousDepartment() { return previousDepartment; }
    public void setPreviousDepartment(String previousDepartment) { this.previousDepartment = previousDepartment; }

    public String getNewDepartment() { return newDepartment; }
    public void setNewDepartment(String newDepartment) { this.newDepartment = newDepartment; }

    public String getPreviousJobTitle() { return previousJobTitle; }
    public void setPreviousJobTitle(String previousJobTitle) { this.previousJobTitle = previousJobTitle; }

    public String getNewJobTitle() { return newJobTitle; }
    public void setNewJobTitle(String newJobTitle) { this.newJobTitle = newJobTitle; }

    public String getPreviousJobGrade() { return previousJobGrade; }
    public void setPreviousJobGrade(String previousJobGrade) { this.previousJobGrade = previousJobGrade; }

    public String getNewJobGrade() { return newJobGrade; }
    public void setNewJobGrade(String newJobGrade) { this.newJobGrade = newJobGrade; }

    public String getPreviousReportingManagerId() { return previousReportingManagerId; }
    public void setPreviousReportingManagerId(String previousReportingManagerId) { this.previousReportingManagerId = previousReportingManagerId; }

    public String getNewReportingManagerId() { return newReportingManagerId; }
    public void setNewReportingManagerId(String newReportingManagerId) { this.newReportingManagerId = newReportingManagerId; }

    public String getPreviousLocation() { return previousLocation; }
    public void setPreviousLocation(String previousLocation) { this.previousLocation = previousLocation; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
