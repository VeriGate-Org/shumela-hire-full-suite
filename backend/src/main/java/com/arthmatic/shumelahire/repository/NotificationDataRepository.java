package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Notification;
import com.arthmatic.shumelahire.entity.NotificationChannel;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Notification entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaNotificationDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoNotificationRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface NotificationDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<Notification> findById(String id);

    Notification save(Notification entity);

    List<Notification> saveAll(List<Notification> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Recipient queries ----------------------------------------------------

    /** All notifications for a recipient, newest first. */
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    /** Notifications for a recipient (paginated with Spring Data Page). */
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable);

    /** Unread notifications for a recipient, newest first. */
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(String recipientId);

    /** Notifications for a recipient filtered by type. */
    List<Notification> findByRecipientIdAndTypeOrderByCreatedAtDesc(String recipientId, NotificationType type);

    /** Notifications for a recipient filtered by channel. */
    List<Notification> findByRecipientIdAndChannelOrderByCreatedAtDesc(String recipientId, NotificationChannel channel);

    /** Notifications for a recipient filtered by priority. */
    List<Notification> findByRecipientIdAndPriorityOrderByCreatedAtDesc(String recipientId, NotificationPriority priority);

    // -- Unread counts / queries ----------------------------------------------

    /** Count of unread notifications for a recipient. */
    long countUnreadByRecipient(String recipientId);

    /** Unread notifications ordered by priority then date. */
    List<Notification> findUnreadByRecipientOrderByPriority(String recipientId);

    /** Unread notifications for a recipient filtered by type. */
    List<Notification> findUnreadByRecipientAndType(String recipientId, NotificationType type);

    // -- Delivery status ------------------------------------------------------

    /** All deliverable notifications (not yet delivered, not expired, past schedule). */
    List<Notification> findDeliverableNotifications();

    /** Pending delivery ordered by priority. */
    List<Notification> findPendingDelivery(LocalDateTime now);

    /** Notifications with failed deliveries that can be retried. */
    List<Notification> findRetryableNotifications(List<NotificationPriority> priorities);

    /** Notifications whose delivery permanently failed (>= 3 attempts). */
    List<Notification> findFailedDeliveries();

    // -- Scheduled notifications ----------------------------------------------

    /** Scheduled notifications that are now due. */
    List<Notification> findScheduledNotificationsDue(LocalDateTime now);

    /** Scheduled notifications in a date range. */
    List<Notification> findScheduledNotificationsBetween(LocalDateTime start, LocalDateTime end);

    // -- Expired notifications ------------------------------------------------

    /** Expired, undelivered notifications. */
    List<Notification> findExpiredNotifications(LocalDateTime now);

    // -- Channel-specific -----------------------------------------------------

    /** Pending notifications for a specific channel. */
    List<Notification> findPendingByChannel(NotificationChannel channel);

    // -- Related entity queries -----------------------------------------------

    List<Notification> findByApplicationIdOrderByCreatedAtDesc(String applicationId);

    List<Notification> findByInterviewIdOrderByCreatedAtDesc(String interviewId);

    List<Notification> findByJobPostingIdOrderByCreatedAtDesc(String jobPostingId);

    List<Notification> findByOfferIdOrderByCreatedAtDesc(String offerId);

    // -- Batch / group --------------------------------------------------------

    List<Notification> findByBatchIdOrderByCreatedAtDesc(String batchId);

    List<Notification> findByNotificationGroupOrderByCreatedAtDesc(String notificationGroup);

    // -- Bulk operations ------------------------------------------------------

    /** Mark all unread notifications as read for a recipient. Returns count. */
    int markAllAsReadForRecipient(String recipientId, LocalDateTime readAt);

    /** Mark all unread notifications of a given type as read. Returns count. */
    int markAllAsReadByTypeForRecipient(String recipientId, NotificationType type, LocalDateTime readAt);

    // -- Dashboard ------------------------------------------------------------

    /** Count of urgent unread notifications. */
    long countUrgentUnread(String recipientId);

    /** Count of today's unread notifications. */
    long countTodayUnread(String recipientId, LocalDateTime today);
}
