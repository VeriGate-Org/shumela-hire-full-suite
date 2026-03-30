package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.JobAdHistory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the JobAdHistory entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaJobAdHistoryDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoJobAdHistoryRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface JobAdHistoryDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<JobAdHistory> findById(String id);

    JobAdHistory save(JobAdHistory entity);

    List<JobAdHistory> saveAll(List<JobAdHistory> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find history for a specific job ad, ordered by timestamp descending. */
    List<JobAdHistory> findByJobAdIdOrderByTimestampDesc(String jobAdId);

    /** Find history entries by action type. */
    List<JobAdHistory> findByAction(String action);

    /** Find history entries by actor user ID. */
    List<JobAdHistory> findByActorUserId(String actorUserId);

    /** Find history within a date range, ordered by timestamp descending. */
    List<JobAdHistory> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate);

    /** Count history entries by action type. */
    long countByAction(String action);

    /** Find history for multiple job ads, ordered by timestamp descending. */
    List<JobAdHistory> findByJobAdIds(List<String> jobAdIds);
}
