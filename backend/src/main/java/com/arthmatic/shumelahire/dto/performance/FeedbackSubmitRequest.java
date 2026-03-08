package com.arthmatic.shumelahire.dto.performance;

public class FeedbackSubmitRequest {

    private Long respondentId;
    private String ratings;
    private String comments;
    private String strengths;
    private String improvements;

    public FeedbackSubmitRequest() {}

    public Long getRespondentId() { return respondentId; }
    public void setRespondentId(Long respondentId) { this.respondentId = respondentId; }
    public String getRatings() { return ratings; }
    public void setRatings(String ratings) { this.ratings = ratings; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getImprovements() { return improvements; }
    public void setImprovements(String improvements) { this.improvements = improvements; }
}
