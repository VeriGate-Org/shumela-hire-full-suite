package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class Notification extends TenantAwareEntity {

    private Long id;

    @NotNull(message = "Recipient is required")
    private Long recipientId;

    private Long senderId;

    private NotificationType type;

    private NotificationChannel channel = NotificationChannel.IN_APP;

    private NotificationPriority priority = NotificationPriority.MEDIUM;

    private String title;

    private String message;

    private String actionUrl;

    private String actionLabel;

    private String icon;

    private String metadata; // JSON string for additional data

    // Related entities
    private Long applicationId;

    private Long interviewId;

    private Long jobPostingId;

    private Long offerId;

    // Delivery tracking
    private Boolean isRead = false;

    private LocalDateTime readAt;

    private Boolean isDelivered = false;

    private LocalDateTime deliveredAt;

    private Integer deliveryAttempts = 0;

    private LocalDateTime lastDeliveryAttempt;

    private String deliveryError;

    // Email specific fields
    private String emailTo;

    private String emailSubject;

    private String emailTemplate;

    // SMS specific fields
    private String phoneNumber;

    private String smsTemplate;

    // Push notification fields
    private String pushDeviceToken;

    private String pushPayload;

    // Scheduling
    private LocalDateTime scheduledFor;

    private Boolean isScheduled = false;

    private LocalDateTime expiresAt;

    // Grouping and batching
    private String notificationGroup;

    private String batchId;

    private Boolean isBatchDigest = false;

    // Tracking
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long createdBy;

    // Constructors
    public Notification() {
        this.createdAt = LocalDateTime.now();
    }

    public Notification(Long recipientId, NotificationType type, String title, String message) {
        this();
        this.recipientId = recipientId;
        this.type = type;
        this.title = title;
        this.message = message;
    }

    public Notification(Long recipientId, NotificationType type, NotificationChannel channel,
                       String title, String message, Long relatedEntityId) {
        this(recipientId, type, title, message);
        this.channel = channel;
        setRelatedEntity(type, relatedEntityId);
    }

    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean canBeDelivered() {
        return !isDelivered && !isExpired() && 
               (scheduledFor == null || LocalDateTime.now().isAfter(scheduledFor));
    }

    public boolean requiresImmediateDelivery() {
        return priority == NotificationPriority.HIGH || priority == NotificationPriority.URGENT;
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public void markAsDelivered() {
        this.isDelivered = true;
        this.deliveredAt = LocalDateTime.now();
    }

    public void recordDeliveryAttempt(String error) {
        this.deliveryAttempts++;
        this.lastDeliveryAttempt = LocalDateTime.now();
        this.deliveryError = error;
    }

    public boolean hasMaxDeliveryAttempts() {
        return deliveryAttempts >= 3;
    }

    public long getMinutesSinceCreated() {
        return java.time.Duration.between(createdAt, LocalDateTime.now()).toMinutes();
    }

    public long getDaysSinceCreated() {
        return java.time.temporal.ChronoUnit.DAYS.between(createdAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }

    public String getDisplayTime() {
        long minutes = getMinutesSinceCreated();
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + "m ago";
        
        long hours = minutes / 60;
        if (hours < 24) return hours + "h ago";
        
        long days = getDaysSinceCreated();
        if (days < 7) return days + "d ago";
        
        return createdAt.toLocalDate().toString();
    }

    public String getTypeDisplayName() {
        return type.getDisplayName();
    }

    public String getTypeIcon() {
        return type.getIcon();
    }

    public String getTypeCssClass() {
        return type.getCssClass();
    }

    public String getPriorityDisplayName() {
        return priority.getDisplayName();
    }

    public String getPriorityIcon() {
        return priority.getIcon();
    }

    public String getPriorityCssClass() {
        return priority.getCssClass();
    }

    public String getChannelDisplayName() {
        return channel.getDisplayName();
    }

    public String getChannelIcon() {
        return channel.name().toLowerCase();
    }

    private void setRelatedEntity(NotificationType type, Long entityId) {
        if (entityId == null) return;
        
        switch (type.getCategory()) {
            case "APPLICATION":
                this.applicationId = entityId;
                break;
            case "INTERVIEW":
                this.interviewId = entityId;
                break;
            case "JOB_POSTING":
                this.jobPostingId = entityId;
                break;
            case "OFFER":
                this.offerId = entityId;
                break;
        }
    }

    public Long getRelatedEntityId() {
        if (applicationId != null) return applicationId;
        if (interviewId != null) return interviewId;
        if (jobPostingId != null) return jobPostingId;
        if (offerId != null) return offerId;
        return null;
    }

    public String getRelatedEntityType() {
        if (applicationId != null) return "APPLICATION";
        if (interviewId != null) return "INTERVIEW";
        if (jobPostingId != null) return "JOB_POSTING";
        if (offerId != null) return "OFFER";
        return null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public NotificationPriority getPriority() {
        return priority;
    }

    public void setPriority(NotificationPriority priority) {
        this.priority = priority;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public String getActionLabel() {
        return actionLabel;
    }

    public void setActionLabel(String actionLabel) {
        this.actionLabel = actionLabel;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public Long getInterviewId() {
        return interviewId;
    }

    public void setInterviewId(Long interviewId) {
        this.interviewId = interviewId;
    }

    public Long getJobPostingId() {
        return jobPostingId;
    }

    public void setJobPostingId(Long jobPostingId) {
        this.jobPostingId = jobPostingId;
    }

    public Long getOfferId() {
        return offerId;
    }

    public void setOfferId(Long offerId) {
        this.offerId = offerId;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public Boolean getIsDelivered() {
        return isDelivered;
    }

    public void setIsDelivered(Boolean isDelivered) {
        this.isDelivered = isDelivered;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public Integer getDeliveryAttempts() {
        return deliveryAttempts;
    }

    public void setDeliveryAttempts(Integer deliveryAttempts) {
        this.deliveryAttempts = deliveryAttempts;
    }

    public LocalDateTime getLastDeliveryAttempt() {
        return lastDeliveryAttempt;
    }

    public void setLastDeliveryAttempt(LocalDateTime lastDeliveryAttempt) {
        this.lastDeliveryAttempt = lastDeliveryAttempt;
    }

    public String getDeliveryError() {
        return deliveryError;
    }

    public void setDeliveryError(String deliveryError) {
        this.deliveryError = deliveryError;
    }

    public String getEmailTo() {
        return emailTo;
    }

    public void setEmailTo(String emailTo) {
        this.emailTo = emailTo;
    }

    public String getEmailSubject() {
        return emailSubject;
    }

    public void setEmailSubject(String emailSubject) {
        this.emailSubject = emailSubject;
    }

    public String getEmailTemplate() {
        return emailTemplate;
    }

    public void setEmailTemplate(String emailTemplate) {
        this.emailTemplate = emailTemplate;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getSmsTemplate() {
        return smsTemplate;
    }

    public void setSmsTemplate(String smsTemplate) {
        this.smsTemplate = smsTemplate;
    }

    public String getPushDeviceToken() {
        return pushDeviceToken;
    }

    public void setPushDeviceToken(String pushDeviceToken) {
        this.pushDeviceToken = pushDeviceToken;
    }

    public String getPushPayload() {
        return pushPayload;
    }

    public void setPushPayload(String pushPayload) {
        this.pushPayload = pushPayload;
    }

    public LocalDateTime getScheduledFor() {
        return scheduledFor;
    }

    public void setScheduledFor(LocalDateTime scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    public Boolean getIsScheduled() {
        return isScheduled;
    }

    public void setIsScheduled(Boolean isScheduled) {
        this.isScheduled = isScheduled;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getNotificationGroup() {
        return notificationGroup;
    }

    public void setNotificationGroup(String notificationGroup) {
        this.notificationGroup = notificationGroup;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public Boolean getIsBatchDigest() {
        return isBatchDigest;
    }

    public void setIsBatchDigest(Boolean isBatchDigest) {
        this.isBatchDigest = isBatchDigest;
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

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}