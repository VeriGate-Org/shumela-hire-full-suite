package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class ScreeningAnswer extends TenantAwareEntity {
    
    private String id;
    
    @NotNull(message = "Application ID is required")
    private String applicationId;
    
    @NotNull(message = "Screening question is required")
    private ScreeningQuestion screeningQuestion;
    
    private String answerValue;
    
    private String answerFileUrl; // For file upload questions
    
    private String answerFileName;
    
    private Boolean isValid = true;
    
    private String validationMessage;
    
    private LocalDateTime answeredAt;
    
    // Constructors
    public ScreeningAnswer() {}
    
    public ScreeningAnswer(String applicationId, ScreeningQuestion screeningQuestion, String answerValue) {
        this.applicationId = applicationId;
        this.screeningQuestion = screeningQuestion;
        this.answerValue = answerValue;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getApplicationId() {
        return applicationId;
    }
    
    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }
    
    public ScreeningQuestion getScreeningQuestion() {
        return screeningQuestion;
    }
    
    public void setScreeningQuestion(ScreeningQuestion screeningQuestion) {
        this.screeningQuestion = screeningQuestion;
    }
    
    public String getAnswerValue() {
        return answerValue;
    }
    
    public void setAnswerValue(String answerValue) {
        this.answerValue = answerValue;
    }
    
    public String getAnswerFileUrl() {
        return answerFileUrl;
    }
    
    public void setAnswerFileUrl(String answerFileUrl) {
        this.answerFileUrl = answerFileUrl;
    }
    
    public String getAnswerFileName() {
        return answerFileName;
    }
    
    public void setAnswerFileName(String answerFileName) {
        this.answerFileName = answerFileName;
    }
    
    public Boolean getIsValid() {
        return isValid;
    }
    
    public void setIsValid(Boolean isValid) {
        this.isValid = isValid;
    }
    
    public String getValidationMessage() {
        return validationMessage;
    }
    
    public void setValidationMessage(String validationMessage) {
        this.validationMessage = validationMessage;
    }
    
    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }
    
    public void setAnsweredAt(LocalDateTime answeredAt) {
        this.answeredAt = answeredAt;
    }
    
    // Helper methods
    public boolean isValid() {
        return Boolean.TRUE.equals(isValid);
    }
    
    public boolean hasFileAttachment() {
        return answerFileUrl != null && !answerFileUrl.trim().isEmpty();
    }
    
    public boolean isEmpty() {
        return (answerValue == null || answerValue.trim().isEmpty()) && 
               (answerFileUrl == null || answerFileUrl.trim().isEmpty());
    }
    
    @Override
    public String toString() {
        return "ScreeningAnswer{" +
                "id=" + id +
                ", applicationId=" + applicationId +
                ", questionId=" + (screeningQuestion != null ? screeningQuestion.getId() : null) +
                ", answerValue='" + answerValue + '\'' +
                ", isValid=" + isValid +
                ", answeredAt=" + answeredAt +
                '}';
    }
}