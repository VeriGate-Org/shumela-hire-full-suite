package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the JobPosting entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaJobPostingDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoJobPostingRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface JobPostingDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<JobPosting> findById(String id);

    JobPosting save(JobPosting entity);

    List<JobPosting> saveAll(List<JobPosting> entities);

    void deleteById(String id);

    void delete(JobPosting entity);

    boolean existsById(String id);

    // ── Status queries ───────────────────────────────────────────────────────

    /** Find job postings by status, ordered by createdAt DESC. */
    List<JobPosting> findByStatusOrderByCreatedAtDesc(JobPostingStatus status);

    /** Find job postings by status (paginated). */
    CursorPage<JobPosting> findByStatusPaginated(JobPostingStatus status, String cursor, int pageSize);

    /** Find job postings by multiple statuses, ordered by createdAt DESC. */
    List<JobPosting> findByStatusInOrderByCreatedAtDesc(List<JobPostingStatus> statuses);

    /** Find job postings by multiple statuses (paginated). */
    CursorPage<JobPosting> findByStatusInPaginated(List<JobPostingStatus> statuses, String cursor, int pageSize);

    // ── Published job queries ────────────────────────────────────────────────

    /** Find active published jobs (not past deadline). */
    List<JobPosting> findActivePublishedJobs(LocalDateTime now);

    /** Find active published jobs (paginated). */
    CursorPage<JobPosting> findActivePublishedJobsPaginated(LocalDateTime now, String cursor, int pageSize);

    // ── Department / Filter queries ──────────────────────────────────────────

    /** Find by department, ordered by createdAt DESC. */
    List<JobPosting> findByDepartmentOrderByCreatedAtDesc(String department);

    /** Find by department (paginated). */
    CursorPage<JobPosting> findByDepartmentPaginated(String department, String cursor, int pageSize);

    /** Find by employment type, ordered by createdAt DESC. */
    List<JobPosting> findByEmploymentTypeOrderByCreatedAtDesc(EmploymentType employmentType);

    /** Find by experience level, ordered by createdAt DESC. */
    List<JobPosting> findByExperienceLevelOrderByCreatedAtDesc(ExperienceLevel experienceLevel);

    /** Find by location (case-insensitive contains), ordered by createdAt DESC. */
    List<JobPosting> findByLocationContainingIgnoreCaseOrderByCreatedAtDesc(String location);

    /** Find remote jobs by status. */
    List<JobPosting> findByRemoteWorkAllowedTrueAndStatus(JobPostingStatus status);

    // ── Featured / Urgent ────────────────────────────────────────────────────

    /** Find featured published jobs. */
    List<JobPosting> findFeaturedJobs();

    /** Find urgent published jobs. */
    List<JobPosting> findUrgentJobs();

    // ── Creator queries ──────────────────────────────────────────────────────

    /** Find by creator, ordered by createdAt DESC. */
    List<JobPosting> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    /** Find by creator (paginated). */
    CursorPage<JobPosting> findByCreatedByPaginated(String createdBy, String cursor, int pageSize);

    // ── Approval workflow ────────────────────────────────────────────────────

    /** Find jobs requiring approval, ordered by submittedForApprovalAt ASC. */
    List<JobPosting> findJobsRequiringApproval();

    // ── Search ───────────────────────────────────────────────────────────────

    /** Search job postings by search term (paginated). */
    CursorPage<JobPosting> searchJobPostings(String searchTerm, String cursor, int pageSize);

    /** Advanced search with multiple filters (paginated). */
    CursorPage<JobPosting> findJobsWithFilters(String searchTerm, String department,
                                                EmploymentType employmentType,
                                                ExperienceLevel experienceLevel,
                                                String location, Boolean remoteWork,
                                                JobPostingStatus status,
                                                String cursor, int pageSize);

    // ── Slug ─────────────────────────────────────────────────────────────────

    /** Find by slug. */
    Optional<JobPosting> findBySlug(String slug);

    /** Check if slug exists. */
    boolean existsBySlug(String slug);

    /** Find by slug and tenant ID. */
    Optional<JobPosting> findBySlugAndTenantId(String slug, String tenantId);

    // ── Counts ───────────────────────────────────────────────────────────────

    /** Count all job postings. */
    long count();

    /** Count by status. */
    long countByStatus(JobPostingStatus status);

    /** Count by department. */
    long countByDepartment(String department);

    /** Count by creator. */
    long countByCreatedBy(String createdBy);

    // ── Deadline / Expiry queries ────────────────────────────────────────────

    /** Find published jobs with upcoming deadlines. */
    List<JobPosting> findJobsWithUpcomingDeadlines(LocalDateTime now, LocalDateTime deadline);

    /** Find expired published jobs. */
    List<JobPosting> findExpiredJobs(LocalDateTime now);

    // ── Statistics ────────────────────────────────────────────────────────────

    /** Get job posting counts by status. */
    List<Object[]> getJobPostingStatusCounts();

    /** Get job posting counts by department. */
    List<Object[]> getJobPostingCountsByDepartment();

    /** Get job posting counts by employment type. */
    List<Object[]> getJobPostingCountsByEmploymentType();

    // ── Misc ─────────────────────────────────────────────────────────────────

    /** Find recently published jobs. */
    List<JobPosting> findRecentlyPublishedJobs(LocalDateTime since);

    /** Increment view count. */
    void incrementViewCount(String id);

    /** Increment application count. */
    void incrementApplicationCount(String id);

    /** Find jobs created between dates. */
    List<JobPosting> findJobsCreatedBetween(LocalDateTime startDate, LocalDateTime endDate);

    /** Find jobs approved by a specific user. */
    List<JobPosting> findJobsApprovedBy(String approverId);

    /** Find jobs published by a specific user. */
    List<JobPosting> findJobsPublishedBy(String publisherId);

    // ── Page-based queries (JPA compatibility) ───────────────────────────────

    /** All job postings (unpaginated). */
    List<JobPosting> findAll();

    /** All job postings (paginated with Spring Data Page). */
    Page<JobPosting> findAll(Pageable pageable);

    /** Search job postings by search term (paginated with Spring Data Page). */
    Page<JobPosting> searchJobPostings(String searchTerm, Pageable pageable);

    /** Advanced search with multiple filters (paginated with Spring Data Page). */
    Page<JobPosting> findJobsWithFilters(String searchTerm, String department,
                                          EmploymentType employmentType,
                                          ExperienceLevel experienceLevel,
                                          String location, Boolean remoteWork,
                                          JobPostingStatus status,
                                          Pageable pageable);

    /** Find active published jobs (paginated with Spring Data Page). */
    Page<JobPosting> findActivePublishedJobs(LocalDateTime now, Pageable pageable);

    /** Find by creator (paginated with Spring Data Page). */
    Page<JobPosting> findByCreatedBy(String createdBy, Pageable pageable);
}
