package com.arthmatic.shumelahire.entity;


import java.time.LocalDateTime;

public class ReportTemplate extends TenantAwareEntity {

    private String id;

    private String name;

    private String description;

    private String createdBy;

    private boolean shared = false;

    private boolean system = false;

    private int runCount = 0;

    private LocalDateTime lastRun;

    // JSON-serialized config fields
    private String fieldsJson;

    private String filtersJson;

    private String visualizationJson;

    private String scheduleJson;

    private String dateRangeJson;

    private String tagsJson;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public ReportTemplate() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public boolean isShared() { return shared; }
    public void setShared(boolean shared) { this.shared = shared; }

    public boolean isSystem() { return system; }
    public void setSystem(boolean system) { this.system = system; }

    public int getRunCount() { return runCount; }
    public void setRunCount(int runCount) { this.runCount = runCount; }

    public LocalDateTime getLastRun() { return lastRun; }
    public void setLastRun(LocalDateTime lastRun) { this.lastRun = lastRun; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
