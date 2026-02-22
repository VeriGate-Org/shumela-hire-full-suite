package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    
    // Find by status
    List<JobPosting> findByStatusOrderByCreatedAtDesc(JobPostingStatus status);
    Page<JobPosting> findByStatus(JobPostingStatus status, Pageable pageable);
    
    // Find by multiple statuses
    List<JobPosting> findByStatusInOrderByCreatedAtDesc(List<JobPostingStatus> statuses);
    Page<JobPosting> findByStatusIn(List<JobPostingStatus> statuses, Pageable pageable);
    
    // Find published jobs
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' AND " +
           "(j.applicationDeadline IS NULL OR j.applicationDeadline > :now) " +
           "ORDER BY j.publishedAt DESC")
    List<JobPosting> findActivePublishedJobs(@Param("now") LocalDateTime now);
    
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' AND " +
           "(j.applicationDeadline IS NULL OR j.applicationDeadline > :now) " +
           "ORDER BY j.publishedAt DESC")
    Page<JobPosting> findActivePublishedJobs(@Param("now") LocalDateTime now, Pageable pageable);
    
    // Find by department
    List<JobPosting> findByDepartmentOrderByCreatedAtDesc(String department);
    Page<JobPosting> findByDepartment(String department, Pageable pageable);
    
    // Find by employment type
    List<JobPosting> findByEmploymentTypeOrderByCreatedAtDesc(EmploymentType employmentType);
    
    // Find by experience level
    List<JobPosting> findByExperienceLevelOrderByCreatedAtDesc(ExperienceLevel experienceLevel);
    
    // Find by location
    List<JobPosting> findByLocationContainingIgnoreCaseOrderByCreatedAtDesc(String location);
    
    // Find remote jobs
    List<JobPosting> findByRemoteWorkAllowedTrueAndStatusOrderByCreatedAtDesc(JobPostingStatus status);
    
    // Find featured jobs
    @Query("SELECT j FROM JobPosting j WHERE j.featured = true AND j.status = 'PUBLISHED' " +
           "ORDER BY j.publishedAt DESC")
    List<JobPosting> findFeaturedJobs();
    
    // Find urgent jobs
    @Query("SELECT j FROM JobPosting j WHERE j.urgent = true AND j.status = 'PUBLISHED' " +
           "ORDER BY j.publishedAt DESC")
    List<JobPosting> findUrgentJobs();
    
    // Find by creator
    List<JobPosting> findByCreatedByOrderByCreatedAtDesc(Long createdBy);
    Page<JobPosting> findByCreatedBy(Long createdBy, Pageable pageable);
    
    // Find jobs requiring approval
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PENDING_APPROVAL' ORDER BY j.submittedForApprovalAt ASC")
    List<JobPosting> findJobsRequiringApproval();
    
    // Search functionality
    @Query("SELECT j FROM JobPosting j WHERE " +
           "LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(j.department) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))")
    Page<JobPosting> searchJobPostings(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Advanced search with filters
    @Query("SELECT j FROM JobPosting j WHERE " +
           "(:searchTerm IS NULL OR " +
           " LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           " LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           " LOWER(j.department) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           " LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))) AND " +
           "(:department IS NULL OR j.department = :department) AND " +
           "(:employmentType IS NULL OR j.employmentType = :employmentType) AND " +
           "(:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel) AND " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))) AND " +
           "(:remoteWork IS NULL OR j.remoteWorkAllowed = :remoteWork) AND " +
           "(:status IS NULL OR j.status = :status)")
    Page<JobPosting> findJobsWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("department") String department,
            @Param("employmentType") EmploymentType employmentType,
            @Param("experienceLevel") ExperienceLevel experienceLevel,
            @Param("location") String location,
            @Param("remoteWork") Boolean remoteWork,
            @Param("status") JobPostingStatus status,
            Pageable pageable);
    
    // Find by slug
    Optional<JobPosting> findBySlug(String slug);
    
    // Check if slug exists
    boolean existsBySlug(String slug);
    
    // Count by status
    long countByStatus(JobPostingStatus status);
    
    // Count by department
    long countByDepartment(String department);
    
    // Count by creator
    long countByCreatedBy(Long createdBy);
    
    // Find jobs with upcoming deadlines
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' AND " +
           "j.applicationDeadline BETWEEN :now AND :deadline " +
           "ORDER BY j.applicationDeadline ASC")
    List<JobPosting> findJobsWithUpcomingDeadlines(@Param("now") LocalDateTime now, 
                                                   @Param("deadline") LocalDateTime deadline);
    
    // Find expired jobs
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' AND " +
           "j.applicationDeadline IS NOT NULL AND j.applicationDeadline < :now " +
           "ORDER BY j.applicationDeadline DESC")
    List<JobPosting> findExpiredJobs(@Param("now") LocalDateTime now);
    
    // Statistics queries
    @Query("SELECT j.status, COUNT(j) FROM JobPosting j GROUP BY j.status")
    List<Object[]> getJobPostingStatusCounts();
    
    @Query("SELECT j.department, COUNT(j) FROM JobPosting j GROUP BY j.department ORDER BY COUNT(j) DESC")
    List<Object[]> getJobPostingCountsByDepartment();
    
    @Query("SELECT j.employmentType, COUNT(j) FROM JobPosting j GROUP BY j.employmentType")
    List<Object[]> getJobPostingCountsByEmploymentType();
    
    // Find recently published jobs
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' AND " +
           "j.publishedAt >= :since ORDER BY j.publishedAt DESC")
    List<JobPosting> findRecentlyPublishedJobs(@Param("since") LocalDateTime since);
    
    // Update view count
    @Modifying
    @Query("UPDATE JobPosting j SET j.viewsCount = j.viewsCount + 1 WHERE j.id = :id")
    void incrementViewCount(@Param("id") Long id);
    
    // Update application count
    @Modifying
    @Query("UPDATE JobPosting j SET j.applicationsCount = j.applicationsCount + 1 WHERE j.id = :id")
    void incrementApplicationCount(@Param("id") Long id);
    
    // Find jobs created in date range
    @Query("SELECT j FROM JobPosting j WHERE j.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY j.createdAt DESC")
    List<JobPosting> findJobsCreatedBetween(@Param("startDate") LocalDateTime startDate,
                                           @Param("endDate") LocalDateTime endDate);
    
    // Find jobs by approval status
    @Query("SELECT j FROM JobPosting j WHERE j.approvedBy = :approverId ORDER BY j.approvedAt DESC")
    List<JobPosting> findJobsApprovedBy(@Param("approverId") Long approverId);
    
    // Find jobs published by user
    @Query("SELECT j FROM JobPosting j WHERE j.publishedBy = :publisherId ORDER BY j.publishedAt DESC")
    List<JobPosting> findJobsPublishedBy(@Param("publisherId") Long publisherId);

    // Tenant-scoped slug lookup
    Optional<JobPosting> findBySlugAndTenantId(String slug, String tenantId);
}