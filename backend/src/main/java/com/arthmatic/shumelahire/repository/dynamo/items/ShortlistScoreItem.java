package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the ShortlistScore entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  SHORTLIST#{id}
 *
 * GSI2 (FK lookup -- scores by application, unique per application):
 *   GSI2PK: SHORTLIST_APP#{applicationId}
 *   GSI2SK: SHORTLIST#{id}
 *
 * GSI5 (job posting lookup, sorted by score for ranking):
 *   GSI5PK: SHORTLIST_JOB#{jobPostingId}
 *   GSI5SK: SHORTLIST#SCORE#{paddedScore}
 */
@DynamoDbBean
public class ShortlistScoreItem {

    private String pk;
    private String sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi5pk;
    private String gsi5sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String applicationId;
    private String jobPostingId;
    private Double totalScore;
    private Double skillsMatchScore;
    private Double experienceScore;
    private Double educationScore;
    private Double screeningScore;
    private Double keywordMatchScore;
    private String scoreBreakdown;
    private Boolean isShortlisted;
    private Boolean manuallyOverridden;
    private String overrideReason;
    private String createdAt;
    private String updatedAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI2: FK lookup -- scores by application -----------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI5: Job posting lookup, sorted by score ----------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5PK")
    public String getGsi5pk() { return gsi5pk; }
    public void setGsi5pk(String gsi5pk) { this.gsi5pk = gsi5pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5SK")
    public String getGsi5sk() { return gsi5sk; }
    public void setGsi5sk(String gsi5sk) { this.gsi5sk = gsi5sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

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

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
