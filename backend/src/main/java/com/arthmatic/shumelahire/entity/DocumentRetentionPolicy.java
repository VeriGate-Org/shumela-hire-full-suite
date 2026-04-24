package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class DocumentRetentionPolicy extends TenantAwareEntity {

    private String id;

    @NotBlank
    private String documentTypeCode;

    @NotNull
    private Integer retentionDays;

    @NotBlank
    private String action; // ARCHIVE, DELETE, NOTIFY

    private Boolean isActive = true;

    private Integer notifyDaysBeforeAction;

    private LocalDateTime createdAt;

    private String createdBy;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDocumentTypeCode() { return documentTypeCode; }
    public void setDocumentTypeCode(String documentTypeCode) { this.documentTypeCode = documentTypeCode; }

    public Integer getRetentionDays() { return retentionDays; }
    public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getNotifyDaysBeforeAction() { return notifyDaysBeforeAction; }
    public void setNotifyDaysBeforeAction(Integer notifyDaysBeforeAction) { this.notifyDaysBeforeAction = notifyDaysBeforeAction; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
