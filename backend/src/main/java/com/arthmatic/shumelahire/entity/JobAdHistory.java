package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class JobAdHistory extends TenantAwareEntity {
    
    private String id;
    
    @NotNull(message = "Job ad is required")
    private JobAd jobAd;
    
    @NotBlank(message = "Action is required")
    private String action;
    
    @NotBlank(message = "Actor user ID is required")
    private String actorUserId;
    
    private LocalDateTime timestamp;
    
    private String details;
    
    // Constructors
    public JobAdHistory() {}
    
    public JobAdHistory(JobAd jobAd, String action, String actorUserId) {
        this.jobAd = jobAd;
        this.action = action;
        this.actorUserId = actorUserId;
    }
    
    public JobAdHistory(JobAd jobAd, String action, String actorUserId, String details) {
        this.jobAd = jobAd;
        this.action = action;
        this.actorUserId = actorUserId;
        this.details = details;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public JobAd getJobAd() {
        return jobAd;
    }
    
    public void setJobAd(JobAd jobAd) {
        this.jobAd = jobAd;
    }
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getActorUserId() {
        return actorUserId;
    }
    
    public void setActorUserId(String actorUserId) {
        this.actorUserId = actorUserId;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getDetails() {
        return details;
    }
    
    public void setDetails(String details) {
        this.details = details;
    }
    
    @Override
    public String toString() {
        return "JobAdHistory{" +
                "id=" + id +
                ", action='" + action + '\'' +
                ", actorUserId='" + actorUserId + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
    
    // Common action constants
    public static final String ACTION_CREATED = "CREATED";
    public static final String ACTION_UPDATED = "UPDATED";
    public static final String ACTION_PUBLISHED = "PUBLISHED";
    public static final String ACTION_UNPUBLISHED = "UNPUBLISHED";
    public static final String ACTION_EXPIRED = "EXPIRED";
}