package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Notification entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  NOTIFICATION#{id}
 *
 * GSI1 (read status — unread lookup):
 *   GSI1PK: NOTIF_READ#{tenantId}#{isRead}
 *   GSI1SK: NOTIFICATION#{createdAt}
 *
 * GSI8 (recipient timeline):
 *   GSI8PK: NOTIF_RECIPIENT#{tenantId}#{recipientId}
 *   GSI8SK: NOTIFICATION#{createdAt}
 */
@DynamoDbBean
public class NotificationItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi8pk;
    private String gsi8sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String recipientId;
    private String senderId;
    private String type;
    private String channel;
    private String priority;
    private String title;
    private String message;
    private String actionUrl;
    private String actionLabel;
    private String icon;
    private String metadata;
    private String applicationId;
    private String interviewId;
    private String jobPostingId;
    private String offerId;
    private Boolean isRead;
    private String readAt;
    private Boolean isDelivered;
    private String deliveredAt;
    private Integer deliveryAttempts;
    private String lastDeliveryAttempt;
    private String deliveryError;
    private String emailTo;
    private String emailSubject;
    private String emailTemplate;
    private String phoneNumber;
    private String smsTemplate;
    private String pushDeviceToken;
    private String pushPayload;
    private String scheduledFor;
    private Boolean isScheduled;
    private String expiresAt;
    private String notificationGroup;
    private String batchId;
    private Boolean isBatchDigest;
    private String createdAt;
    private String updatedAt;
    private String createdBy;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI1: Read status index ----------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // -- GSI8: Recipient timeline index ---------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI8")
    @DynamoDbAttribute("GSI8PK")
    public String getGsi8pk() { return gsi8pk; }
    public void setGsi8pk(String gsi8pk) { this.gsi8pk = gsi8pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI8")
    @DynamoDbAttribute("GSI8SK")
    public String getGsi8sk() { return gsi8sk; }
    public void setGsi8sk(String gsi8sk) { this.gsi8sk = gsi8sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public String getActionLabel() { return actionLabel; }
    public void setActionLabel(String actionLabel) { this.actionLabel = actionLabel; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getInterviewId() { return interviewId; }
    public void setInterviewId(String interviewId) { this.interviewId = interviewId; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getOfferId() { return offerId; }
    public void setOfferId(String offerId) { this.offerId = offerId; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public String getReadAt() { return readAt; }
    public void setReadAt(String readAt) { this.readAt = readAt; }

    public Boolean getIsDelivered() { return isDelivered; }
    public void setIsDelivered(Boolean isDelivered) { this.isDelivered = isDelivered; }

    public String getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(String deliveredAt) { this.deliveredAt = deliveredAt; }

    public Integer getDeliveryAttempts() { return deliveryAttempts; }
    public void setDeliveryAttempts(Integer deliveryAttempts) { this.deliveryAttempts = deliveryAttempts; }

    public String getLastDeliveryAttempt() { return lastDeliveryAttempt; }
    public void setLastDeliveryAttempt(String lastDeliveryAttempt) { this.lastDeliveryAttempt = lastDeliveryAttempt; }

    public String getDeliveryError() { return deliveryError; }
    public void setDeliveryError(String deliveryError) { this.deliveryError = deliveryError; }

    public String getEmailTo() { return emailTo; }
    public void setEmailTo(String emailTo) { this.emailTo = emailTo; }

    public String getEmailSubject() { return emailSubject; }
    public void setEmailSubject(String emailSubject) { this.emailSubject = emailSubject; }

    public String getEmailTemplate() { return emailTemplate; }
    public void setEmailTemplate(String emailTemplate) { this.emailTemplate = emailTemplate; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getSmsTemplate() { return smsTemplate; }
    public void setSmsTemplate(String smsTemplate) { this.smsTemplate = smsTemplate; }

    public String getPushDeviceToken() { return pushDeviceToken; }
    public void setPushDeviceToken(String pushDeviceToken) { this.pushDeviceToken = pushDeviceToken; }

    public String getPushPayload() { return pushPayload; }
    public void setPushPayload(String pushPayload) { this.pushPayload = pushPayload; }

    public String getScheduledFor() { return scheduledFor; }
    public void setScheduledFor(String scheduledFor) { this.scheduledFor = scheduledFor; }

    public Boolean getIsScheduled() { return isScheduled; }
    public void setIsScheduled(Boolean isScheduled) { this.isScheduled = isScheduled; }

    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }

    public String getNotificationGroup() { return notificationGroup; }
    public void setNotificationGroup(String notificationGroup) { this.notificationGroup = notificationGroup; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public Boolean getIsBatchDigest() { return isBatchDigest; }
    public void setIsBatchDigest(Boolean isBatchDigest) { this.isBatchDigest = isBatchDigest; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
