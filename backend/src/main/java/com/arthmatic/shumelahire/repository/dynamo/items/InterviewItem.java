package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Interview entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  INTERVIEW#{id}
 *
 * GSI1 (status queries):
 *   GSI1PK: INTERVIEW_STATUS#{status}
 *   GSI1SK: INTERVIEW#{scheduledAt}
 *
 * GSI2 (FK lookup — interviews by application):
 *   GSI2PK: INTERVIEW_APP#{applicationId}
 *   GSI2SK: INTERVIEW#{scheduledAt}
 *
 * GSI5 (interviewer lookup):
 *   GSI5PK: INTERVIEW_INTERVIEWER#{interviewerId}
 *   GSI5SK: INTERVIEW#{scheduledAt}
 *
 * GSI6 (date range queries):
 *   GSI6PK: INTERVIEW_DATE#{tenantId}
 *   GSI6SK: #{scheduledAt}
 */
@DynamoDbBean
public class InterviewItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi5pk;
    private String gsi5sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String applicationId;
    private String title;
    private String type;
    private String round;
    private String status;
    private String scheduledAt;
    private Integer durationMinutes;
    private String location;
    private String meetingLink;
    private String meetingUrl;
    private String phoneNumber;
    private String meetingRoom;
    private String instructions;
    private String agenda;
    private String interviewerId;
    private String interviewerName;
    private String interviewerEmail;
    private String additionalInterviewers;
    private String feedback;
    private Integer rating;
    private String technicalAssessment;
    private Integer communicationSkills;
    private Integer technicalSkills;
    private Integer culturalFit;
    private Integer technicalScore;
    private Integer communicationScore;
    private Integer culturalFitScore;
    private String overallImpression;
    private String recommendation;
    private String nextSteps;
    private String candidateQuestions;
    private String interviewerNotes;
    private String questions;
    private String answers;
    private String notes;
    private String preparationNotes;
    private String rescheduledFrom;
    private String rescheduleReason;
    private Integer rescheduleCount;
    private Boolean reminderSent;
    private Boolean confirmationReceived;
    private String reminderSentAt;
    private String feedbackRequestedAt;
    private String feedbackSubmittedAt;
    private String createdBy;
    private String createdAt;
    private String updatedAt;
    private String startedAt;
    private String completedAt;
    private String cancelledAt;
    private String cancellationReason;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Status queries, sorted by scheduledAt ──────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: FK lookup — interviews by application ──────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI5: Interviewer lookup ─────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5PK")
    public String getGsi5pk() { return gsi5pk; }
    public void setGsi5pk(String gsi5pk) { this.gsi5pk = gsi5pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5SK")
    public String getGsi5sk() { return gsi5sk; }
    public void setGsi5sk(String gsi5sk) { this.gsi5sk = gsi5sk; }

    // ── GSI6: Date range queries ─────────────────────────────────────────────

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

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRound() { return round; }
    public void setRound(String round) { this.round = round; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }

    public String getMeetingUrl() { return meetingUrl; }
    public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getMeetingRoom() { return meetingRoom; }
    public void setMeetingRoom(String meetingRoom) { this.meetingRoom = meetingRoom; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getAgenda() { return agenda; }
    public void setAgenda(String agenda) { this.agenda = agenda; }

    public String getInterviewerId() { return interviewerId; }
    public void setInterviewerId(String interviewerId) { this.interviewerId = interviewerId; }

    public String getInterviewerName() { return interviewerName; }
    public void setInterviewerName(String interviewerName) { this.interviewerName = interviewerName; }

    public String getInterviewerEmail() { return interviewerEmail; }
    public void setInterviewerEmail(String interviewerEmail) { this.interviewerEmail = interviewerEmail; }

    public String getAdditionalInterviewers() { return additionalInterviewers; }
    public void setAdditionalInterviewers(String additionalInterviewers) { this.additionalInterviewers = additionalInterviewers; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getTechnicalAssessment() { return technicalAssessment; }
    public void setTechnicalAssessment(String technicalAssessment) { this.technicalAssessment = technicalAssessment; }

    public Integer getCommunicationSkills() { return communicationSkills; }
    public void setCommunicationSkills(Integer communicationSkills) { this.communicationSkills = communicationSkills; }

    public Integer getTechnicalSkills() { return technicalSkills; }
    public void setTechnicalSkills(Integer technicalSkills) { this.technicalSkills = technicalSkills; }

    public Integer getCulturalFit() { return culturalFit; }
    public void setCulturalFit(Integer culturalFit) { this.culturalFit = culturalFit; }

    public Integer getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Integer technicalScore) { this.technicalScore = technicalScore; }

    public Integer getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(Integer communicationScore) { this.communicationScore = communicationScore; }

    public Integer getCulturalFitScore() { return culturalFitScore; }
    public void setCulturalFitScore(Integer culturalFitScore) { this.culturalFitScore = culturalFitScore; }

    public String getOverallImpression() { return overallImpression; }
    public void setOverallImpression(String overallImpression) { this.overallImpression = overallImpression; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getNextSteps() { return nextSteps; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }

    public String getCandidateQuestions() { return candidateQuestions; }
    public void setCandidateQuestions(String candidateQuestions) { this.candidateQuestions = candidateQuestions; }

    public String getInterviewerNotes() { return interviewerNotes; }
    public void setInterviewerNotes(String interviewerNotes) { this.interviewerNotes = interviewerNotes; }

    public String getQuestions() { return questions; }
    public void setQuestions(String questions) { this.questions = questions; }

    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPreparationNotes() { return preparationNotes; }
    public void setPreparationNotes(String preparationNotes) { this.preparationNotes = preparationNotes; }

    public String getRescheduledFrom() { return rescheduledFrom; }
    public void setRescheduledFrom(String rescheduledFrom) { this.rescheduledFrom = rescheduledFrom; }

    public String getRescheduleReason() { return rescheduleReason; }
    public void setRescheduleReason(String rescheduleReason) { this.rescheduleReason = rescheduleReason; }

    public Integer getRescheduleCount() { return rescheduleCount; }
    public void setRescheduleCount(Integer rescheduleCount) { this.rescheduleCount = rescheduleCount; }

    public Boolean getReminderSent() { return reminderSent; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }

    public Boolean getConfirmationReceived() { return confirmationReceived; }
    public void setConfirmationReceived(Boolean confirmationReceived) { this.confirmationReceived = confirmationReceived; }

    public String getReminderSentAt() { return reminderSentAt; }
    public void setReminderSentAt(String reminderSentAt) { this.reminderSentAt = reminderSentAt; }

    public String getFeedbackRequestedAt() { return feedbackRequestedAt; }
    public void setFeedbackRequestedAt(String feedbackRequestedAt) { this.feedbackRequestedAt = feedbackRequestedAt; }

    public String getFeedbackSubmittedAt() { return feedbackSubmittedAt; }
    public void setFeedbackSubmittedAt(String feedbackSubmittedAt) { this.feedbackSubmittedAt = feedbackSubmittedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getStartedAt() { return startedAt; }
    public void setStartedAt(String startedAt) { this.startedAt = startedAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public String getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(String cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
}
