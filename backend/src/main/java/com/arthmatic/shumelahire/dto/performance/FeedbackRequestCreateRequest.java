package com.arthmatic.shumelahire.dto.performance;

import java.time.LocalDate;

public class FeedbackRequestCreateRequest {

    private String employeeId;
    private String requesterId;
    private String feedbackType;
    private LocalDate dueDate;

    public FeedbackRequestCreateRequest() {}

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }
    public String getFeedbackType() { return feedbackType; }
    public void setFeedbackType(String feedbackType) { this.feedbackType = feedbackType; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}
