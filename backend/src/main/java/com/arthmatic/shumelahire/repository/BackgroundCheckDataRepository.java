package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.BackgroundCheck;
import com.arthmatic.shumelahire.entity.BackgroundCheckStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the BackgroundCheck entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaBackgroundCheckDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoBackgroundCheckRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface BackgroundCheckDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<BackgroundCheck> findById(String id);

    BackgroundCheck save(BackgroundCheck entity);

    List<BackgroundCheck> saveAll(List<BackgroundCheck> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Background checks for a given application, newest first. */
    List<BackgroundCheck> findByApplicationIdOrderByCreatedAtDesc(String applicationId);

    /** Background checks for multiple applications. */
    List<BackgroundCheck> findByApplicationIdIn(List<String> applicationIds);

    /** Find a background check by its unique reference ID. */
    Optional<BackgroundCheck> findByReferenceId(String referenceId);

    /** Find a background check by its external screening ID. */
    Optional<BackgroundCheck> findByExternalScreeningId(String externalScreeningId);

    /** Background checks with a given status, newest first. */
    List<BackgroundCheck> findByStatusOrderByCreatedAtDesc(BackgroundCheckStatus status);

    /** Background checks in any of the given statuses, newest first. */
    List<BackgroundCheck> findByStatusInOrderByCreatedAtDesc(List<BackgroundCheckStatus> statuses);

    /** Pending background checks older than the cutoff. */
    List<BackgroundCheck> findPendingOlderThan(List<BackgroundCheckStatus> statuses, LocalDateTime cutoff);

    /** Completed background checks for a given application, newest first. */
    List<BackgroundCheck> findCompletedByApplicationId(String applicationId);

    /** Count background checks by status. */
    long countByStatus(BackgroundCheckStatus status);

    /** Background checks initiated by a given user, newest first. */
    List<BackgroundCheck> findByInitiatedBy(String userId);
}
