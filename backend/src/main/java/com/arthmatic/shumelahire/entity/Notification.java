package com.arthmatic.shumelahire.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    @NotNull(message = "Recipient is required")
    private Long recipientId;

    @Column(name = "sender_id")
    private Long senderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    private NotificationChannel channel = NotificationChannel.IN_APP;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private NotificationPriority priority = NotificationPriority.MEDIUM;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "action_label")
    private String actionLabel;

    @Column(name = "icon")
    private String icon;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string for additional data

    // Related entities
    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "interview_id")
    private Long interviewId;

    @Column(name = "job_posting_id")
    private Long jobPostingId;

    @Column(name = "offer_id")
    private Long offerId;

    // Delivery tracking
    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_delivered")
    private Boolean isDelivered = false;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "delivery_attempts")
    private Integer deliveryAttempts = 0;

    @Column(name = "last_delivery_attempt")
    private LocalDateTime lastDeliveryAttempt;

    @Column(name = "delivery_error")
    private String deliveryError;

    // Email specific fields
    @Column(name = "email_to")
    private String emailTo;

    @Column(name = "email_subject")
    private String emailSubject;

    @Column(name = "email_template")
    private String emailTemplate;

    // SMS specific fields
    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "sms_template")
    private String smsTemplate;

    // Push notification fields
    @Column(name = "push_device_token")
    private String pushDeviceToken;

    @Column(name = "push_payload", columnDefinition = "TEXT")
    private String pushPayload;

    // Scheduling
    @Column(name = "scheduled_for")
    private LocalDateTime scheduledFor;

    @Column(name = "is_scheduled")
    private Boolean isScheduled = false;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    // Grouping and batching
    @Column(name = "notification_group")
    private String notificationGroup;

    @Column(name = "batch_id")
    private String batchId;

    @Column(name = "is_batch_digest")
    private Boolean isBatchDigest = false;

    // Tracking
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
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
    @PreUpdate
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