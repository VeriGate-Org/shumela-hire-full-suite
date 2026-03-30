package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ShortlistScore;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the ShortlistScore entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaShortlistScoreDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoShortlistScoreRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ShortlistScoreDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<ShortlistScore> findById(String id);

    ShortlistScore save(ShortlistScore entity);

    List<ShortlistScore> saveAll(List<ShortlistScore> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find the shortlist score for a given application. */
    Optional<ShortlistScore> findByApplicationId(String applicationId);

    /** All scores for a job posting, ordered by total score descending. */
    List<ShortlistScore> findByJobPostingIdOrderByScore(String jobPostingId);

    /** Scores meeting the threshold for a job posting, ordered by total score descending. */
    List<ShortlistScore> findShortlistableByThreshold(String jobPostingId, Double threshold);
}
