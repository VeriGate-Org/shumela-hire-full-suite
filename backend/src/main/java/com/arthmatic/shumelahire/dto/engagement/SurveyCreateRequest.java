package com.arthmatic.shumelahire.dto.engagement;

import java.time.LocalDate;
import java.util.List;

public class SurveyCreateRequest {

    private String title;
    private String description;
    private Boolean isAnonymous;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<QuestionRequest> questions;

    public SurveyCreateRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<QuestionRequest> getQuestions() { return questions; }
    public void setQuestions(List<QuestionRequest> questions) { this.questions = questions; }

    public static class QuestionRequest {
        private String questionText;
        private String questionType;
        private String options;
        private Integer displayOrder;
        private Boolean isRequired;

        public QuestionRequest() {}

        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getQuestionType() { return questionType; }
        public void setQuestionType(String questionType) { this.questionType = questionType; }
        public String getOptions() { return options; }
        public void setOptions(String options) { this.options = options; }
        public Integer getDisplayOrder() { return displayOrder; }
        public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
        public Boolean getIsRequired() { return isRequired; }
        public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }
    }
}
