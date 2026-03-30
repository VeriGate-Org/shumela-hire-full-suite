package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Interview extends TenantAwareEntity {

    private Long id;

    private Long version;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Application application;

    private Long applicationId;

    private String title;

    private InterviewType type = InterviewType.PHONE;

    private InterviewRound round = InterviewRound.SCREENING;

    private InterviewStatus status = InterviewStatus.SCHEDULED;

    @NotNull(message = "Interview date/time is required")
    private LocalDateTime scheduledAt;

    private Integer durationMinutes = 60;

    private String location;

    private String meetingLink;

    private String meetingUrl;

    private String phoneNumber;

    private String meetingRoom;

    private String instructions;

    private String agenda;

    private Long interviewerId;

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

    private InterviewRecommendation recommendation;

    private String nextSteps;

    private String candidateQuestions;

    private String interviewerNotes;

    private String questions;

    private String answers;

    private String notes;

    private String preparationNotes;

    private LocalDateTime rescheduledFrom;

    private String rescheduleReason;

    private Integer rescheduleCount = 0;

    private Boolean reminderSent = false;

    private Boolean confirmationReceived = false;

    private LocalDateTime reminderSentAt;

    private LocalDateTime feedbackRequestedAt;

    private LocalDateTime feedbackSubmittedAt;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;

    private String cancellationReason;

    @JsonIgnoreProperties({"interview"})
    private List<InterviewFeedback> feedbacks = new ArrayList<>();

    // Constructors
    public Interview() {
        this.createdAt = LocalDateTime.now();
    }

    public Interview(Application application, LocalDateTime scheduledAt, Long interviewerId, InterviewType type) {
        this();
        this.application = application;
        this.scheduledAt = scheduledAt;
        this.interviewerId = interviewerId;
        this.type = type;
        this.title = generateDefaultTitle();
    }

    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    @JsonProperty("canBeRescheduled")
    public boolean canBeRescheduled() {
        return status == InterviewStatus.SCHEDULED &&
               scheduledAt.isAfter(LocalDateTime.now().plusHours(2));
    }

    @JsonProperty("canBeCancelled")
    public boolean canBeCancelled() {
        return status == InterviewStatus.SCHEDULED || status == InterviewStatus.RESCHEDULED;
    }

    @JsonProperty("canBeStarted")
    public boolean canBeStarted() {
        return status == InterviewStatus.SCHEDULED &&
               LocalDateTime.now().isAfter(scheduledAt.minusMinutes(15)) &&
               LocalDateTime.now().isBefore(getEndTime().plusMinutes(30));
    }

    @JsonProperty("canBeCompleted")
    public boolean canBeCompleted() {
        return status == InterviewStatus.IN_PROGRESS;
    }

    @JsonProperty("requiresFeedback")
    public boolean requiresFeedback() {
        return status == InterviewStatus.COMPLETED && (feedbacks == null || feedbacks.isEmpty());
    }

    @JsonProperty("feedbackCount")
    public int getFeedbackCount() {
        return feedbacks != null ? feedbacks.size() : 0;
    }

    @JsonProperty("isOverdue")
    public boolean isOverdue() {
        return status == InterviewStatus.SCHEDULED &&
               LocalDateTime.now().isAfter(getEndTime().plusMinutes(15));
    }

    @JsonProperty("isUpcoming")
    public boolean isUpcoming() {
        return status == InterviewStatus.SCHEDULED &&
               scheduledAt.isAfter(LocalDateTime.now()) &&
               scheduledAt.isBefore(LocalDateTime.now().plusDays(7));
    }

    public boolean needsReminder() {
        return isUpcoming() &&
               (reminderSent == null || !reminderSent) &&
               scheduledAt.minusHours(24).isBefore(LocalDateTime.now());
    }

    public LocalDateTime getEndTime() {
        return scheduledAt.plusMinutes(durationMinutes);
    }

    public long getMinutesUntilInterview() {
        return ChronoUnit.MINUTES.between(LocalDateTime.now(), scheduledAt);
    }

    public String getStatusDisplayName() {
        return status.getDisplayName();
    }

    public String getTypeDisplayName() {
        return type.getDisplayName();
    }

    public String getRoundDisplayName() {
        return round.getDisplayName();
    }

    public Double getAverageSkillRating() {
        if (communicationSkills == null || technicalSkills == null || culturalFit == null) {
            return null;
        }
        return (communicationSkills + technicalSkills + culturalFit) / 3.0;
    }

    public Double getOverallScore() {
        if (technicalScore == null || communicationScore == null || culturalFitScore == null) {
            return null;
        }
        return (technicalScore + communicationScore + culturalFitScore) / 3.0;
    }

    public boolean hasConflictWith(LocalDateTime otherStart, LocalDateTime otherEnd) {
        LocalDateTime thisEnd = getEndTime();
        return !(thisEnd.isBefore(otherStart) || scheduledAt.isAfter(otherEnd));
    }

    private String generateDefaultTitle() {
        if (application != null && application.getJobPosting() != null) {
            return round.getDisplayName() + " Interview - " + application.getJobPosting().getTitle();
        }
        return round.getDisplayName() + " Interview";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) {
        this.application = application;
        if (application != null && title == null) {
            this.title = generateDefaultTitle();
        }
    }

    public Long getApplicationId() {
        if (applicationId != null) return applicationId;
        return application != null ? application.getId() : null;
    }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public InterviewType getType() { return type; }
    public void setType(InterviewType type) { this.type = type; }

    public InterviewType getInterviewType() { return type; }
    public void setInterviewType(String interviewType) {
        if (interviewType != null) {
            this.type = InterviewType.valueOf(interviewType);
        }
    }

    public InterviewRound getRound() { return round; }
    public void setRound(InterviewRound round) { this.round = round; }

    public InterviewStatus getStatus() { return status; }
    public void setStatus(InterviewStatus status) { this.status = status; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public LocalDateTime getScheduledDate() { return scheduledAt; }
    public void setScheduledDate(LocalDateTime scheduledDate) { this.scheduledAt = scheduledDate; }

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

    public Long getInterviewerId() { return interviewerId; }
    public void setInterviewerId(Long interviewerId) { this.interviewerId = interviewerId; }

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

    public InterviewRecommendation getRecommendation() { return recommendation; }
    public void setRecommendation(InterviewRecommendation recommendation) { this.recommendation = recommendation; }

    public void setRecommendation(String recommendation) {
        if (recommendation != null) {
            try {
                this.recommendation = InterviewRecommendation.valueOf(recommendation);
            } catch (IllegalArgumentException e) {
                // Ignore invalid values
            }
        }
    }

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

    public LocalDateTime getRescheduledFrom() { return rescheduledFrom; }
    public void setRescheduledFrom(LocalDateTime rescheduledFrom) { this.rescheduledFrom = rescheduledFrom; }

    public String getRescheduleReason() { return rescheduleReason; }
    public void setRescheduleReason(String rescheduleReason) { this.rescheduleReason = rescheduleReason; }

    public Integer getRescheduleCount() { return rescheduleCount; }
    public void setRescheduleCount(Integer rescheduleCount) { this.rescheduleCount = rescheduleCount; }

    public Boolean getReminderSent() { return reminderSent; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }

    public Boolean getConfirmationReceived() { return confirmationReceived; }
    public void setConfirmationReceived(Boolean confirmationReceived) { this.confirmationReceived = confirmationReceived; }

    public LocalDateTime getReminderSentAt() { return reminderSentAt; }
    public void setReminderSentAt(LocalDateTime reminderSentAt) { this.reminderSentAt = reminderSentAt; }

    public LocalDateTime getFeedbackRequestedAt() { return feedbackRequestedAt; }
    public void setFeedbackRequestedAt(LocalDateTime feedbackRequestedAt) { this.feedbackRequestedAt = feedbackRequestedAt; }

    public LocalDateTime getFeedbackSubmittedAt() { return feedbackSubmittedAt; }
    public void setFeedbackSubmittedAt(LocalDateTime feedbackSubmittedAt) { this.feedbackSubmittedAt = feedbackSubmittedAt; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public List<InterviewFeedback> getFeedbacks() { return feedbacks; }
    public void setFeedbacks(List<InterviewFeedback> feedbacks) { this.feedbacks = feedbacks; }

    public static final String TYPE_PHONE = "PHONE";
    public static final String TYPE_VIDEO = "VIDEO";
    public static final String TYPE_ON_SITE = "ON_SITE";
    public static final String TYPE_TECHNICAL = "TECHNICAL";
    public static final String TYPE_HR = "HR";
    public static final String TYPE_FINAL = "FINAL";

    public static final String STATUS_SCHEDULED = "SCHEDULED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_RESCHEDULED = "RESCHEDULED";

    @Override
    public String toString() {
        return "Interview{" +
                "id=" + id +
                ", type=" + type +
                ", scheduledAt=" + scheduledAt +
                ", status=" + status +
                ", rating=" + rating +
                '}';
    }
}
