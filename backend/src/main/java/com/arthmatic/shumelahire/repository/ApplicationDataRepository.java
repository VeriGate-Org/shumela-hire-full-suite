package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.PipelineTransition;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Application entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaApplicationDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoApplicationRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ApplicationDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Application> findById(String id);

    Application save(Application entity);

    List<Application> saveAll(List<Application> entities);

    void deleteById(String id);

    void delete(Application entity);

    boolean existsById(String id);

    /** Find multiple applications by their IDs. */
    List<Application> findAllByIds(List<String> ids);

    /** Find all applications for the current tenant. */
    List<Application> findAll();

    /** All applications (paginated with Spring Data Page). */
    Page<Application> findAll(Pageable pageable);

    /** Search applications by applicant name or job title (paginated with Spring Data Page). */
    Page<Application> searchApplications(String searchTerm, Pageable pageable);

    /** Count all applications for the current tenant. */
    long count();

    // ── Applicant-based queries ──────────────────────────────────────────────

    /** Find applications by applicant, ordered by submission date descending. */
    List<Application> findByApplicantIdOrderBySubmittedAtDesc(String applicantId);

    /** Count applications by applicant. */
    long countByApplicantId(String applicantId);

    // ── Job posting queries ─────────────────────────────────────────────────

    /** Find applications by job posting, ordered by submission date descending. */
    List<Application> findByJobPostingIdOrderBySubmittedAtDesc(String jobPostingId);

    /** Find applications by job posting and status. */
    List<Application> findByJobPostingIdAndStatus(String jobPostingId, ApplicationStatus status);

    /** Count applications by job posting. */
    long countByJobPostingId(String jobPostingId);

    /** Find applications by jobId (string reference). */
    List<Application> findByJobId(String jobId);

    // ── Applicant + job posting combination ─────────────────────────────────

    /** Find the unique application for an applicant/job posting pair. */
    Optional<Application> findByApplicantIdAndJobPostingId(String applicantId, String jobPostingId);

    /** Check if applicant has already applied for a specific job. */
    boolean existsByApplicantIdAndJobPostingId(String applicantId, String jobPostingId);

    // ── Status-based queries ────────────────────────────────────────────────

    /** Find applications by status, ordered by submission date descending. */
    List<Application> findByStatusOrderBySubmittedAtDesc(ApplicationStatus status);

    /** Find applications by status with cursor-based pagination. */
    CursorPage<Application> findByStatus(ApplicationStatus status, String cursor, int pageSize);

    /** Find applications matching any of the given statuses, ordered by submission date descending. */
    List<Application> findByStatusInOrderBySubmittedAtDesc(List<ApplicationStatus> statuses);

    /** Count applications by status. */
    long countByStatus(ApplicationStatus status);

    /** Find applications pending review (SUBMITTED or SCREENING), ordered by submission date ascending. */
    List<Application> findApplicationsPendingReview();

    /** Find applications requiring action (INTERVIEW_COMPLETED, REFERENCE_CHECK, OFFER_PENDING), ordered by updatedAt ascending. */
    List<Application> findApplicationsRequiringAction();

    /** Find active applications (not WITHDRAWN, REJECTED, HIRED, OFFER_DECLINED), ordered by submission date descending. */
    List<Application> findActiveApplications();

    /** Find withdrawn applications with withdrawnAt set, ordered by withdrawnAt descending. */
    List<Application> findByStatusAndWithdrawnAtIsNotNullOrderByWithdrawnAtDesc(ApplicationStatus status);

    /** Find applications with statuses and updatedAt before a threshold, ordered by submission date ascending. */
    List<Application> findByStatusInAndUpdatedAtBeforeOrderBySubmittedAtAsc(
        List<ApplicationStatus> statuses, LocalDateTime threshold);

    // ── Department queries ──────────────────────────────────────────────────

    /** Find applications by department, ordered by submission date descending. */
    List<Application> findByDepartmentOrderBySubmittedAtDesc(String department);

    // ── Source queries ──────────────────────────────────────────────────────

    /** Find applications by source, ordered by submission date descending. */
    List<Application> findByApplicationSourceOrderBySubmittedAtDesc(String source);

    // ── Rating queries ──────────────────────────────────────────────────────

    /** Find applications at or above a minimum rating, ordered by rating DESC then submission date DESC. */
    List<Application> findByRatingGreaterThanEqualOrderByRatingDescSubmittedAtDesc(Integer minRating);

    /** Count applications with a specific rating. */
    long countByRating(Integer rating);

    // ── Date range queries ──────────────────────────────────────────────────

    /** Find recent applications submitted since a given date, ordered by submission date descending. */
    List<Application> findRecentApplications(LocalDateTime since);

    /** Find applications submitted between two dates, ordered by submission date descending. */
    List<Application> findApplicationsSubmittedBetween(LocalDateTime startDate, LocalDateTime endDate);

    /** Find applications submitted between two dates. */
    List<Application> findBySubmittedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /** Find applications by status and submitted between two dates. */
    List<Application> findByStatusAndSubmittedAtBetween(ApplicationStatus status, LocalDateTime startDate, LocalDateTime endDate);

    // ── Search ──────────────────────────────────────────────────────────────

    /** Search applications by applicant name or job title (paginated). */
    CursorPage<Application> searchApplications(String searchTerm, String cursor, int pageSize);

    /**
     * Advanced search and filtering for applications (replaces JPA Specification usage).
     * All parameters are optional (null means no filter).
     */
    List<Application> searchApplicationsFiltered(
        String searchTerm,
        List<ApplicationStatus> statuses,
        List<String> departments,
        String jobTitle,
        LocalDateTime dateFrom,
        LocalDateTime dateTo,
        Integer minRating,
        Integer maxRating);

    // ── Counting / Analytics ────────────────────────────────────────────────

    /** Count applications submitted between two dates. */
    long countBySubmittedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /** Count applications by department and submitted between two dates. */
    long countByDepartmentAndSubmittedAtBetween(String department, LocalDateTime startDate, LocalDateTime endDate);

    /** Count applications by status and submitted between two dates. */
    long countByStatusAndSubmittedAtBetween(ApplicationStatus status, LocalDateTime startDate, LocalDateTime endDate);

    /** Count applications submitted after a given date. */
    long countBySubmittedAtAfter(LocalDateTime date);

    // ── Aggregate / reporting queries ───────────────────────────────────────

    /** Get counts per status. Returns list of [ApplicationStatus, Long]. */
    List<Object[]> getApplicationStatusCounts();

    /** Get pipeline distribution (same as status counts). Returns list of [ApplicationStatus, Long]. */
    List<Object[]> getPipelineDistribution();

    /** Count applications grouped by department. Returns list of [department, Long]. */
    List<Object[]> countByDepartment();

    /** Find pipeline transitions within a date range. */
    List<PipelineTransition> findTransitionsByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    // ── Performance analytics ───────────────────────────────────────────────

    /** Find hired applications with id, submittedAt, updatedAt, department. Returns list of Object[]. */
    List<Object[]> findHiredApplicationsWithDates();

    /** Find applications with their source and status. Returns list of [source, status]. */
    List<Object[]> findApplicationsBySource();

    /** Count hires by department. Returns list of [department, count]. */
    List<Object[]> findHiresByDepartment();

    /** Monthly hiring trends: [month, year, hiredCount, totalCount]. */
    List<Object[]> findMonthlyHiringTrends();

    /** Application counts by position/job title. Returns list of [jobTitle, count]. */
    List<Object[]> findApplicationsByPositionType();

    /** Seasonal hiring trends by month. Returns list of [month, count]. */
    List<Object[]> findSeasonalHiringTrends();

    // ── Data visualization ──────────────────────────────────────────────────

    /** Count applications by status. Returns list of [status, count]. */
    List<Object[]> findApplicationCountByStatus();

    /** Count applications by date since fromDate. Returns list of [date, count]. */
    List<Object[]> findApplicationCountByDate(LocalDateTime fromDate);

    /** Top positions by application count. Returns list of [jobTitle, count]. */
    List<Object[]> findTopPositionsByApplicationCount();
}
