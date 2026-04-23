package com.arthmatic.shumelahire.dto.engagement;

import java.util.List;

public class SurveyResultsResponse {

    private String surveyId;
    private String surveyTitle;
    private Long totalRespondents;
    private List<QuestionResult> questionResults;

    public SurveyResultsResponse() {}

    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
    public String getSurveyTitle() { return surveyTitle; }
    public void setSurveyTitle(String surveyTitle) { this.surveyTitle = surveyTitle; }
    public Long getTotalRespondents() { return totalRespondents; }
    public void setTotalRespondents(Long totalRespondents) { this.totalRespondents = totalRespondents; }
    public List<QuestionResult> getQuestionResults() { return questionResults; }
    public void setQuestionResults(List<QuestionResult> questionResults) { this.questionResults = questionResults; }

    public static class QuestionResult {
        private String questionId;
        private String questionText;
        private String questionType;
        private Double averageRating;
        private List<String> textResponses;
        private Long responseCount;

        public QuestionResult() {}

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getQuestionType() { return questionType; }
        public void setQuestionType(String questionType) { this.questionType = questionType; }
        public Double getAverageRating() { return averageRating; }
        public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
        public List<String> getTextResponses() { return textResponses; }
        public void setTextResponses(List<String> textResponses) { this.textResponses = textResponses; }
        public Long getResponseCount() { return responseCount; }
        public void setResponseCount(Long responseCount) { this.responseCount = responseCount; }
    }
}
