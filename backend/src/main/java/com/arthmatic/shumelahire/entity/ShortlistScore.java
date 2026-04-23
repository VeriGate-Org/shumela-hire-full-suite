package com.arthmatic.shumelahire.entity;


import java.time.LocalDateTime;

public class ShortlistScore extends TenantAwareEntity {

    private String id;

    private Application application;

    private Double totalScore;

    private Double skillsMatchScore;

    private Double experienceScore;

    private Double educationScore;

    private Double screeningScore;

    private Double keywordMatchScore;

    private String scoreBreakdown;

    private Boolean isShortlisted = false;

    private Boolean manuallyOverridden = false;

    private String overrideReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public ShortlistScore() {
        this.createdAt = LocalDateTime.now();
    }

    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }

    public Double getTotalScore() { return totalScore; }
    public void setTotalScore(Double totalScore) { this.totalScore = totalScore; }

    public Double getSkillsMatchScore() { return skillsMatchScore; }
    public void setSkillsMatchScore(Double skillsMatchScore) { this.skillsMatchScore = skillsMatchScore; }

    public Double getExperienceScore() { return experienceScore; }
    public void setExperienceScore(Double experienceScore) { this.experienceScore = experienceScore; }

    public Double getEducationScore() { return educationScore; }
    public void setEducationScore(Double educationScore) { this.educationScore = educationScore; }

    public Double getScreeningScore() { return screeningScore; }
    public void setScreeningScore(Double screeningScore) { this.screeningScore = screeningScore; }

    public Double getKeywordMatchScore() { return keywordMatchScore; }
    public void setKeywordMatchScore(Double keywordMatchScore) { this.keywordMatchScore = keywordMatchScore; }

    public String getScoreBreakdown() { return scoreBreakdown; }
    public void setScoreBreakdown(String scoreBreakdown) { this.scoreBreakdown = scoreBreakdown; }

    public Boolean getIsShortlisted() { return isShortlisted; }
    public void setIsShortlisted(Boolean isShortlisted) { this.isShortlisted = isShortlisted; }

    public Boolean getManuallyOverridden() { return manuallyOverridden; }
    public void setManuallyOverridden(Boolean manuallyOverridden) { this.manuallyOverridden = manuallyOverridden; }

    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
