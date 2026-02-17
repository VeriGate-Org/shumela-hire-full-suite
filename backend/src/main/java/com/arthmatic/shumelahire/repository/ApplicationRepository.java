package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository("shumelahireApplicationRepository")
public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {

    List<Application> findByApplicant(Applicant applicant);

    List<Application> findByStatus(String status);

    List<Application> findByStatusIn(List<String> statuses);

    List<Application> findByJobId(String jobId);

    List<Application> findByJobTitle(String jobTitle);

    List<Application> findByJobTitleContainingIgnoreCase(String jobTitle);

    List<Application> findBySubmittedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Application> findByRatingGreaterThanEqual(Integer rating);

    List<Application> findByRatingBetween(Integer minRating, Integer maxRating);

    // Count methods for statistics
    long countByStatus(String status);

    long countBySubmittedAtAfter(LocalDateTime date);

    long countByRatingGreaterThanEqual(Integer rating);

    // Custom queries for statistics
    @Query("SELECT AVG(a.rating) FROM TgApplication a WHERE a.rating IS NOT NULL")
    Double findAverageRating();

    @Query("SELECT a.jobTitle, COUNT(a) FROM TgApplication a GROUP BY a.jobTitle ORDER BY COUNT(a) DESC")
    List<Object[]> findTopPositionsByApplicationCount();

    @Query("SELECT a.status, COUNT(a) FROM TgApplication a GROUP BY a.status")
    List<Object[]> findApplicationCountByStatus();

    @Query("SELECT DATE(a.submittedAt), COUNT(a) FROM TgApplication a WHERE a.submittedAt >= :fromDate GROUP BY DATE(a.submittedAt) ORDER BY DATE(a.submittedAt)")
    List<Object[]> findApplicationCountByDate(@Param("fromDate") LocalDateTime fromDate);

    // Advanced search queries
    @Query("SELECT a FROM TgApplication a WHERE " +
           "(:keyword IS NULL OR LOWER(a.applicant.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.applicant.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:jobTitle IS NULL OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :jobTitle, '%'))) AND " +
           "(:fromDate IS NULL OR a.submittedAt >= :fromDate) AND " +
           "(:toDate IS NULL OR a.submittedAt <= :toDate)")
    List<Application> findBySearchCriteria(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("jobTitle") String jobTitle,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    // Applications requiring action (submitted or in screening)
    @Query("SELECT a FROM TgApplication a WHERE a.status IN ('SUBMITTED', 'SCREENING') ORDER BY a.submittedAt ASC")
    List<Application> findApplicationsRequiringAction();

    // Recent applications
    @Query("SELECT a FROM TgApplication a WHERE a.submittedAt >= :date ORDER BY a.submittedAt DESC")
    List<Application> findRecentApplications(@Param("date") LocalDateTime date);

    // Applications by rating range
    @Query("SELECT a FROM TgApplication a WHERE a.rating IS NOT NULL AND a.rating >= :minRating ORDER BY a.rating DESC")
    List<Application> findHighRatedApplications(@Param("minRating") Integer minRating);

    // Analytics queries for performance dashboard
    @Query("SELECT a.id, a.submittedAt, a.updatedAt, a.jobTitle FROM TgApplication a WHERE a.status = 'HIRED'")
    List<Object[]> findHiredApplicationsWithDates();

    @Query("SELECT a.applicant.source, a.status FROM TgApplication a WHERE a.applicant.source IS NOT NULL")
    List<Object[]> findApplicationsBySource();

    @Query("SELECT a.jobTitle, COUNT(a) FROM TgApplication a WHERE a.status = 'HIRED' GROUP BY a.jobTitle")
    List<Object[]> findHiresByDepartment();

    @Query("SELECT YEAR(a.submittedAt), MONTH(a.submittedAt), " +
           "SUM(CASE WHEN a.status = 'HIRED' THEN 1 ELSE 0 END), COUNT(a) " +
           "FROM TgApplication a GROUP BY YEAR(a.submittedAt), MONTH(a.submittedAt) " +
           "ORDER BY YEAR(a.submittedAt), MONTH(a.submittedAt)")
    List<Object[]> findMonthlyHiringTrends();

    @Query("SELECT a.jobTitle, COUNT(a) FROM TgApplication a GROUP BY a.jobTitle")
    List<Object[]> findApplicationsByPositionType();

    @Query("SELECT MONTH(a.submittedAt), SUM(CASE WHEN a.status = 'HIRED' THEN 1 ELSE 0 END) " +
           "FROM TgApplication a GROUP BY MONTH(a.submittedAt)")
    List<Object[]> findSeasonalHiringTrends();
}
