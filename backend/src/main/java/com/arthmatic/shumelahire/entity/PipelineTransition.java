package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class PipelineTransition extends TenantAwareEntity {

    private Long id;

    @NotNull(message = "Application is required")
    private Application application;

    private PipelineStage fromStage;

    @NotNull(message = "Target stage is required")
    private PipelineStage toStage;

    private TransitionType transitionType = TransitionType.PROGRESSION;

    private String reason;

    private String notes;

    private Boolean automated = false;

    private Long triggeredByInterviewId;

    private Long triggeredByAssessmentId;

    private String metadata; // JSON for additional data

    @NotNull(message = "Created by is required")
    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime effectiveAt;

    private Long durationInPreviousStageHours;

    // Constructors
    public PipelineTransition() {
        this.createdAt = LocalDateTime.now();
        this.effectiveAt = LocalDateTime.now();
    }

    public PipelineTransition(Application application, PipelineStage fromStage, PipelineStage toStage, 
                            TransitionType transitionType, Long createdBy) {
        this();
        this.application = application;
        this.fromStage = fromStage;
        this.toStage = toStage;
        this.transitionType = transitionType;
        this.createdBy = createdBy;
    }

    // Lifecycle callbacks
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.effectiveAt == null) {
            this.effectiveAt = LocalDateTime.now();
        }
        calculateDurationInPreviousStage();
    }

    // Business methods
    public boolean isProgression() {
        return transitionType == TransitionType.PROGRESSION;
    }

    public boolean isRegression() {
        return transitionType == TransitionType.REGRESSION;
    }

    public boolean isRejection() {
        return transitionType == TransitionType.REJECTION;
    }

    public boolean isWithdrawal() {
        return transitionType == TransitionType.WITHDRAWAL;
    }

    public boolean isReactivation() {
        return transitionType == TransitionType.REACTIVATION;
    }

    public boolean wasAutomated() {
        return automated != null && automated;
    }

    public boolean wasTriggeredByInterview() {
        return triggeredByInterviewId != null;
    }

    public boolean wasTriggeredByAssessment() {
        return triggeredByAssessmentId != null;
    }

    public String getTransitionDescription() {
        StringBuilder description = new StringBuilder();
        
        if (fromStage != null) {
            description.append("Moved from ").append(fromStage.getDisplayName()).append(" to ");
        } else {
            description.append("Started at ");
        }
        description.append(toStage.getDisplayName());
        
        if (reason != null && !reason.trim().isEmpty()) {
            description.append(" - ").append(reason);
        }
        
        return description.toString();
    }

    public long getDaysInPreviousStage() {
        if (durationInPreviousStageHours != null) {
            return durationInPreviousStageHours / 24;
        }
        return 0;
    }

    private void calculateDurationInPreviousStage() {
        if (application != null && fromStage != null) {
            // This would be calculated based on the previous transition
            // For now, we'll set it during service layer processing
        }
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

    public PipelineStage getFromStage() {
        return fromStage;
    }

    public void setFromStage(PipelineStage fromStage) {
        this.fromStage = fromStage;
    }

    public PipelineStage getToStage() {
        return toStage;
    }

    public void setToStage(PipelineStage toStage) {
        this.toStage = toStage;
    }

    public TransitionType getTransitionType() {
        return transitionType;
    }

    public void setTransitionType(TransitionType transitionType) {
        this.transitionType = transitionType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getAutomated() {
        return automated;
    }

    public void setAutomated(Boolean automated) {
        this.automated = automated;
    }

    public Long getTriggeredByInterviewId() {
        return triggeredByInterviewId;
    }

    public void setTriggeredByInterviewId(Long triggeredByInterviewId) {
        this.triggeredByInterviewId = triggeredByInterviewId;
    }

    public Long getTriggeredByAssessmentId() {
        return triggeredByAssessmentId;
    }

    public void setTriggeredByAssessmentId(Long triggeredByAssessmentId) {
        this.triggeredByAssessmentId = triggeredByAssessmentId;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getEffectiveAt() {
        return effectiveAt;
    }

    public void setEffectiveAt(LocalDateTime effectiveAt) {
        this.effectiveAt = effectiveAt;
    }

    public Long getDurationInPreviousStageHours() {
        return durationInPreviousStageHours;
    }

    public void setDurationInPreviousStageHours(Long durationInPreviousStageHours) {
        this.durationInPreviousStageHours = durationInPreviousStageHours;
    }
}