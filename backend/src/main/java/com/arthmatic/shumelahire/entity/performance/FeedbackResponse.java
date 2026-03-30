package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class FeedbackResponse extends TenantAwareEntity {

    private Long id;

    private FeedbackRequest request;

    private Employee respondent;

    private String ratings;

    private String comments;

    private String strengths;

    private String improvements;

    private LocalDateTime submittedAt;

    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public FeedbackRequest getRequest() { return request; }
    public void setRequest(FeedbackRequest request) { this.request = request; }
    public Employee getRespondent() { return respondent; }
    public void setRespondent(Employee respondent) { this.respondent = respondent; }
    public String getRatings() { return ratings; }
    public void setRatings(String ratings) { this.ratings = ratings; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getImprovements() { return improvements; }
    public void setImprovements(String improvements) { this.improvements = improvements; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
