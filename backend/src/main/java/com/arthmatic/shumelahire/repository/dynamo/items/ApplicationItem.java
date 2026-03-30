package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Application entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  APPLICATION#{id}
 *
 * GSI1 (status queries — sorted by submission date):
 *   GSI1PK: APP_STATUS#{status}
 *   GSI1SK: APP#{submittedAt}
 *
 * GSI2 (FK lookup — by jobPostingId):
 *   GSI2PK: APP_JOB_POSTING#{jobPostingId}
 *   GSI2SK: APP#{id}
 *
 * GSI3 (department — sorted by submission date):
 *   GSI3PK: APP_DEPT#{department}
 *   GSI3SK: APP#{submittedAt}
 *
 * GSI4 (applicant lookup):
 *   GSI4PK: APP_APPLICANT#{applicantId}
 *   GSI4SK: APP#{id}
 *
 * GSI6 (date range — sorted by submission date per tenant):
 *   GSI6PK: APP_CREATED#{tenantId}
 *   GSI6SK: APP#{submittedAt}
 */
@DynamoDbBean
public class ApplicationItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi3pk;
    private String gsi3sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields (all stored as Strings)
    private String id;
    private String tenantId;
    private String applicantId;
    private String jobPostingId;
    private String jobTitle;
    private String jobId;
    private String department;
    private String status;
    private String pipelineStage;
    private String pipelineStageEnteredAt;
    private String coverLetter;
    private String applicationSource;
    private String submittedAt;
    private String withdrawnAt;
    private String withdrawalReason;
    private String screeningNotes;
    private String interviewFeedback;
    private String rating;
    private String rejectionReason;
    private String offerDetails;
    private String startDate;
    private String salaryExpectation;
    private String availabilityDate;
    private String interviewedAt;
    private String offerExtendedAt;
    private String responseDeadline;
    private String createdAt;
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

    // ── GSI1: Status queries (sorted by submission date) ────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: FK lookup by jobPostingId ─────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI3: Department queries (sorted by submission date) ────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3PK")
    public String getGsi3pk() { return gsi3pk; }
    public void setGsi3pk(String gsi3pk) { this.gsi3pk = gsi3pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3SK")
    public String getGsi3sk() { return gsi3sk; }
    public void setGsi3sk(String gsi3sk) { this.gsi3sk = gsi3sk; }

    // ── GSI4: Applicant lookup ──────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── GSI6: Date range queries per tenant ─────────────────────────────────

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

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPipelineStage() { return pipelineStage; }
    public void setPipelineStage(String pipelineStage) { this.pipelineStage = pipelineStage; }

    public String getPipelineStageEnteredAt() { return pipelineStageEnteredAt; }
    public void setPipelineStageEnteredAt(String pipelineStageEnteredAt) { this.pipelineStageEnteredAt = pipelineStageEnteredAt; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public String getApplicationSource() { return applicationSource; }
    public void setApplicationSource(String applicationSource) { this.applicationSource = applicationSource; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getWithdrawnAt() { return withdrawnAt; }
    public void setWithdrawnAt(String withdrawnAt) { this.withdrawnAt = withdrawnAt; }

    public String getWithdrawalReason() { return withdrawalReason; }
    public void setWithdrawalReason(String withdrawalReason) { this.withdrawalReason = withdrawalReason; }

    public String getScreeningNotes() { return screeningNotes; }
    public void setScreeningNotes(String screeningNotes) { this.screeningNotes = screeningNotes; }

    public String getInterviewFeedback() { return interviewFeedback; }
    public void setInterviewFeedback(String interviewFeedback) { this.interviewFeedback = interviewFeedback; }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getOfferDetails() { return offerDetails; }
    public void setOfferDetails(String offerDetails) { this.offerDetails = offerDetails; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getSalaryExpectation() { return salaryExpectation; }
    public void setSalaryExpectation(String salaryExpectation) { this.salaryExpectation = salaryExpectation; }

    public String getAvailabilityDate() { return availabilityDate; }
    public void setAvailabilityDate(String availabilityDate) { this.availabilityDate = availabilityDate; }

    public String getInterviewedAt() { return interviewedAt; }
    public void setInterviewedAt(String interviewedAt) { this.interviewedAt = interviewedAt; }

    public String getOfferExtendedAt() { return offerExtendedAt; }
    public void setOfferExtendedAt(String offerExtendedAt) { this.offerExtendedAt = offerExtendedAt; }

    public String getResponseDeadline() { return responseDeadline; }
    public void setResponseDeadline(String responseDeadline) { this.responseDeadline = responseDeadline; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
