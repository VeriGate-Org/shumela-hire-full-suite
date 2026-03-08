package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.FeedbackRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class FeedbackRequestResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long requesterId;
    private String requesterName;
    private String feedbackType;
    private String status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FeedbackRequestResponse() {}

    public static FeedbackRequestResponse fromEntity(FeedbackRequest entity) {
        FeedbackRequestResponse r = new FeedbackRequestResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.requesterId = entity.getRequester() != null ? entity.getRequester().getId() : null;
        r.requesterName = entity.getRequester() != null ?
                entity.getRequester().getFirstName() + " " + entity.getRequester().getLastName() : null;
        r.feedbackType = entity.getFeedbackType() != null ? entity.getFeedbackType().name() : null;
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.dueDate = entity.getDueDate();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getFeedbackType() { return feedbackType; }
    public void setFeedbackType(String feedbackType) { this.feedbackType = feedbackType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
