package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ScreeningAnswer;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the ScreeningAnswer entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaScreeningAnswerDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoScreeningAnswerRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ScreeningAnswerDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<ScreeningAnswer> findById(String id);

    ScreeningAnswer save(ScreeningAnswer entity);

    List<ScreeningAnswer> saveAll(List<ScreeningAnswer> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find answers by application ID. */
    List<ScreeningAnswer> findByApplicationId(String applicationId);

    /** Find a specific answer for an application and question. */
    Optional<ScreeningAnswer> findByApplicationIdAndScreeningQuestionId(String applicationId, String screeningQuestionId);

    /** Find answers by application ID ordered by question display order. */
    List<ScreeningAnswer> findByApplicationIdOrderedByQuestionDisplay(String applicationId);

    /** Count missing required answers for an application. */
    long countMissingRequiredAnswersByApplicationId(String applicationId);

    /** Count invalid answers for an application. */
    long countInvalidAnswersByApplicationId(String applicationId);

    /** Count required answers for an application. */
    long countRequiredAnswersByApplicationId(String applicationId);

    /** Count total answers for an application. */
    long countTotalAnswersByApplicationId(String applicationId);

    /** Find valid answers for a job posting. */
    List<ScreeningAnswer> findValidAnswersByJobPostingId(String jobPostingId);

    /** Delete all answers for an application. */
    void deleteByApplicationId(String applicationId);

    /** Check if an answer exists for an application and question. */
    boolean existsByApplicationIdAndScreeningQuestionId(String applicationId, String screeningQuestionId);
}
