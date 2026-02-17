package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity(name = "TgInterview")
@Table(name = "tg_interviews")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Application application;

    @Column(name = "interview_type", nullable = false)
    private String interviewType; // PHONE, VIDEO, ON_SITE, TECHNICAL, HR, FINAL

    @Column(name = "scheduled_date", nullable = false)
    private LocalDateTime scheduledDate;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 60;

    @Column(name = "location")
    private String location;

    @Column(name = "meeting_url")
    private String meetingUrl;

    @Column(name = "interviewer_name", nullable = false)
    private String interviewerName;

    @Column(name = "interviewer_email", nullable = false)
    private String interviewerEmail;

    @Column(name = "status", nullable = false)
    private String status = "SCHEDULED"; // SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "rating")
    private Integer rating; // 1-5

    @Column(name = "technical_score")
    private Integer technicalScore; // 1-10

    @Column(name = "communication_score")
    private Integer communicationScore; // 1-10

    @Column(name = "cultural_fit_score")
    private Integer culturalFitScore; // 1-10

    @Column(name = "recommendation", nullable = false)
    private String recommendation = "PENDING"; // PENDING, PROCEED, REJECT, STRONG_PROCEED

    @Column(name = "questions", columnDefinition = "TEXT")
    private String questions;

    @Column(name = "answers", columnDefinition = "TEXT")
    private String answers;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "preparation_notes", columnDefinition = "TEXT")
    private String preparationNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "confirmation_received")
    private Boolean confirmationReceived = false;

    // Constructors
    public Interview() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "SCHEDULED";
        this.recommendation = "PENDING";
        this.reminderSent = false;
        this.confirmationReceived = false;
    }

    public Interview(Application application, String interviewType, LocalDateTime scheduledDate, 
                    String interviewerName, String interviewerEmail) {
        this();
        this.application = application;
        this.interviewType = interviewType;
        this.scheduledDate = scheduledDate;
        this.interviewerName = interviewerName;
        this.interviewerEmail = interviewerEmail;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public String getInterviewType() {
        return interviewType;
    }

    public void setInterviewType(String interviewType) {
        this.interviewType = interviewType;
    }

    public LocalDateTime getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDateTime scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getMeetingUrl() {
        return meetingUrl;
    }

    public void setMeetingUrl(String meetingUrl) {
        this.meetingUrl = meetingUrl;
    }

    public String getInterviewerName() {
        return interviewerName;
    }

    public void setInterviewerName(String interviewerName) {
        this.interviewerName = interviewerName;
    }

    public String getInterviewerEmail() {
        return interviewerEmail;
    }

    public void setInterviewerEmail(String interviewerEmail) {
        this.interviewerEmail = interviewerEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Integer getTechnicalScore() {
        return technicalScore;
    }

    public void setTechnicalScore(Integer technicalScore) {
        this.technicalScore = technicalScore;
    }

    public Integer getCommunicationScore() {
        return communicationScore;
    }

    public void setCommunicationScore(Integer communicationScore) {
        this.communicationScore = communicationScore;
    }

    public Integer getCulturalFitScore() {
        return culturalFitScore;
    }

    public void setCulturalFitScore(Integer culturalFitScore) {
        this.culturalFitScore = culturalFitScore;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getQuestions() {
        return questions;
    }

    public void setQuestions(String questions) {
        this.questions = questions;
    }

    public String getAnswers() {
        return answers;
    }

    public void setAnswers(String answers) {
        this.answers = answers;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getPreparationNotes() {
        return preparationNotes;
    }

    public void setPreparationNotes(String preparationNotes) {
        this.preparationNotes = preparationNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Boolean getReminderSent() {
        return reminderSent;
    }

    public void setReminderSent(Boolean reminderSent) {
        this.reminderSent = reminderSent;
    }

    public Boolean getConfirmationReceived() {
        return confirmationReceived;
    }

    public void setConfirmationReceived(Boolean confirmationReceived) {
        this.confirmationReceived = confirmationReceived;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Utility methods
    public Double getOverallScore() {
        if (technicalScore == null || communicationScore == null || culturalFitScore == null) {
            return null;
        }
        return (technicalScore + communicationScore + culturalFitScore) / 3.0;
    }

    public boolean isUpcoming() {
        return scheduledDate.isAfter(LocalDateTime.now()) && 
               ("SCHEDULED".equals(status) || "CONFIRMED".equals(status));
    }

    public boolean needsReminder() {
        return isUpcoming() && 
               !reminderSent && 
               scheduledDate.minusHours(24).isBefore(LocalDateTime.now());
    }

    @Override
    public String toString() {
        return "Interview{" +
                "id=" + id +
                ", interviewType='" + interviewType + '\'' +
                ", scheduledDate=" + scheduledDate +
                ", status='" + status + '\'' +
                ", interviewerName='" + interviewerName + '\'' +
                ", rating=" + rating +
                '}';
    }

    // Constants
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

    public static final String RECOMMENDATION_PENDING = "PENDING";
    public static final String RECOMMENDATION_PROCEED = "PROCEED";
    public static final String RECOMMENDATION_REJECT = "REJECT";
    public static final String RECOMMENDATION_STRONG_PROCEED = "STRONG_PROCEED";
}
