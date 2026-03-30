package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InterviewFeedback extends TenantAwareEntity {

    private Long id;

    @JsonIgnoreProperties({"feedbacks", "hibernateLazyInitializer", "handler"})
    private Interview interview;

    private Long submittedBy;

    private String interviewerName;

    @NotBlank(message = "Feedback text is required")
    private String feedback;

    @Min(1) @Max(5)
    private Integer rating;

    @Min(1) @Max(5)
    private Integer communicationSkills;

    @Min(1) @Max(5)
    private Integer technicalSkills;

    @Min(1) @Max(5)
    private Integer culturalFit;

    private String overallImpression;

    @NotNull(message = "Recommendation is required")
    private InterviewRecommendation recommendation;

    private String nextSteps;

    private String technicalAssessment;

    private String candidateQuestions;

    private String interviewerNotes;

    private LocalDateTime submittedAt;

    private LocalDateTime updatedAt;

    public InterviewFeedback() {
        this.submittedAt = LocalDateTime.now();
    }

    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Computed
    public Double getAverageSkillRating() {
        if (communicationSkills == null || technicalSkills == null || culturalFit == null) {
            return null;
        }
        return (communicationSkills + technicalSkills + culturalFit) / 3.0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Interview getInterview() { return interview; }
    public void setInterview(Interview interview) { this.interview = interview; }

    public Long getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(Long submittedBy) { this.submittedBy = submittedBy; }

    public String getInterviewerName() { return interviewerName; }
    public void setInterviewerName(String interviewerName) { this.interviewerName = interviewerName; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public Integer getCommunicationSkills() { return communicationSkills; }
    public void setCommunicationSkills(Integer communicationSkills) { this.communicationSkills = communicationSkills; }

    public Integer getTechnicalSkills() { return technicalSkills; }
    public void setTechnicalSkills(Integer technicalSkills) { this.technicalSkills = technicalSkills; }

    public Integer getCulturalFit() { return culturalFit; }
    public void setCulturalFit(Integer culturalFit) { this.culturalFit = culturalFit; }

    public String getOverallImpression() { return overallImpression; }
    public void setOverallImpression(String overallImpression) { this.overallImpression = overallImpression; }

    public InterviewRecommendation getRecommendation() { return recommendation; }
    public void setRecommendation(InterviewRecommendation recommendation) { this.recommendation = recommendation; }

    public String getNextSteps() { return nextSteps; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }

    public String getTechnicalAssessment() { return technicalAssessment; }
    public void setTechnicalAssessment(String technicalAssessment) { this.technicalAssessment = technicalAssessment; }

    public String getCandidateQuestions() { return candidateQuestions; }
    public void setCandidateQuestions(String candidateQuestions) { this.candidateQuestions = candidateQuestions; }

    public String getInterviewerNotes() { return interviewerNotes; }
    public void setInterviewerNotes(String interviewerNotes) { this.interviewerNotes = interviewerNotes; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
