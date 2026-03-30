package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the ReportTemplate entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  REPORT_TEMPLATE#{id}
 *
 * Simple CRUD — no additional GSIs required.
 */
@DynamoDbBean
public class ReportTemplateItem {

    private String pk;
    private String sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String name;
    private String description;
    private String createdBy;
    private Boolean shared;
    private Boolean system;
    private Integer runCount;
    private String lastRun;
    private String fieldsJson;
    private String filtersJson;
    private String visualizationJson;
    private String scheduleJson;
    private String dateRangeJson;
    private String tagsJson;
    private String createdAt;
    private String updatedAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Boolean getShared() { return shared; }
    public void setShared(Boolean shared) { this.shared = shared; }

    public Boolean getSystem() { return system; }
    public void setSystem(Boolean system) { this.system = system; }

    public Integer getRunCount() { return runCount; }
    public void setRunCount(Integer runCount) { this.runCount = runCount; }

    public String getLastRun() { return lastRun; }
    public void setLastRun(String lastRun) { this.lastRun = lastRun; }

    public String getFieldsJson() { return fieldsJson; }
    public void setFieldsJson(String fieldsJson) { this.fieldsJson = fieldsJson; }

    public String getFiltersJson() { return filtersJson; }
    public void setFiltersJson(String filtersJson) { this.filtersJson = filtersJson; }

    public String getVisualizationJson() { return visualizationJson; }
    public void setVisualizationJson(String visualizationJson) { this.visualizationJson = visualizationJson; }

    public String getScheduleJson() { return scheduleJson; }
    public void setScheduleJson(String scheduleJson) { this.scheduleJson = scheduleJson; }

    public String getDateRangeJson() { return dateRangeJson; }
    public void setDateRangeJson(String dateRangeJson) { this.dateRangeJson = dateRangeJson; }

    public String getTagsJson() { return tagsJson; }
    public void setTagsJson(String tagsJson) { this.tagsJson = tagsJson; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
