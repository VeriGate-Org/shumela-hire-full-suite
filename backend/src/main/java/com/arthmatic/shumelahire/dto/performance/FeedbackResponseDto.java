package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.FeedbackResponse;

import java.time.LocalDateTime;

public class FeedbackResponseDto {

    private String id;
    private String requestId;
    private String respondentId;
    private String respondentName;
    private String ratings;
    private String comments;
    private String strengths;
    private String improvements;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;

    public FeedbackResponseDto() {}

    public static FeedbackResponseDto fromEntity(FeedbackResponse entity) {
        FeedbackResponseDto r = new FeedbackResponseDto();
        r.id = entity.getId();
        r.requestId = entity.getRequest() != null ? entity.getRequest().getId() : null;
        r.respondentId = entity.getRespondent() != null ? entity.getRespondent().getId() : null;
        r.respondentName = entity.getRespondent() != null ?
                entity.getRespondent().getFirstName() + " " + entity.getRespondent().getLastName() : null;
        r.ratings = entity.getRatings();
        r.comments = entity.getComments();
        r.strengths = entity.getStrengths();
        r.improvements = entity.getImprovements();
        r.submittedAt = entity.getSubmittedAt();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public String getRespondentId() { return respondentId; }
    public void setRespondentId(String respondentId) { this.respondentId = respondentId; }
    public String getRespondentName() { return respondentName; }
    public void setRespondentName(String respondentName) { this.respondentName = respondentName; }
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
