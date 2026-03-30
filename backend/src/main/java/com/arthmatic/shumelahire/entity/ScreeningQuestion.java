package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ScreeningQuestion extends TenantAwareEntity {
    
    private Long id;
    
    @NotNull(message = "Job posting ID is required")
    private Long jobPostingId;
    
    @NotBlank(message = "Question text is required")
    private String questionText;
    
    @NotNull(message = "Question type is required")
    private QuestionType questionType;
    
    private Boolean isRequired = false;
    
    private Integer displayOrder = 0;
    
    private String questionOptions; // JSON array for dropdown/multiple choice options
    
    private String validationRules; // JSON for custom validation
    
    private String helpText;
    
    private Boolean isActive = true;
    
    @NotBlank(message = "Created by is required")
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private List<com.arthmatic.shumelahire.entity.ScreeningAnswer> answers = new ArrayList<>();
    
    // Constructors
    public ScreeningQuestion() {}
    
    public ScreeningQuestion(Long jobPostingId, String questionText, QuestionType questionType, String createdBy) {
        this.jobPostingId = jobPostingId;
        this.questionText = questionText;
        this.questionType = questionType;
        this.createdBy = createdBy;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getJobPostingId() {
        return jobPostingId;
    }
    
    public void setJobPostingId(Long jobPostingId) {
        this.jobPostingId = jobPostingId;
    }
    
    public String getQuestionText() {
        return questionText;
    }
    
    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }
    
    public QuestionType getQuestionType() {
        return questionType;
    }
    
    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }
    
    public Boolean getIsRequired() {
        return isRequired;
    }
    
    public void setIsRequired(Boolean isRequired) {
        this.isRequired = isRequired;
    }
    
    public Integer getDisplayOrder() {
        return displayOrder;
    }
    
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
    
    public String getQuestionOptions() {
        return questionOptions;
    }
    
    public void setQuestionOptions(String questionOptions) {
        this.questionOptions = questionOptions;
    }
    
    public String getValidationRules() {
        return validationRules;
    }
    
    public void setValidationRules(String validationRules) {
        this.validationRules = validationRules;
    }
    
    public String getHelpText() {
        return helpText;
    }
    
    public void setHelpText(String helpText) {
        this.helpText = helpText;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<com.arthmatic.shumelahire.entity.ScreeningAnswer> getAnswers() {
        return answers;
    }
    
    public void setAnswers(List<com.arthmatic.shumelahire.entity.ScreeningAnswer> answers) {
        this.answers = answers;
    }
    
    // Helper methods
    public boolean isRequired() {
        return Boolean.TRUE.equals(isRequired);
    }
    
    public boolean isActive() {
        return Boolean.TRUE.equals(isActive);
    }
    
    public boolean hasOptions() {
        return questionType == QuestionType.DROPDOWN || 
               questionType == QuestionType.MULTIPLE_CHOICE || 
               questionType == QuestionType.CHECKBOX;
    }
    
    @Override
    public String toString() {
        return "ScreeningQuestion{" +
                "id=" + id +
                ", jobPostingId=" + jobPostingId +
                ", questionText='" + questionText + '\'' +
                ", questionType=" + questionType +
                ", isRequired=" + isRequired +
                ", displayOrder=" + displayOrder +
                '}';
    }
}