package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the AgencySubmission entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  AGENCY_SUBMISSION#{id}
 *
 * GSI1 (status):
 *   GSI1PK: AGSUBM_STATUS#{tenantId}#{status}
 *   GSI1SK: AGENCY_SUBMISSION#{submittedAt}
 *
 * GSI2 (FK lookup — agency):
 *   GSI2PK: AGSUBM_AGENCY#{tenantId}#{agencyId}
 *   GSI2SK: AGENCY_SUBMISSION#{submittedAt}
 *
 * GSI6 (FK lookup — job posting):
 *   GSI6PK: AGSUBM_JOB#{tenantId}#{jobPostingId}
 *   GSI6SK: AGENCY_SUBMISSION#{submittedAt}
 */
@DynamoDbBean
public class AgencySubmissionItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String agencyId;
    private String jobPostingId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String cvFileKey;
    private String coverNote;
    private String status;
    private String linkedApplicationId;
    private String submittedAt;
    private String reviewedAt;
    private String reviewedBy;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Status query, sorted by submittedAt ───────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: FK lookup — agency ────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI6: FK lookup — job posting ───────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getAgencyId() { return agencyId; }
    public void setAgencyId(String agencyId) { this.agencyId = agencyId; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public String getCandidatePhone() { return candidatePhone; }
    public void setCandidatePhone(String candidatePhone) { this.candidatePhone = candidatePhone; }

    public String getCvFileKey() { return cvFileKey; }
    public void setCvFileKey(String cvFileKey) { this.cvFileKey = cvFileKey; }

    public String getCoverNote() { return coverNote; }
    public void setCoverNote(String coverNote) { this.coverNote = coverNote; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLinkedApplicationId() { return linkedApplicationId; }
    public void setLinkedApplicationId(String linkedApplicationId) { this.linkedApplicationId = linkedApplicationId; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(String reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
}
