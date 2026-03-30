package com.arthmatic.shumelahire.entity.compliance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DataSubjectRequest extends TenantAwareEntity {

    private Long id;

    private String requesterName;

    private String requesterEmail;

    private DsarRequestType requestType;

    private String description;

    private DsarStatus status = DsarStatus.RECEIVED;

    private String response;

    private LocalDate dueDate;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public DsarRequestType getRequestType() { return requestType; }
    public void setRequestType(DsarRequestType requestType) { this.requestType = requestType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public DsarStatus getStatus() { return status; }
    public void setStatus(DsarStatus status) { this.status = status; }
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
