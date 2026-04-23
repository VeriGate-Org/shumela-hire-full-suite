package com.arthmatic.shumelahire.dto.engagement;

import java.util.List;

public class SurveySubmitRequest {

    private String employeeId;
    private List<AnswerRequest> answers;

    public SurveySubmitRequest() {}

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public List<AnswerRequest> getAnswers() { return answers; }
    public void setAnswers(List<AnswerRequest> answers) { this.answers = answers; }

    public static class AnswerRequest {
        private String questionId;
        private Integer rating;
        private String textResponse;

        public AnswerRequest() {}

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }
        public String getTextResponse() { return textResponse; }
        public void setTextResponse(String textResponse) { this.textResponse = textResponse; }
    }
}
