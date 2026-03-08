package com.arthmatic.shumelahire.dto.engagement;

import com.arthmatic.shumelahire.entity.engagement.Survey;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class SurveyResponse {

    private Long id;
    private String title;
    private String description;
    private String status;
    private Boolean isAnonymous;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long createdBy;
    private List<SurveyQuestionResponse> questions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SurveyResponse() {}

    public static SurveyResponse fromEntity(Survey entity) {
        SurveyResponse r = new SurveyResponse();
        r.id = entity.getId();
        r.title = entity.getTitle();
        r.description = entity.getDescription();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.isAnonymous = entity.getIsAnonymous();
        r.startDate = entity.getStartDate();
        r.endDate = entity.getEndDate();
        r.createdBy = entity.getCreatedBy();
        if (entity.getQuestions() != null) {
            r.questions = entity.getQuestions().stream()
                    .map(SurveyQuestionResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public List<SurveyQuestionResponse> getQuestions() { return questions; }
    public void setQuestions(List<SurveyQuestionResponse> questions) { this.questions = questions; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
