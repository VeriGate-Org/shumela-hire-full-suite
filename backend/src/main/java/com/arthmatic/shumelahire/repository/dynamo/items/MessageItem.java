package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Message entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  MESSAGE#{id}
 *
 * GSI1 (status — delivered/undelivered):
 *   GSI1PK: MSG_DELIVERED#{tenantId}#{isDelivered}
 *   GSI1SK: MESSAGE#{createdAt}
 *
 * GSI2 (conversation/thread FK lookup):
 *   GSI2PK: MSG_THREAD#{tenantId}#{threadId}
 *   GSI2SK: MESSAGE#{createdAt}
 *
 * GSI8 (sender timeline):
 *   GSI8PK: MSG_SENDER#{tenantId}#{senderId}
 *   GSI8SK: MESSAGE#{createdAt}
 */
@DynamoDbBean
public class MessageItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi8pk;
    private String gsi8sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String recipientIds;
    private String recipientType;
    private String messageType;
    private String subject;
    private String content;
    private String messageFormat;
    private String priority;
    private String threadId;
    private String parentMessageId;
    private String conversationId;
    private Boolean isThreadStarter;
    private String applicationId;
    private String interviewId;
    private String jobPostingId;
    private String offerId;
    private Boolean isRead;
    private String readBy;
    private Boolean isDelivered;
    private String deliveredAt;
    private Boolean isArchived;
    private String archivedAt;
    private Boolean isDeleted;
    private String deletedAt;
    private String deletedBy;
    private Boolean hasAttachments;
    private String attachmentUrls;
    private Boolean isUrgent;
    private Boolean requiresResponse;
    private String responseDeadline;
    private Boolean isConfidential;
    private String autoDeleteAt;
    private String scheduledFor;
    private Boolean isScheduled;
    private String tags;
    private String category;
    private String metadata;
    private String createdAt;
    private String updatedAt;
    private String sentAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI1: Delivery status index ------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // -- GSI2: Thread/Conversation FK lookup ----------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI8: Sender timeline index ------------------------------------------

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

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getRecipientIds() { return recipientIds; }
    public void setRecipientIds(String recipientIds) { this.recipientIds = recipientIds; }

    public String getRecipientType() { return recipientType; }
    public void setRecipientType(String recipientType) { this.recipientType = recipientType; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getMessageFormat() { return messageFormat; }
    public void setMessageFormat(String messageFormat) { this.messageFormat = messageFormat; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getParentMessageId() { return parentMessageId; }
    public void setParentMessageId(String parentMessageId) { this.parentMessageId = parentMessageId; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public Boolean getIsThreadStarter() { return isThreadStarter; }
    public void setIsThreadStarter(Boolean isThreadStarter) { this.isThreadStarter = isThreadStarter; }

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

    public String getReadBy() { return readBy; }
    public void setReadBy(String readBy) { this.readBy = readBy; }

    public Boolean getIsDelivered() { return isDelivered; }
    public void setIsDelivered(Boolean isDelivered) { this.isDelivered = isDelivered; }

    public String getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(String deliveredAt) { this.deliveredAt = deliveredAt; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public String getArchivedAt() { return archivedAt; }
    public void setArchivedAt(String archivedAt) { this.archivedAt = archivedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public String getDeletedAt() { return deletedAt; }
    public void setDeletedAt(String deletedAt) { this.deletedAt = deletedAt; }

    public String getDeletedBy() { return deletedBy; }
    public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }

    public Boolean getHasAttachments() { return hasAttachments; }
    public void setHasAttachments(Boolean hasAttachments) { this.hasAttachments = hasAttachments; }

    public String getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(String attachmentUrls) { this.attachmentUrls = attachmentUrls; }

    public Boolean getIsUrgent() { return isUrgent; }
    public void setIsUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; }

    public Boolean getRequiresResponse() { return requiresResponse; }
    public void setRequiresResponse(Boolean requiresResponse) { this.requiresResponse = requiresResponse; }

    public String getResponseDeadline() { return responseDeadline; }
    public void setResponseDeadline(String responseDeadline) { this.responseDeadline = responseDeadline; }

    public Boolean getIsConfidential() { return isConfidential; }
    public void setIsConfidential(Boolean isConfidential) { this.isConfidential = isConfidential; }

    public String getAutoDeleteAt() { return autoDeleteAt; }
    public void setAutoDeleteAt(String autoDeleteAt) { this.autoDeleteAt = autoDeleteAt; }

    public String getScheduledFor() { return scheduledFor; }
    public void setScheduledFor(String scheduledFor) { this.scheduledFor = scheduledFor; }

    public Boolean getIsScheduled() { return isScheduled; }
    public void setIsScheduled(Boolean isScheduled) { this.isScheduled = isScheduled; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getSentAt() { return sentAt; }
    public void setSentAt(String sentAt) { this.sentAt = sentAt; }
}
