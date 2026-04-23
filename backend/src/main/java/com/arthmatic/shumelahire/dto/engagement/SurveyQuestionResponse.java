package com.arthmatic.shumelahire.dto.engagement;

import com.arthmatic.shumelahire.entity.engagement.SurveyQuestion;

import java.time.LocalDateTime;

public class SurveyQuestionResponse {

    private String id;
    private String surveyId;
    private String questionText;
    private String questionType;
    private String options;
    private Integer displayOrder;
    private Boolean isRequired;
    private LocalDateTime createdAt;

    public SurveyQuestionResponse() {}

    public static SurveyQuestionResponse fromEntity(SurveyQuestion entity) {
        SurveyQuestionResponse r = new SurveyQuestionResponse();
        r.id = entity.getId();
        r.surveyId = entity.getSurvey() != null ? entity.getSurvey().getId() : null;
        r.questionText = entity.getQuestionText();
        r.questionType = entity.getQuestionType() != null ? entity.getQuestionType().name() : null;
        r.options = entity.getOptions();
        r.displayOrder = entity.getDisplayOrder();
        r.isRequired = entity.getIsRequired();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
