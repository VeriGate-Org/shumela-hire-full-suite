package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the JobBoardPosting entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaJobBoardPostingDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoJobBoardPostingRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface JobBoardPostingDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<JobBoardPosting> findById(String id);

    JobBoardPosting save(JobBoardPosting entity);

    List<JobBoardPosting> saveAll(List<JobBoardPosting> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find postings by job posting ID. */
    List<JobBoardPosting> findByJobPostingId(String jobPostingId);

    /** Find postings by status. */
    List<JobBoardPosting> findByStatus(PostingStatus status);

    /** Find postings by board type and status. */
    List<JobBoardPosting> findByBoardTypeAndStatus(JobBoardType boardType, PostingStatus status);

    /** Find expired postings (status=POSTED and expiresAt before now). */
    List<JobBoardPosting> findExpiredPostings(LocalDateTime now);
}
