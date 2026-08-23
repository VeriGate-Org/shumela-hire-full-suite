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

    /**
     * The model's written assessment, when AI screening ran.
     *
     * <p>Stored alongside the deterministic score, never in place of it. The number a recruiter
     * defends is the one this class computes from the vacancy's stated requirements; the AI
     * contributes reasoning a person can read and disagree with. Null whenever AI is disabled,
     * unavailable, or the candidate has no readable CV — which is most of the time today.</p>
     */
    private String aiSummary;

    /** Skills the model found evidence for, as JSON. */
    private String aiMatchedSkills;

    /** Required skills the model could find no evidence for, as JSON. */
    private String aiMissingSkills;

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

    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

    public String getAiMatchedSkills() { return aiMatchedSkills; }
    public void setAiMatchedSkills(String aiMatchedSkills) { this.aiMatchedSkills = aiMatchedSkills; }

    public String getAiMissingSkills() { return aiMissingSkills; }
    public void setAiMissingSkills(String aiMissingSkills) { this.aiMissingSkills = aiMissingSkills; }
}
