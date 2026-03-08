package com.arthmatic.shumelahire.dto.performance;

import java.time.LocalDate;

public class FeedbackRequestCreateRequest {

    private Long employeeId;
    private Long requesterId;
    private String feedbackType;
    private LocalDate dueDate;

    public FeedbackRequestCreateRequest() {}

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
    public String getFeedbackType() { return feedbackType; }
    public void setFeedbackType(String feedbackType) { this.feedbackType = feedbackType; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}
