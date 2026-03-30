package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ScreeningQuestion;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the ScreeningQuestion entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaScreeningQuestionDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoScreeningQuestionRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ScreeningQuestionDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<ScreeningQuestion> findById(String id);

    ScreeningQuestion save(ScreeningQuestion entity);

    List<ScreeningQuestion> saveAll(List<ScreeningQuestion> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find active questions for a job posting, ordered by display order. */
    List<ScreeningQuestion> findByJobPostingIdAndIsActiveTrueOrderByDisplayOrder(String jobPostingId);

    /** Alias: find active questions for a job posting, ordered by display order. */
    List<ScreeningQuestion> findActiveQuestionsByJobPostingIdOrderedByDisplay(String jobPostingId);

    /** Find active questions for a job posting. */
    List<ScreeningQuestion> findByJobPostingIdAndIsActiveTrue(String jobPostingId);

    /** Find all questions (active and inactive) for a job posting. */
    List<ScreeningQuestion> findByJobPostingId(String jobPostingId);

    /** Count required active questions for a job posting. */
    long countRequiredQuestionsByJobPostingId(String jobPostingId);

    /** Count all active questions for a job posting. */
    long countActiveQuestionsByJobPostingId(String jobPostingId);

    /** Check if an active question with the given text exists for the job posting. */
    boolean existsByJobPostingIdAndQuestionTextAndIsActiveTrue(String jobPostingId, String questionText);

    /** Find the maximum display order for questions on a job posting. */
    Integer findMaxDisplayOrderByJobPostingId(String jobPostingId);
}
