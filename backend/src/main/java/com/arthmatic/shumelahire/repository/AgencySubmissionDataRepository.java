package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.AgencySubmission;
import com.arthmatic.shumelahire.entity.AgencySubmissionStatus;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the AgencySubmission entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaAgencySubmissionDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoAgencySubmissionRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface AgencySubmissionDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<AgencySubmission> findById(String id);

    AgencySubmission save(AgencySubmission entity);

    List<AgencySubmission> saveAll(List<AgencySubmission> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find all submissions by a specific agency. */
    List<AgencySubmission> findByAgencyId(String agencyId);

    /** Find all submissions for a specific job posting. */
    List<AgencySubmission> findByJobPostingId(String jobPostingId);

    /** Find submissions by status. */
    List<AgencySubmission> findByStatus(AgencySubmissionStatus status);

    /** Find submissions by agency and status. */
    List<AgencySubmission> findByAgencyIdAndStatus(String agencyId, AgencySubmissionStatus status);

    /** Count all submissions by a specific agency. */
    long countByAgencyId(String agencyId);

    /** Count submissions by agency and status. */
    long countByAgencyIdAndStatus(String agencyId, AgencySubmissionStatus status);

    /** All agency submissions for the current tenant. */
    List<AgencySubmission> findAll();
}
