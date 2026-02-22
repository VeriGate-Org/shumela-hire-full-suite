package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.PipelineTransition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {
    
    // Find applications by applicant
    List<Application> findByApplicantIdOrderBySubmittedAtDesc(Long applicantId);
    
    // Find applications by job ad
    List<Application> findByJobPostingIdOrderBySubmittedAtDesc(Long jobAdId);
    
    // Find applications by status
    List<Application> findByStatusOrderBySubmittedAtDesc(ApplicationStatus status);
    
    // Find applications by applicant and job ad
    Optional<Application> findByApplicantIdAndJobPostingId(Long applicantId, Long jobAdId);
    
    // Check if applicant has already applied for job
    boolean existsByApplicantIdAndJobPostingId(Long applicantId, Long jobAdId);
    
    // Find applications by status with pagination
    Page<Application> findByStatus(ApplicationStatus status, Pageable pageable);
    
    // Find applications by multiple statuses
    List<Application> findByStatusInOrderBySubmittedAtDesc(List<ApplicationStatus> statuses);
    
    // Find recent applications
    @Query("SELECT a FROM Application a WHERE a.submittedAt >= :since ORDER BY a.submittedAt DESC")
    List<Application> findRecentApplications(@Param("since") LocalDateTime since);
    
    // Search applications by applicant name or job title
    @Query("SELECT a FROM Application a JOIN a.applicant ap WHERE " +
           "LOWER(CONCAT(ap.name, ' ', ap.surname)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))")
    Page<Application> searchApplications(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Find applications pending review (submitted or screening)
    @Query("SELECT a FROM Application a WHERE a.status IN ('SUBMITTED', 'SCREENING') ORDER BY a.submittedAt ASC")
    List<Application> findApplicationsPendingReview();
    
    // Find applications by department
    List<Application> findByDepartmentOrderBySubmittedAtDesc(String department);
    
    // Find applications submitted in date range
    @Query("SELECT a FROM Application a WHERE a.submittedAt BETWEEN :startDate AND :endDate ORDER BY a.submittedAt DESC")
    List<Application> findApplicationsSubmittedBetween(@Param("startDate") LocalDateTime startDate, 
                                                      @Param("endDate") LocalDateTime endDate);
    
    // Count applications by status
    long countByStatus(ApplicationStatus status);
    
    // Count applications by job ad
    long countByJobPostingId(Long jobAdId);
    
    // Count applications by applicant
    long countByApplicantId(Long applicantId);
    
    // Find applications requiring action (interview feedback, reference check, etc.)
    @Query("SELECT a FROM Application a WHERE a.status IN ('INTERVIEW_COMPLETED', 'REFERENCE_CHECK', 'OFFER_PENDING') ORDER BY a.updatedAt ASC")
    List<Application> findApplicationsRequiringAction();
    
    // Find withdrawn applications
    List<Application> findByStatusAndWithdrawnAtIsNotNullOrderByWithdrawnAtDesc(ApplicationStatus status);
    
    // Find applications by rating
    List<Application> findByRatingGreaterThanEqualOrderByRatingDescSubmittedAtDesc(Integer minRating);
    
    // Custom query for dashboard statistics
    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> getApplicationStatusCounts();
    
    // Find applications by job ad and status
    List<Application> findByJobPostingIdAndStatus(Long jobAdId, ApplicationStatus status);
    
    // Find active applications (not terminal status)
    @Query("SELECT a FROM Application a WHERE a.status NOT IN ('WITHDRAWN', 'REJECTED', 'HIRED', 'OFFER_DECLINED') ORDER BY a.submittedAt DESC")
    List<Application> findActiveApplications();
    
    // Find applications by source
    List<Application> findByApplicationSourceOrderBySubmittedAtDesc(String source);
    
    // Analytics methods
    Long countBySubmittedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    Long countByDepartmentAndSubmittedAtBetween(String department, LocalDateTime startDate, LocalDateTime endDate);
    
    Long countByStatusAndSubmittedAtBetween(ApplicationStatus status, LocalDateTime startDate, LocalDateTime endDate);
    
    List<Application> findBySubmittedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<Application> findByStatusAndSubmittedAtBetween(ApplicationStatus status, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> getPipelineDistribution();
    
    @Query("SELECT pt FROM PipelineTransition pt WHERE pt.effectiveAt BETWEEN :startDate AND :endDate")
    List<PipelineTransition> findTransitionsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Additional methods for ApplicationManagementService
    @Query("SELECT a.department, COUNT(a) FROM Application a GROUP BY a.department")
    List<Object[]> countByDepartment();
    
    Long countBySubmittedAtAfter(LocalDateTime date);
    
    Long countByRating(Integer rating);
    
    List<Application> findByStatusInAndUpdatedAtBeforeOrderBySubmittedAtAsc(
        List<ApplicationStatus> statuses, LocalDateTime threshold);

    // Analytics methods for PerformanceAnalyticsService
    @Query("SELECT a.id, a.submittedAt, a.updatedAt, a.department FROM Application a WHERE a.status = 'HIRED'")
    List<Object[]> findHiredApplicationsWithDates();

    @Query("SELECT a.applicationSource, a.status FROM Application a WHERE a.applicationSource IS NOT NULL")
    List<Object[]> findApplicationsBySource();

    @Query("SELECT a.department, COUNT(a) FROM Application a WHERE a.status = 'HIRED' GROUP BY a.department")
    List<Object[]> findHiresByDepartment();

    @Query("SELECT MONTH(a.submittedAt), YEAR(a.submittedAt), " +
           "SUM(CASE WHEN a.status = 'HIRED' THEN 1 ELSE 0 END), COUNT(a) " +
           "FROM Application a GROUP BY YEAR(a.submittedAt), MONTH(a.submittedAt) " +
           "ORDER BY YEAR(a.submittedAt), MONTH(a.submittedAt)")
    List<Object[]> findMonthlyHiringTrends();

    @Query("SELECT a.jobTitle, COUNT(a) FROM Application a GROUP BY a.jobTitle ORDER BY COUNT(a) DESC")
    List<Object[]> findApplicationsByPositionType();

    @Query("SELECT MONTH(a.submittedAt), COUNT(a) FROM Application a GROUP BY MONTH(a.submittedAt)")
    List<Object[]> findSeasonalHiringTrends();

    // DataVisualizationService methods
    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> findApplicationCountByStatus();

    @Query("SELECT CAST(a.submittedAt AS DATE), COUNT(a) FROM Application a WHERE a.submittedAt >= :fromDate GROUP BY CAST(a.submittedAt AS DATE) ORDER BY CAST(a.submittedAt AS DATE)")
    List<Object[]> findApplicationCountByDate(@Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT a.jobTitle, COUNT(a) FROM Application a GROUP BY a.jobTitle ORDER BY COUNT(a) DESC")
    List<Object[]> findTopPositionsByApplicationCount();

    // VacancyReportService methods
    List<Application> findByJobId(String jobId);
}