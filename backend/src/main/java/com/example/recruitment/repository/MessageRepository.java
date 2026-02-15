package com.example.recruitment.repository;

import com.example.recruitment.entity.Message;
import com.example.recruitment.entity.MessageType;
import com.example.recruitment.entity.MessagePriority;
import com.example.recruitment.entity.MessageRecipientType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Basic queries by sender/recipient
    List<Message> findBySenderIdOrderByCreatedAtDesc(Long senderId);
    
    @Query("SELECT m FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") String recipientId);
    
    @Query("SELECT m FROM Message m WHERE (m.senderId = :userId " +
           "OR m.recipientIds LIKE %:userIdStr%) AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<Message> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, 
                                                  @Param("userIdStr") String userIdStr);

    // Conversation and thread queries
    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    
    List<Message> findByThreadIdOrderByCreatedAtAsc(String threadId);
    
    @Query("SELECT m FROM Message m WHERE m.threadId = :threadId " +
           "AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<Message> findActiveMessagesByThread(@Param("threadId") String threadId);
    
    Optional<Message> findByThreadIdAndIsThreadStarterTrue(String threadId);
    
    List<Message> findByParentMessageIdOrderByCreatedAtAsc(Long parentMessageId);

    // Unread messages
    @Query("SELECT m FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isRead = false AND m.isDeleted = false " +
           "ORDER BY m.priority DESC, m.createdAt DESC")
    List<Message> findUnreadByRecipientOrderByPriority(@Param("recipientId") String recipientId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countUnreadByRecipient(@Param("recipientId") String recipientId);
    
    @Query("SELECT m FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isRead = false AND m.messageType = :type AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<Message> findUnreadByRecipientAndType(@Param("recipientId") String recipientId, 
                                              @Param("type") MessageType type);

    // Delivery and scheduling
    @Query("SELECT m FROM Message m WHERE m.isDelivered = false " +
           "AND (m.scheduledFor IS NULL OR m.scheduledFor <= :now) " +
           "AND m.isDeleted = false ORDER BY m.priority DESC, m.createdAt ASC")
    List<Message> findPendingDelivery(@Param("now") LocalDateTime now);
    
    @Query("SELECT m FROM Message m WHERE m.isScheduled = true " +
           "AND m.scheduledFor <= :now AND m.isDelivered = false " +
           "AND m.isDeleted = false")
    List<Message> findScheduledMessagesDue(@Param("now") LocalDateTime now);
    
    @Query("SELECT m FROM Message m WHERE m.isScheduled = true " +
           "AND m.scheduledFor BETWEEN :start AND :end AND m.isDeleted = false")
    List<Message> findScheduledMessagesBetween(@Param("start") LocalDateTime start, 
                                              @Param("end") LocalDateTime end);

    // Auto-delete and cleanup
    @Query("SELECT m FROM Message m WHERE m.autoDeleteAt IS NOT NULL " +
           "AND m.autoDeleteAt <= :now AND m.isDeleted = false")
    List<Message> findMessagesForAutoDelete(@Param("now") LocalDateTime now);
    
    @Query("SELECT m FROM Message m WHERE m.requiresResponse = true " +
           "AND m.responseDeadline IS NOT NULL AND m.responseDeadline <= :now " +
           "AND m.isDeleted = false")
    List<Message> findOverdueResponseMessages(@Param("now") LocalDateTime now);

    // Message type queries
    List<Message> findByMessageTypeOrderByCreatedAtDesc(MessageType messageType);
    
    @Query("SELECT m FROM Message m WHERE m.messageType = :type " +
           "AND m.recipientIds LIKE %:recipientId% AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<Message> findByTypeAndRecipient(@Param("type") MessageType type, 
                                        @Param("recipientId") String recipientId);
    
    @Query("SELECT m FROM Message m WHERE m.messageType IN :types " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findByMessageTypesIn(@Param("types") List<MessageType> types);

    // Priority and urgent messages
    @Query("SELECT m FROM Message m WHERE m.priority = :priority " +
           "AND m.recipientIds LIKE %:recipientId% AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<Message> findByPriorityAndRecipient(@Param("priority") MessagePriority priority, 
                                            @Param("recipientId") String recipientId);
    
    @Query("SELECT m FROM Message m WHERE m.isUrgent = true " +
           "AND m.recipientIds LIKE %:recipientId% AND m.isRead = false " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findUrgentUnreadByRecipient(@Param("recipientId") String recipientId);
    
    @Query("SELECT m FROM Message m WHERE m.requiresResponse = true " +
           "AND m.recipientIds LIKE %:recipientId% AND m.isDeleted = false " +
           "ORDER BY m.responseDeadline ASC")
    List<Message> findMessagesRequiringResponse(@Param("recipientId") String recipientId);

    // Related entity queries
    List<Message> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);
    
    List<Message> findByInterviewIdOrderByCreatedAtDesc(Long interviewId);
    
    List<Message> findByJobPostingIdOrderByCreatedAtDesc(Long jobPostingId);
    
    List<Message> findByOfferIdOrderByCreatedAtDesc(Long offerId);
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.applicationId = :entityId OR m.interviewId = :entityId " +
           "OR m.jobPostingId = :entityId OR m.offerId = :entityId) " +
           "AND (m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findByRelatedEntityAndUser(@Param("entityId") Long entityId, 
                                            @Param("userId") Long userId, 
                                            @Param("userIdStr") String userIdStr);

    // Search and filtering
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND (:messageType IS NULL OR m.messageType = :messageType) " +
           "AND (:priority IS NULL OR m.priority = :priority) " +
           "AND (:isRead IS NULL OR m.isRead = :isRead) " +
           "AND (:hasAttachments IS NULL OR m.hasAttachments = :hasAttachments) " +
           "AND (:startDate IS NULL OR m.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR m.createdAt <= :endDate) " +
           "AND (:searchTerm IS NULL OR LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(m.subject) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<Message> searchMessages(@Param("userId") Long userId,
                                 @Param("userIdStr") String userIdStr,
                                 @Param("messageType") MessageType messageType,
                                 @Param("priority") MessagePriority priority,
                                 @Param("isRead") Boolean isRead,
                                 @Param("hasAttachments") Boolean hasAttachments,
                                 @Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate,
                                 @Param("searchTerm") String searchTerm,
                                 Pageable pageable);

    // Archive operations
    @Query("SELECT m FROM Message m WHERE m.isArchived = true " +
           "AND (m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "ORDER BY m.archivedAt DESC")
    List<Message> findArchivedByUser(@Param("userId") Long userId, 
                                    @Param("userIdStr") String userIdStr);
    
    @Query("SELECT m FROM Message m WHERE m.isArchived = false " +
           "AND (m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findActiveByUser(@Param("userId") Long userId, 
                                  @Param("userIdStr") String userIdStr);

    // Analytics and reporting
    @Query("SELECT m.messageType, COUNT(m) FROM Message m WHERE " +
           "(m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND m.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY m.messageType")
    List<Object[]> getMessageStatsByType(@Param("userId") Long userId,
                                        @Param("userIdStr") String userIdStr,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT DATE(m.createdAt), COUNT(m) FROM Message m WHERE " +
           "(m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND m.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(m.createdAt) ORDER BY DATE(m.createdAt)")
    List<Object[]> getDailyMessageCounts(@Param("userId") Long userId,
                                        @Param("userIdStr") String userIdStr,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);

    // Performance queries
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findRecentMessagesByUser(@Param("userId") Long userId,
                                          @Param("userIdStr") String userIdStr,
                                          Pageable pageable);
    
    @Query("SELECT m.conversationId FROM Message m WHERE " +
           "(m.senderId = :userId OR m.recipientIds LIKE %:userIdStr%) " +
           "AND m.conversationId IS NOT NULL AND m.isDeleted = false " +
           "GROUP BY m.conversationId " +
           "ORDER BY MAX(m.createdAt) DESC")
    List<String> findActiveConversationsByUser(@Param("userId") Long userId,
                                              @Param("userIdStr") String userIdStr);

    // Dashboard queries
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isRead = false AND m.isUrgent = true AND m.isDeleted = false")
    Long countUrgentUnread(@Param("recipientId") String recipientId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isRead = false AND m.createdAt >= :today AND m.isDeleted = false")
    Long countTodayUnread(@Param("recipientId") String recipientId, 
                         @Param("today") LocalDateTime today);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.requiresResponse = true AND m.isDeleted = false")
    Long countRequiringResponse(@Param("recipientId") String recipientId);

    // Bulk operations
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.recipientIds LIKE %:recipientId% " +
           "AND m.isRead = false")
    int markAllAsReadForRecipient(@Param("recipientId") String recipientId);

    @Modifying
    @Query("UPDATE Message m SET m.isArchived = true, m.archivedAt = :archivedAt " +
           "WHERE m.id IN :messageIds")
    int archiveMessages(@Param("messageIds") List<Long> messageIds,
                       @Param("archivedAt") LocalDateTime archivedAt);

    @Modifying
    @Query("UPDATE Message m SET m.isDeleted = true, m.deletedAt = :deletedAt, m.deletedBy = :deletedBy " +
           "WHERE m.id IN :messageIds")
    int deleteMessages(@Param("messageIds") List<Long> messageIds,
                      @Param("deletedAt") LocalDateTime deletedAt,
                      @Param("deletedBy") Long deletedBy);
}