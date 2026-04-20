package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.MessageDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.MessageItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Message entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     MESSAGE#{id}
 *   GSI1PK: MSG_DELIVERED#{tenantId}#{isDelivered}   GSI1SK: MESSAGE#{createdAt}
 *   GSI2PK: MSG_THREAD#{tenantId}#{threadId}         GSI2SK: MESSAGE#{createdAt}
 *   GSI8PK: MSG_SENDER#{tenantId}#{senderId}         GSI8SK: MESSAGE#{createdAt}
 * </pre>
 */
@Repository
public class DynamoMessageRepository extends DynamoRepository<MessageItem, Message>
        implements MessageDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoMessageRepository(DynamoDbClient dynamoDbClient,
                                    DynamoDbEnhancedClient enhancedClient,
                                    String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, MessageItem.class);
    }

    @Override
    protected String entityType() {
        return "MESSAGE";
    }

    // -- Sender / Recipient queries -------------------------------------------

    @Override
    public List<Message> findBySenderIdOrderByCreatedAtDesc(String senderId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI8", "MSG_SENDER#" + tenantId + "#" + senderId).stream()
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findByRecipientIdOrderByCreatedAtDesc(String recipientId) {
        // recipientIds is a JSON array stored as string; filter by contains
        return findAll().stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsDeleted()))
                .filter(m -> m.getRecipientIds() != null && m.getRecipientIds().contains(recipientId))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findByUserIdOrderByCreatedAtDesc(String userId) {
        return findAll().stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsDeleted()))
                .filter(m -> (m.getSenderId() != null && m.getSenderId().toString().equals(userId))
                        || (m.getRecipientIds() != null && m.getRecipientIds().contains(userId)))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // -- Conversation / Thread ------------------------------------------------

    @Override
    public List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId) {
        return findAll().stream()
                .filter(m -> conversationId.equals(m.getConversationId()))
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findByThreadIdOrderByCreatedAtAsc(String threadId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "MSG_THREAD#" + tenantId + "#" + threadId).stream()
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findActiveMessagesByThread(String threadId) {
        return findByThreadIdOrderByCreatedAtAsc(threadId).stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsDeleted()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Message> findByThreadIdAndIsThreadStarterTrue(String threadId) {
        return findByThreadIdOrderByCreatedAtAsc(threadId).stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsThreadStarter()))
                .findFirst();
    }

    @Override
    public List<Message> findByParentMessageIdOrderByCreatedAtAsc(String parentMessageId) {
        return findAll().stream()
                .filter(m -> m.getParentMessageId() != null && m.getParentMessageId().toString().equals(parentMessageId))
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .collect(Collectors.toList());
    }

    // -- Unread ---------------------------------------------------------------

    @Override
    public List<Message> findUnreadByRecipientOrderByPriority(String recipientId) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsRead()))
                .sorted(Comparator.comparing(Message::getPriority).reversed()
                        .thenComparing(Comparator.comparing(Message::getCreatedAt).reversed()))
                .collect(Collectors.toList());
    }

    @Override
    public long countUnreadByRecipient(String recipientId) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsRead()))
                .count();
    }

    @Override
    public List<Message> findUnreadByRecipientAndType(String recipientId, MessageType type) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsRead()))
                .filter(m -> type.equals(m.getMessageType()))
                .collect(Collectors.toList());
    }

    // -- Delivery / Scheduling ------------------------------------------------

    @Override
    public List<Message> findPendingDelivery(LocalDateTime now) {
        return findAll().stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsDelivered()))
                .filter(m -> Boolean.FALSE.equals(m.getIsDeleted()))
                .filter(m -> m.getScheduledFor() == null || !m.getScheduledFor().isAfter(now))
                .sorted(Comparator.comparing(Message::getPriority).reversed()
                        .thenComparing(Message::getCreatedAt))
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findScheduledMessagesDue(LocalDateTime now) {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsScheduled()))
                .filter(m -> m.getScheduledFor() != null && !m.getScheduledFor().isAfter(now))
                .filter(m -> Boolean.FALSE.equals(m.getIsDelivered()))
                .filter(m -> Boolean.FALSE.equals(m.getIsDeleted()))
                .collect(Collectors.toList());
    }

    // -- Type / Priority queries ----------------------------------------------

    @Override
    public List<Message> findByMessageTypeOrderByCreatedAtDesc(MessageType messageType) {
        return findAll().stream()
                .filter(m -> messageType.equals(m.getMessageType()))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findUrgentUnreadByRecipient(String recipientId) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsUrgent()))
                .filter(m -> Boolean.FALSE.equals(m.getIsRead()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findMessagesRequiringResponse(String recipientId) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.TRUE.equals(m.getRequiresResponse()))
                .sorted(Comparator.comparing(Message::getResponseDeadline,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    // -- Related entity queries -----------------------------------------------

    @Override
    public List<Message> findByApplicationIdOrderByCreatedAtDesc(String applicationId) {
        return findAll().stream()
                .filter(m -> m.getApplicationId() != null && m.getApplicationId().toString().equals(applicationId))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findByInterviewIdOrderByCreatedAtDesc(String interviewId) {
        return findAll().stream()
                .filter(m -> m.getInterviewId() != null && m.getInterviewId().toString().equals(interviewId))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findByJobPostingIdOrderByCreatedAtDesc(String jobPostingId) {
        return findAll().stream()
                .filter(m -> m.getJobPostingId() != null && m.getJobPostingId().toString().equals(jobPostingId))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findByOfferIdOrderByCreatedAtDesc(String offerId) {
        return findAll().stream()
                .filter(m -> m.getOfferId() != null && m.getOfferId().toString().equals(offerId))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // -- Archive --------------------------------------------------------------

    @Override
    public List<Message> findArchivedByUser(String userId) {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsArchived()))
                .filter(m -> (m.getSenderId() != null && m.getSenderId().toString().equals(userId))
                        || (m.getRecipientIds() != null && m.getRecipientIds().contains(userId)))
                .sorted(Comparator.comparing(Message::getArchivedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> findActiveByUser(String userId) {
        return findAll().stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsArchived()))
                .filter(m -> Boolean.FALSE.equals(m.getIsDeleted()))
                .filter(m -> (m.getSenderId() != null && m.getSenderId().toString().equals(userId))
                        || (m.getRecipientIds() != null && m.getRecipientIds().contains(userId)))
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // -- Bulk operations ------------------------------------------------------

    @Override
    public int markAllAsReadForRecipient(String recipientId) {
        List<Message> unread = findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsRead()))
                .collect(Collectors.toList());
        int count = 0;
        for (Message m : unread) {
            m.setIsRead(true);
            save(m);
            count++;
        }
        return count;
    }

    // -- Dashboard ------------------------------------------------------------

    @Override
    public long countUrgentUnread(String recipientId) {
        return findUrgentUnreadByRecipient(recipientId).size();
    }

    @Override
    public long countTodayUnread(String recipientId, LocalDateTime today) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsRead()))
                .filter(m -> m.getCreatedAt() != null && !m.getCreatedAt().isBefore(today))
                .count();
    }

    @Override
    public long countRequiringResponse(String recipientId) {
        return findMessagesRequiringResponse(recipientId).size();
    }

    // -- Conversion: MessageItem <-> Message ----------------------------------

    @Override
    protected Message toEntity(MessageItem item) {
        var entity = new Message();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        if (item.getSenderId() != null) entity.setSenderId(safeParseLong(item.getSenderId()));
        entity.setSenderName(item.getSenderName());
        entity.setSenderRole(item.getSenderRole());
        entity.setRecipientIds(item.getRecipientIds());
        if (item.getRecipientType() != null) entity.setRecipientType(MessageRecipientType.valueOf(item.getRecipientType()));
        if (item.getMessageType() != null) entity.setMessageType(MessageType.valueOf(item.getMessageType()));
        entity.setSubject(item.getSubject());
        entity.setContent(item.getContent());
        if (item.getMessageFormat() != null) entity.setMessageFormat(MessageFormat.valueOf(item.getMessageFormat()));
        if (item.getPriority() != null) entity.setPriority(MessagePriority.valueOf(item.getPriority()));
        entity.setThreadId(item.getThreadId());
        if (item.getParentMessageId() != null) entity.setParentMessageId(safeParseLong(item.getParentMessageId()));
        entity.setConversationId(item.getConversationId());
        entity.setIsThreadStarter(item.getIsThreadStarter());
        if (item.getApplicationId() != null) entity.setApplicationId(safeParseLong(item.getApplicationId()));
        if (item.getInterviewId() != null) entity.setInterviewId(safeParseLong(item.getInterviewId()));
        if (item.getJobPostingId() != null) entity.setJobPostingId(safeParseLong(item.getJobPostingId()));
        if (item.getOfferId() != null) entity.setOfferId(safeParseLong(item.getOfferId()));
        entity.setIsRead(item.getIsRead());
        entity.setReadBy(item.getReadBy());
        entity.setIsDelivered(item.getIsDelivered());
        if (item.getDeliveredAt() != null) entity.setDeliveredAt(LocalDateTime.parse(item.getDeliveredAt(), ISO_FMT));
        entity.setIsArchived(item.getIsArchived());
        if (item.getArchivedAt() != null) entity.setArchivedAt(LocalDateTime.parse(item.getArchivedAt(), ISO_FMT));
        entity.setIsDeleted(item.getIsDeleted());
        if (item.getDeletedAt() != null) entity.setDeletedAt(LocalDateTime.parse(item.getDeletedAt(), ISO_FMT));
        if (item.getDeletedBy() != null) entity.setDeletedBy(safeParseLong(item.getDeletedBy()));
        entity.setHasAttachments(item.getHasAttachments());
        entity.setAttachmentUrls(item.getAttachmentUrls());
        entity.setIsUrgent(item.getIsUrgent());
        entity.setRequiresResponse(item.getRequiresResponse());
        if (item.getResponseDeadline() != null) entity.setResponseDeadline(LocalDateTime.parse(item.getResponseDeadline(), ISO_FMT));
        entity.setIsConfidential(item.getIsConfidential());
        if (item.getAutoDeleteAt() != null) entity.setAutoDeleteAt(LocalDateTime.parse(item.getAutoDeleteAt(), ISO_FMT));
        if (item.getScheduledFor() != null) entity.setScheduledFor(LocalDateTime.parse(item.getScheduledFor(), ISO_FMT));
        entity.setIsScheduled(item.getIsScheduled());
        entity.setTags(item.getTags());
        entity.setCategory(item.getCategory());
        entity.setMetadata(item.getMetadata());
        if (item.getCreatedAt() != null) entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        if (item.getSentAt() != null) entity.setSentAt(LocalDateTime.parse(item.getSentAt(), ISO_FMT));
        return entity;
    }

    @Override
    protected MessageItem toItem(Message entity) {
        var item = new MessageItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : LocalDateTime.now().format(ISO_FMT);
        String senderIdStr = entity.getSenderId() != null ? entity.getSenderId().toString() : "";
        String threadIdStr = entity.getThreadId() != null ? entity.getThreadId() : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("MESSAGE#" + id);

        // GSI1: Delivery status index
        item.setGsi1pk("MSG_DELIVERED#" + tenantId + "#" + entity.getIsDelivered());
        item.setGsi1sk("MESSAGE#" + createdAtStr);

        // GSI2: Thread FK lookup
        item.setGsi2pk("MSG_THREAD#" + tenantId + "#" + threadIdStr);
        item.setGsi2sk("MESSAGE#" + createdAtStr);

        // GSI8: Sender timeline
        item.setGsi8pk("MSG_SENDER#" + tenantId + "#" + senderIdStr);
        item.setGsi8sk("MESSAGE#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getSenderId() != null) item.setSenderId(entity.getSenderId().toString());
        item.setSenderName(entity.getSenderName());
        item.setSenderRole(entity.getSenderRole());
        item.setRecipientIds(entity.getRecipientIds());
        if (entity.getRecipientType() != null) item.setRecipientType(entity.getRecipientType().name());
        if (entity.getMessageType() != null) item.setMessageType(entity.getMessageType().name());
        item.setSubject(entity.getSubject());
        item.setContent(entity.getContent());
        if (entity.getMessageFormat() != null) item.setMessageFormat(entity.getMessageFormat().name());
        if (entity.getPriority() != null) item.setPriority(entity.getPriority().name());
        item.setThreadId(entity.getThreadId());
        if (entity.getParentMessageId() != null) item.setParentMessageId(entity.getParentMessageId().toString());
        item.setConversationId(entity.getConversationId());
        item.setIsThreadStarter(entity.getIsThreadStarter());
        if (entity.getApplicationId() != null) item.setApplicationId(entity.getApplicationId().toString());
        if (entity.getInterviewId() != null) item.setInterviewId(entity.getInterviewId().toString());
        if (entity.getJobPostingId() != null) item.setJobPostingId(entity.getJobPostingId().toString());
        if (entity.getOfferId() != null) item.setOfferId(entity.getOfferId().toString());
        item.setIsRead(entity.getIsRead());
        item.setReadBy(entity.getReadBy());
        item.setIsDelivered(entity.getIsDelivered());
        if (entity.getDeliveredAt() != null) item.setDeliveredAt(entity.getDeliveredAt().format(ISO_FMT));
        item.setIsArchived(entity.getIsArchived());
        if (entity.getArchivedAt() != null) item.setArchivedAt(entity.getArchivedAt().format(ISO_FMT));
        item.setIsDeleted(entity.getIsDeleted());
        if (entity.getDeletedAt() != null) item.setDeletedAt(entity.getDeletedAt().format(ISO_FMT));
        if (entity.getDeletedBy() != null) item.setDeletedBy(entity.getDeletedBy().toString());
        item.setHasAttachments(entity.getHasAttachments());
        item.setAttachmentUrls(entity.getAttachmentUrls());
        item.setIsUrgent(entity.getIsUrgent());
        item.setRequiresResponse(entity.getRequiresResponse());
        if (entity.getResponseDeadline() != null) item.setResponseDeadline(entity.getResponseDeadline().format(ISO_FMT));
        item.setIsConfidential(entity.getIsConfidential());
        if (entity.getAutoDeleteAt() != null) item.setAutoDeleteAt(entity.getAutoDeleteAt().format(ISO_FMT));
        if (entity.getScheduledFor() != null) item.setScheduledFor(entity.getScheduledFor().format(ISO_FMT));
        item.setIsScheduled(entity.getIsScheduled());
        item.setTags(entity.getTags());
        item.setCategory(entity.getCategory());
        item.setMetadata(entity.getMetadata());
        item.setCreatedAt(createdAtStr);
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        if (entity.getSentAt() != null) item.setSentAt(entity.getSentAt().format(ISO_FMT));

        return item;
    }
}
