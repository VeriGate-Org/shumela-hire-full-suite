package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.InterviewFeedback;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the InterviewFeedback entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaInterviewFeedbackDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoInterviewFeedbackRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface InterviewFeedbackDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<InterviewFeedback> findById(String id);

    InterviewFeedback save(InterviewFeedback entity);

    List<InterviewFeedback> saveAll(List<InterviewFeedback> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** All feedbacks for a given interview, ordered by submittedAt descending. */
    List<InterviewFeedback> findByInterviewIdOrderBySubmittedAtDesc(String interviewId);

    /** Find feedback by interview and submitter (unique constraint). */
    Optional<InterviewFeedback> findByInterviewIdAndSubmittedBy(String interviewId, String submittedBy);

    /** Check whether a specific user has already submitted feedback for an interview. */
    boolean existsByInterviewIdAndSubmittedBy(String interviewId, String submittedBy);

    /** Count feedbacks for a given interview. */
    long countByInterviewId(String interviewId);

    /** All feedbacks for interviews belonging to a given application, ordered by submittedAt desc. */
    List<InterviewFeedback> findByApplicationId(String applicationId);
}
