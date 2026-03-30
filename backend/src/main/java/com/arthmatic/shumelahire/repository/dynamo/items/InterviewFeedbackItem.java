package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the InterviewFeedback entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  INTERVIEW_FEEDBACK#{id}
 *
 * GSI2 (FK lookup — feedbacks by interview):
 *   GSI2PK: IFEEDBACK_INTERVIEW#{interviewId}
 *   GSI2SK: INTERVIEW_FEEDBACK#{submittedAt}
 *
 * GSI4 (unique constraint — one feedback per interviewer per interview):
 *   GSI4PK: IFEEDBACK_UNIQUE#{interviewId}#{submittedBy}
 *   GSI4SK: INTERVIEW_FEEDBACK#{id}
 *
 * GSI5 (feedbacks by submitter):
 *   GSI5PK: IFEEDBACK_SUBMITTER#{submittedBy}
 *   GSI5SK: INTERVIEW_FEEDBACK#{submittedAt}
 */
@DynamoDbBean
public class InterviewFeedbackItem {

    private String pk;
    private String sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi5pk;
    private String gsi5sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String interviewId;
    private String submittedBy;
    private String interviewerName;
    private String feedback;
    private Integer rating;
    private Integer communicationSkills;
    private Integer technicalSkills;
    private Integer culturalFit;
    private String overallImpression;
    private String recommendation;
    private String nextSteps;
    private String technicalAssessment;
    private String candidateQuestions;
    private String interviewerNotes;
    private String submittedAt;
    private String updatedAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI2: FK lookup — feedbacks by interview ─────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI4: Unique constraint — one feedback per interviewer per interview ─

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── GSI5: Feedbacks by submitter ─────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5PK")
    public String getGsi5pk() { return gsi5pk; }
    public void setGsi5pk(String gsi5pk) { this.gsi5pk = gsi5pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5SK")
    public String getGsi5sk() { return gsi5sk; }
    public void setGsi5sk(String gsi5sk) { this.gsi5sk = gsi5sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getInterviewId() { return interviewId; }
    public void setInterviewId(String interviewId) { this.interviewId = interviewId; }

    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }

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

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getNextSteps() { return nextSteps; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }

    public String getTechnicalAssessment() { return technicalAssessment; }
    public void setTechnicalAssessment(String technicalAssessment) { this.technicalAssessment = technicalAssessment; }

    public String getCandidateQuestions() { return candidateQuestions; }
    public void setCandidateQuestions(String candidateQuestions) { this.candidateQuestions = candidateQuestions; }

    public String getInterviewerNotes() { return interviewerNotes; }
    public void setInterviewerNotes(String interviewerNotes) { this.interviewerNotes = interviewerNotes; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
