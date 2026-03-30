package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Notification;
import com.arthmatic.shumelahire.entity.NotificationChannel;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.repository.NotificationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.NotificationItem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
 * DynamoDB repository for the Notification entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     NOTIFICATION#{id}
 *   GSI1PK: NOTIF_READ#{tenantId}#{isRead}      GSI1SK: NOTIFICATION#{createdAt}
 *   GSI8PK: NOTIF_RECIPIENT#{tenantId}#{recipientId}  GSI8SK: NOTIFICATION#{createdAt}
 * </pre>
 */
@Repository
public class DynamoNotificationRepository extends DynamoRepository<NotificationItem, Notification>
        implements NotificationDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoNotificationRepository(DynamoDbClient dynamoDbClient,
                                         DynamoDbEnhancedClient enhancedClient,
                                         String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, NotificationItem.class);
    }

    @Override
    protected String entityType() {
        return "NOTIFICATION";
    }

    // -- Recipient queries ----------------------------------------------------

    @Override
    public Page<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable) {
        List<Notification> all = findByRecipientIdOrderByCreatedAtDesc(recipientId);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<Notification> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    @Override
    public List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI8", "NOTIF_RECIPIENT#" + tenantId + "#" + recipientId).stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(String recipientId) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsRead()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByRecipientIdAndTypeOrderByCreatedAtDesc(String recipientId, NotificationType type) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> type.equals(n.getType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByRecipientIdAndChannelOrderByCreatedAtDesc(String recipientId, NotificationChannel channel) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> channel.equals(n.getChannel()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByRecipientIdAndPriorityOrderByCreatedAtDesc(String recipientId, NotificationPriority priority) {
        return findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> priority.equals(n.getPriority()))
                .collect(Collectors.toList());
    }

    // -- Unread counts / queries ----------------------------------------------

    @Override
    public long countUnreadByRecipient(String recipientId) {
        return findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId).size();
    }

    @Override
    public List<Notification> findUnreadByRecipientOrderByPriority(String recipientId) {
        return findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId).stream()
                .sorted(Comparator.comparing(Notification::getPriority).reversed()
                        .thenComparing(Comparator.comparing(Notification::getCreatedAt).reversed()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findUnreadByRecipientAndType(String recipientId, NotificationType type) {
        return findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> type.equals(n.getType()))
                .collect(Collectors.toList());
    }

    // -- Delivery status ------------------------------------------------------

    @Override
    public List<Notification> findDeliverableNotifications() {
        LocalDateTime now = LocalDateTime.now();
        return findAll().stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .filter(n -> n.getExpiresAt() == null || n.getExpiresAt().isAfter(now))
                .filter(n -> n.getScheduledFor() == null || n.getScheduledFor().isBefore(now) || n.getScheduledFor().isEqual(now))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findPendingDelivery(LocalDateTime now) {
        return findAll().stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .filter(n -> n.getScheduledFor() == null || !n.getScheduledFor().isAfter(now))
                .filter(n -> n.getExpiresAt() == null || n.getExpiresAt().isAfter(now))
                .sorted(Comparator.comparing(Notification::getPriority).reversed()
                        .thenComparing(Notification::getCreatedAt))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findRetryableNotifications(List<NotificationPriority> priorities) {
        return findAll().stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .filter(n -> n.getDeliveryAttempts() != null && n.getDeliveryAttempts() < 3)
                .filter(n -> priorities.contains(n.getPriority()))
                .sorted(Comparator.comparing(Notification::getPriority).reversed()
                        .thenComparing(Notification::getCreatedAt))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findFailedDeliveries() {
        return findAll().stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .filter(n -> n.getDeliveryAttempts() != null && n.getDeliveryAttempts() >= 3)
                .collect(Collectors.toList());
    }

    // -- Scheduled notifications ----------------------------------------------

    @Override
    public List<Notification> findScheduledNotificationsDue(LocalDateTime now) {
        return findAll().stream()
                .filter(n -> Boolean.TRUE.equals(n.getIsScheduled()))
                .filter(n -> n.getScheduledFor() != null && !n.getScheduledFor().isAfter(now))
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findScheduledNotificationsBetween(LocalDateTime start, LocalDateTime end) {
        return findAll().stream()
                .filter(n -> Boolean.TRUE.equals(n.getIsScheduled()))
                .filter(n -> n.getScheduledFor() != null
                        && !n.getScheduledFor().isBefore(start)
                        && !n.getScheduledFor().isAfter(end))
                .collect(Collectors.toList());
    }

    // -- Expired notifications ------------------------------------------------

    @Override
    public List<Notification> findExpiredNotifications(LocalDateTime now) {
        return findAll().stream()
                .filter(n -> n.getExpiresAt() != null && !n.getExpiresAt().isAfter(now))
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .collect(Collectors.toList());
    }

    // -- Channel-specific -----------------------------------------------------

    @Override
    public List<Notification> findPendingByChannel(NotificationChannel channel) {
        return findAll().stream()
                .filter(n -> channel.equals(n.getChannel()))
                .filter(n -> Boolean.FALSE.equals(n.getIsDelivered()))
                .sorted(Comparator.comparing(Notification::getPriority).reversed()
                        .thenComparing(Notification::getCreatedAt))
                .collect(Collectors.toList());
    }

    // -- Related entity queries -----------------------------------------------

    @Override
    public List<Notification> findByApplicationIdOrderByCreatedAtDesc(String applicationId) {
        return findAll().stream()
                .filter(n -> n.getApplicationId() != null && n.getApplicationId().toString().equals(applicationId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByInterviewIdOrderByCreatedAtDesc(String interviewId) {
        return findAll().stream()
                .filter(n -> n.getInterviewId() != null && n.getInterviewId().toString().equals(interviewId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByJobPostingIdOrderByCreatedAtDesc(String jobPostingId) {
        return findAll().stream()
                .filter(n -> n.getJobPostingId() != null && n.getJobPostingId().toString().equals(jobPostingId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByOfferIdOrderByCreatedAtDesc(String offerId) {
        return findAll().stream()
                .filter(n -> n.getOfferId() != null && n.getOfferId().toString().equals(offerId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // -- Batch / group --------------------------------------------------------

    @Override
    public List<Notification> findByBatchIdOrderByCreatedAtDesc(String batchId) {
        return findAll().stream()
                .filter(n -> batchId.equals(n.getBatchId()))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByNotificationGroupOrderByCreatedAtDesc(String notificationGroup) {
        return findAll().stream()
                .filter(n -> notificationGroup.equals(n.getNotificationGroup()))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // -- Bulk operations ------------------------------------------------------

    @Override
    public int markAllAsReadForRecipient(String recipientId, LocalDateTime readAt) {
        List<Notification> unread = findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId);
        int count = 0;
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setReadAt(readAt);
            save(n);
            count++;
        }
        return count;
    }

    @Override
    public int markAllAsReadByTypeForRecipient(String recipientId, NotificationType type, LocalDateTime readAt) {
        List<Notification> unread = findUnreadByRecipientAndType(recipientId, type);
        int count = 0;
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setReadAt(readAt);
            save(n);
            count++;
        }
        return count;
    }

    // -- Dashboard ------------------------------------------------------------

    @Override
    public long countUrgentUnread(String recipientId) {
        return findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> NotificationPriority.URGENT.equals(n.getPriority()))
                .count();
    }

    @Override
    public long countTodayUnread(String recipientId, LocalDateTime today) {
        return findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId).stream()
                .filter(n -> n.getCreatedAt() != null && !n.getCreatedAt().isBefore(today))
                .count();
    }

    // -- Conversion: NotificationItem <-> Notification ------------------------

    @Override
    protected Notification toEntity(NotificationItem item) {
        var entity = new Notification();
        if (item.getId() != null) {
            try {
                entity.setId(Long.parseLong(item.getId()));
            } catch (NumberFormatException e) {
                // DynamoDB UUID-based IDs — leave id null for entity
            }
        }
        entity.setTenantId(item.getTenantId());
        if (item.getRecipientId() != null) entity.setRecipientId(Long.parseLong(item.getRecipientId()));
        if (item.getSenderId() != null) entity.setSenderId(Long.parseLong(item.getSenderId()));
        if (item.getType() != null) entity.setType(NotificationType.valueOf(item.getType()));
        if (item.getChannel() != null) entity.setChannel(NotificationChannel.valueOf(item.getChannel()));
        if (item.getPriority() != null) entity.setPriority(NotificationPriority.valueOf(item.getPriority()));
        entity.setTitle(item.getTitle());
        entity.setMessage(item.getMessage());
        entity.setActionUrl(item.getActionUrl());
        entity.setActionLabel(item.getActionLabel());
        entity.setIcon(item.getIcon());
        entity.setMetadata(item.getMetadata());
        if (item.getApplicationId() != null) entity.setApplicationId(Long.parseLong(item.getApplicationId()));
        if (item.getInterviewId() != null) entity.setInterviewId(Long.parseLong(item.getInterviewId()));
        if (item.getJobPostingId() != null) entity.setJobPostingId(Long.parseLong(item.getJobPostingId()));
        if (item.getOfferId() != null) entity.setOfferId(Long.parseLong(item.getOfferId()));
        entity.setIsRead(item.getIsRead());
        if (item.getReadAt() != null) entity.setReadAt(LocalDateTime.parse(item.getReadAt(), ISO_FMT));
        entity.setIsDelivered(item.getIsDelivered());
        if (item.getDeliveredAt() != null) entity.setDeliveredAt(LocalDateTime.parse(item.getDeliveredAt(), ISO_FMT));
        entity.setDeliveryAttempts(item.getDeliveryAttempts());
        if (item.getLastDeliveryAttempt() != null) entity.setLastDeliveryAttempt(LocalDateTime.parse(item.getLastDeliveryAttempt(), ISO_FMT));
        entity.setDeliveryError(item.getDeliveryError());
        entity.setEmailTo(item.getEmailTo());
        entity.setEmailSubject(item.getEmailSubject());
        entity.setEmailTemplate(item.getEmailTemplate());
        entity.setPhoneNumber(item.getPhoneNumber());
        entity.setSmsTemplate(item.getSmsTemplate());
        entity.setPushDeviceToken(item.getPushDeviceToken());
        entity.setPushPayload(item.getPushPayload());
        if (item.getScheduledFor() != null) entity.setScheduledFor(LocalDateTime.parse(item.getScheduledFor(), ISO_FMT));
        entity.setIsScheduled(item.getIsScheduled());
        if (item.getExpiresAt() != null) entity.setExpiresAt(LocalDateTime.parse(item.getExpiresAt(), ISO_FMT));
        entity.setNotificationGroup(item.getNotificationGroup());
        entity.setBatchId(item.getBatchId());
        entity.setIsBatchDigest(item.getIsBatchDigest());
        if (item.getCreatedAt() != null) entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        if (item.getCreatedBy() != null) entity.setCreatedBy(Long.parseLong(item.getCreatedBy()));
        return entity;
    }

    @Override
    protected NotificationItem toItem(Notification entity) {
        var item = new NotificationItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : LocalDateTime.now().format(ISO_FMT);
        String recipientIdStr = entity.getRecipientId() != null ? entity.getRecipientId().toString() : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("NOTIFICATION#" + id);

        // GSI1: Read status index
        item.setGsi1pk("NOTIF_READ#" + tenantId + "#" + entity.getIsRead());
        item.setGsi1sk("NOTIFICATION#" + createdAtStr);

        // GSI8: Recipient timeline index
        item.setGsi8pk("NOTIF_RECIPIENT#" + tenantId + "#" + recipientIdStr);
        item.setGsi8sk("NOTIFICATION#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getRecipientId() != null) item.setRecipientId(entity.getRecipientId().toString());
        if (entity.getSenderId() != null) item.setSenderId(entity.getSenderId().toString());
        if (entity.getType() != null) item.setType(entity.getType().name());
        if (entity.getChannel() != null) item.setChannel(entity.getChannel().name());
        if (entity.getPriority() != null) item.setPriority(entity.getPriority().name());
        item.setTitle(entity.getTitle());
        item.setMessage(entity.getMessage());
        item.setActionUrl(entity.getActionUrl());
        item.setActionLabel(entity.getActionLabel());
        item.setIcon(entity.getIcon());
        item.setMetadata(entity.getMetadata());
        if (entity.getApplicationId() != null) item.setApplicationId(entity.getApplicationId().toString());
        if (entity.getInterviewId() != null) item.setInterviewId(entity.getInterviewId().toString());
        if (entity.getJobPostingId() != null) item.setJobPostingId(entity.getJobPostingId().toString());
        if (entity.getOfferId() != null) item.setOfferId(entity.getOfferId().toString());
        item.setIsRead(entity.getIsRead());
        if (entity.getReadAt() != null) item.setReadAt(entity.getReadAt().format(ISO_FMT));
        item.setIsDelivered(entity.getIsDelivered());
        if (entity.getDeliveredAt() != null) item.setDeliveredAt(entity.getDeliveredAt().format(ISO_FMT));
        item.setDeliveryAttempts(entity.getDeliveryAttempts());
        if (entity.getLastDeliveryAttempt() != null) item.setLastDeliveryAttempt(entity.getLastDeliveryAttempt().format(ISO_FMT));
        item.setDeliveryError(entity.getDeliveryError());
        item.setEmailTo(entity.getEmailTo());
        item.setEmailSubject(entity.getEmailSubject());
        item.setEmailTemplate(entity.getEmailTemplate());
        item.setPhoneNumber(entity.getPhoneNumber());
        item.setSmsTemplate(entity.getSmsTemplate());
        item.setPushDeviceToken(entity.getPushDeviceToken());
        item.setPushPayload(entity.getPushPayload());
        if (entity.getScheduledFor() != null) item.setScheduledFor(entity.getScheduledFor().format(ISO_FMT));
        item.setIsScheduled(entity.getIsScheduled());
        if (entity.getExpiresAt() != null) item.setExpiresAt(entity.getExpiresAt().format(ISO_FMT));
        item.setNotificationGroup(entity.getNotificationGroup());
        item.setBatchId(entity.getBatchId());
        item.setIsBatchDigest(entity.getIsBatchDigest());
        item.setCreatedAt(createdAtStr);
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        if (entity.getCreatedBy() != null) item.setCreatedBy(entity.getCreatedBy().toString());

        return item;
    }
}
