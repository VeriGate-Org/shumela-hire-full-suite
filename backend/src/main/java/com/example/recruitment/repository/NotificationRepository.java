package com.example.recruitment.repository;

import com.example.recruitment.entity.Notification;
import com.example.recruitment.entity.NotificationType;
import com.example.recruitment.entity.NotificationChannel;
import com.example.recruitment.entity.NotificationPriority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Basic queries
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);
    
    List<Notification> findByRecipientIdAndTypeOrderByCreatedAtDesc(Long recipientId, NotificationType type);
    
    List<Notification> findByRecipientIdAndChannelOrderByCreatedAtDesc(Long recipientId, NotificationChannel channel);
    
    List<Notification> findByRecipientIdAndPriorityOrderByCreatedAtDesc(Long recipientId, NotificationPriority priority);

    // Unread notifications
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId AND n.isRead = false")
    Long countUnreadByRecipient(@Param("recipientId") Long recipientId);
    
    @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND n.isRead = false " +
           "ORDER BY n.priority DESC, n.createdAt DESC")
    List<Notification> findUnreadByRecipientOrderByPriority(@Param("recipientId") Long recipientId);
    
    @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND n.isRead = false " +
           "AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByRecipientAndType(@Param("recipientId") Long recipientId, 
                                                   @Param("type") NotificationType type);

    // Delivery status — canBeDelivered is a computed method, not a persistent property
    @Query("SELECT n FROM Notification n WHERE n.isDelivered = false " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > CURRENT_TIMESTAMP) " +
           "AND (n.scheduledFor IS NULL OR n.scheduledFor <= CURRENT_TIMESTAMP)")
    List<Notification> findDeliverableNotifications();
    
    @Query("SELECT n FROM Notification n WHERE n.isDelivered = false " +
           "AND (n.scheduledFor IS NULL OR n.scheduledFor <= :now) " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "ORDER BY n.priority DESC, n.createdAt ASC")
    List<Notification> findPendingDelivery(@Param("now") LocalDateTime now);
    
    @Query("SELECT n FROM Notification n WHERE n.isDelivered = false " +
           "AND n.deliveryAttempts < 3 AND n.priority IN :priorities " +
           "ORDER BY n.priority DESC, n.createdAt ASC")
    List<Notification> findRetryableNotifications(@Param("priorities") List<NotificationPriority> priorities);
    
    @Query("SELECT n FROM Notification n WHERE n.isDelivered = false " +
           "AND n.deliveryAttempts >= 3")
    List<Notification> findFailedDeliveries();

    // Scheduled notifications
    @Query("SELECT n FROM Notification n WHERE n.isScheduled = true " +
           "AND n.scheduledFor <= :now AND n.isDelivered = false")
    List<Notification> findScheduledNotificationsDue(@Param("now") LocalDateTime now);
    
    @Query("SELECT n FROM Notification n WHERE n.isScheduled = true " +
           "AND n.scheduledFor BETWEEN :start AND :end")
    List<Notification> findScheduledNotificationsBetween(@Param("start") LocalDateTime start, 
                                                        @Param("end") LocalDateTime end);

    // Expired notifications
    @Query("SELECT n FROM Notification n WHERE n.expiresAt IS NOT NULL " +
           "AND n.expiresAt <= :now AND n.isDelivered = false")
    List<Notification> findExpiredNotifications(@Param("now") LocalDateTime now);

    // Channel-specific queries
    @Query("SELECT n FROM Notification n WHERE n.channel = :channel " +
           "AND n.isDelivered = false ORDER BY n.priority DESC, n.createdAt ASC")
    List<Notification> findPendingByChannel(@Param("channel") NotificationChannel channel);
    
    @Query("SELECT n FROM Notification n WHERE n.channel = 'EMAIL' " +
           "AND n.emailTo = :email AND n.isDelivered = false")
    List<Notification> findPendingEmailNotifications(@Param("email") String email);
    
    @Query("SELECT n FROM Notification n WHERE n.channel = 'SMS' " +
           "AND n.phoneNumber = :phoneNumber AND n.isDelivered = false")
    List<Notification> findPendingSmsNotifications(@Param("phoneNumber") String phoneNumber);

    // Related entity queries
    List<Notification> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);
    
    List<Notification> findByInterviewIdOrderByCreatedAtDesc(Long interviewId);
    
    List<Notification> findByJobPostingIdOrderByCreatedAtDesc(Long jobPostingId);
    
    List<Notification> findByOfferIdOrderByCreatedAtDesc(Long offerId);
    
    @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND (n.applicationId = :entityId OR n.interviewId = :entityId " +
           "OR n.jobPostingId = :entityId OR n.offerId = :entityId) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientAndRelatedEntity(@Param("recipientId") Long recipientId, 
                                                      @Param("entityId") Long entityId);

    // Batch and group operations
    List<Notification> findByBatchIdOrderByCreatedAtDesc(String batchId);
    
    List<Notification> findByNotificationGroupOrderByCreatedAtDesc(String notificationGroup);
    
    @Query("SELECT n FROM Notification n WHERE n.isBatchDigest = true " +
           "AND n.recipientId = :recipientId ORDER BY n.createdAt DESC")
    List<Notification> findBatchDigestsByRecipient(@Param("recipientId") Long recipientId);

    // Search and filtering
    @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND (:type IS NULL OR n.type = :type) " +
           "AND (:channel IS NULL OR n.channel = :channel) " +
           "AND (:priority IS NULL OR n.priority = :priority) " +
           "AND (:isRead IS NULL OR n.isRead = :isRead) " +
           "AND (:startDate IS NULL OR n.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR n.createdAt <= :endDate) " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> searchNotifications(@Param("recipientId") Long recipientId,
                                          @Param("type") NotificationType type,
                                          @Param("channel") NotificationChannel channel,
                                          @Param("priority") NotificationPriority priority,
                                          @Param("isRead") Boolean isRead,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate,
                                          Pageable pageable);

    // Analytics and reporting
    @Query("SELECT n.type, COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.createdAt BETWEEN :startDate AND :endDate GROUP BY n.type")
    List<Object[]> getNotificationStatsByType(@Param("recipientId") Long recipientId,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT n.channel, COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.createdAt BETWEEN :startDate AND :endDate GROUP BY n.channel")
    List<Object[]> getNotificationStatsByChannel(@Param("recipientId") Long recipientId,
                                                @Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT DATE(n.createdAt), COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.createdAt BETWEEN :startDate AND :endDate GROUP BY DATE(n.createdAt) " +
           "ORDER BY DATE(n.createdAt)")
    List<Object[]> getDailyNotificationCounts(@Param("recipientId") Long recipientId,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    // Performance queries
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.createdAt >= :since")
    Long countRecentNotifications(@Param("recipientId") Long recipientId, 
                                 @Param("since") LocalDateTime since);
    
    @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.isRead = false ORDER BY n.priority DESC, n.createdAt DESC")
    List<Notification> findTopUnreadNotifications(@Param("recipientId") Long recipientId,
                                                 Pageable pageable);
    
    @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.type IN :urgentTypes AND n.isRead = false " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findUrgentUnreadNotifications(@Param("recipientId") Long recipientId,
                                                    @Param("urgentTypes") List<NotificationType> urgentTypes);

    // Cleanup operations
    @Query("SELECT n FROM Notification n WHERE n.createdAt <= :cutoffDate " +
           "AND (n.isRead = true OR n.expiresAt <= :now)")
    List<Notification> findOldNotificationsForCleanup(@Param("cutoffDate") LocalDateTime cutoffDate,
                                                      @Param("now") LocalDateTime now);
    
    @Query("SELECT n FROM Notification n WHERE n.expiresAt <= :now")
    List<Notification> findExpiredNotificationsForCleanup(@Param("now") LocalDateTime now);

    // Bulk operations
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.recipientId = :recipientId AND n.isRead = false")
    int markAllAsReadForRecipient(@Param("recipientId") Long recipientId,
                                 @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.recipientId = :recipientId AND n.type = :type AND n.isRead = false")
    int markAllAsReadByTypeForRecipient(@Param("recipientId") Long recipientId,
                                       @Param("type") NotificationType type,
                                       @Param("readAt") LocalDateTime readAt);

    // Dashboard queries
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.isRead = false AND n.priority = 'URGENT'")
    Long countUrgentUnread(@Param("recipientId") Long recipientId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.isRead = false AND n.createdAt >= :today")
    Long countTodayUnread(@Param("recipientId") Long recipientId, 
                         @Param("today") LocalDateTime today);
    
    @Query("SELECT n.type, COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId " +
           "AND n.isRead = false GROUP BY n.type ORDER BY COUNT(n) DESC")
    List<Object[]> getUnreadCountsByType(@Param("recipientId") Long recipientId);
}