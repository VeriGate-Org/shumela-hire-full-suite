package com.arthmatic.shumelahire.dto.compliance;

import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DataSubjectRequestResponse {

    private Long id;
    private String requesterName;
    private String requesterEmail;
    private String requestType;
    private String description;
    private String status;
    private String response;
    private LocalDate dueDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DataSubjectRequestResponse() {}

    public static DataSubjectRequestResponse fromEntity(DataSubjectRequest entity) {
        DataSubjectRequestResponse r = new DataSubjectRequestResponse();
        r.id = entity.getId();
        r.requesterName = entity.getRequesterName();
        r.requesterEmail = entity.getRequesterEmail();
        r.requestType = entity.getRequestType() != null ? entity.getRequestType().name() : null;
        r.description = entity.getDescription();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.response = entity.getResponse();
        r.dueDate = entity.getDueDate();
        r.completedAt = entity.getCompletedAt();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
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
