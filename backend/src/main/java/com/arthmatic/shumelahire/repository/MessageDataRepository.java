package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Message;
import com.arthmatic.shumelahire.entity.MessageType;
import com.arthmatic.shumelahire.entity.MessagePriority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Message entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaMessageDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoMessageRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface MessageDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<Message> findById(String id);

    Message save(Message entity);

    List<Message> saveAll(List<Message> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Sender / Recipient queries -------------------------------------------

    /** All messages sent by a user, newest first. */
    List<Message> findBySenderIdOrderByCreatedAtDesc(String senderId);

    /** All messages received by a user (recipient in JSON list), newest first. */
    List<Message> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    /** All messages a user sent or received, newest first. */
    List<Message> findByUserIdOrderByCreatedAtDesc(String userId);

    // -- Conversation / Thread ------------------------------------------------

    /** All messages in a conversation, oldest first. */
    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    /** All messages in a thread, oldest first. */
    List<Message> findByThreadIdOrderByCreatedAtAsc(String threadId);

    /** Active (non-deleted) messages in a thread. */
    List<Message> findActiveMessagesByThread(String threadId);

    /** The thread-starter message for a thread. */
    Optional<Message> findByThreadIdAndIsThreadStarterTrue(String threadId);

    /** Replies to a parent message. */
    List<Message> findByParentMessageIdOrderByCreatedAtAsc(String parentMessageId);

    // -- Unread ---------------------------------------------------------------

    /** Unread messages for a recipient ordered by priority. */
    List<Message> findUnreadByRecipientOrderByPriority(String recipientId);

    /** Count of unread messages for a recipient. */
    long countUnreadByRecipient(String recipientId);

    /** Unread messages for a recipient filtered by type. */
    List<Message> findUnreadByRecipientAndType(String recipientId, MessageType type);

    // -- Delivery / Scheduling ------------------------------------------------

    /** Messages pending delivery. */
    List<Message> findPendingDelivery(LocalDateTime now);

    /** Scheduled messages that are now due. */
    List<Message> findScheduledMessagesDue(LocalDateTime now);

    // -- Type / Priority queries ----------------------------------------------

    /** Messages by type, newest first. */
    List<Message> findByMessageTypeOrderByCreatedAtDesc(MessageType messageType);

    /** Urgent unread messages for a recipient. */
    List<Message> findUrgentUnreadByRecipient(String recipientId);

    /** Messages requiring response for a recipient. */
    List<Message> findMessagesRequiringResponse(String recipientId);

    // -- Related entity queries -----------------------------------------------

    List<Message> findByApplicationIdOrderByCreatedAtDesc(String applicationId);

    List<Message> findByInterviewIdOrderByCreatedAtDesc(String interviewId);

    List<Message> findByJobPostingIdOrderByCreatedAtDesc(String jobPostingId);

    List<Message> findByOfferIdOrderByCreatedAtDesc(String offerId);

    // -- Archive --------------------------------------------------------------

    /** Archived messages for a user. */
    List<Message> findArchivedByUser(String userId);

    /** Active (non-archived, non-deleted) messages for a user. */
    List<Message> findActiveByUser(String userId);

    // -- Bulk operations ------------------------------------------------------

    /** Mark all unread messages as read for a recipient. Returns count. */
    int markAllAsReadForRecipient(String recipientId);

    // -- Dashboard ------------------------------------------------------------

    /** Count of urgent unread messages. */
    long countUrgentUnread(String recipientId);

    /** Count of today's unread messages. */
    long countTodayUnread(String recipientId, LocalDateTime today);

    /** Count of messages requiring response. */
    long countRequiringResponse(String recipientId);
}
