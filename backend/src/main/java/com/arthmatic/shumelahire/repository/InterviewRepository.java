package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository("shumelahireInterviewRepository")
public interface InterviewRepository extends JpaRepository<Interview, Long>, JpaSpecificationExecutor<Interview> {

    List<Interview> findByApplication(Application application);

    List<Interview> findByStatus(String status);

    List<Interview> findByStatusIn(List<String> statuses);

    List<Interview> findByInterviewType(String interviewType);

    List<Interview> findByInterviewerEmail(String interviewerEmail);

    List<Interview> findByScheduledDateBetween(LocalDateTime start, LocalDateTime end);

    List<Interview> findByScheduledDateAfter(LocalDateTime date);

    List<Interview> findByScheduledDateBefore(LocalDateTime date);

    // Find upcoming interviews
    @Query("SELECT i FROM TgInterview i WHERE i.scheduledDate > :now AND i.status IN ('SCHEDULED', 'CONFIRMED') ORDER BY i.scheduledDate ASC")
    List<Interview> findUpcomingInterviews(@Param("now") LocalDateTime now);

    // Find interviews for today
    @Query("SELECT i FROM TgInterview i WHERE DATE(i.scheduledDate) = DATE(:date) ORDER BY i.scheduledDate ASC")
    List<Interview> findInterviewsForDate(@Param("date") LocalDateTime date);

    // Find interviews needing reminders
    @Query("SELECT i FROM TgInterview i WHERE i.scheduledDate > :now AND i.scheduledDate <= :reminderTime " +
           "AND i.reminderSent = false AND i.status IN ('SCHEDULED', 'CONFIRMED')")
    List<Interview> findInterviewsNeedingReminders(@Param("now") LocalDateTime now, 
                                                   @Param("reminderTime") LocalDateTime reminderTime);

    // Find overdue interviews (should be completed but status is still SCHEDULED/CONFIRMED)
    @Query("SELECT i FROM TgInterview i WHERE i.scheduledDate < :cutoffTime AND i.status IN ('SCHEDULED', 'CONFIRMED')")
    List<Interview> findOverdueInterviews(@Param("cutoffTime") LocalDateTime cutoffTime);

    // Statistics queries
    long countByStatus(String status);

    long countByScheduledDateBetween(LocalDateTime start, LocalDateTime end);

    long countByInterviewType(String interviewType);

    @Query("SELECT AVG(i.rating) FROM TgInterview i WHERE i.rating IS NOT NULL")
    Double findAverageRating();

    @Query("SELECT AVG(i.technicalScore) FROM TgInterview i WHERE i.technicalScore IS NOT NULL")
    Double findAverageTechnicalScore();

    @Query("SELECT AVG(i.communicationScore) FROM TgInterview i WHERE i.communicationScore IS NOT NULL")
    Double findAverageCommunicationScore();

    @Query("SELECT AVG(i.culturalFitScore) FROM TgInterview i WHERE i.culturalFitScore IS NOT NULL")
    Double findAverageCulturalFitScore();

    // Grouped statistics
    @Query("SELECT i.status, COUNT(i) FROM TgInterview i GROUP BY i.status")
    List<Object[]> findInterviewCountByStatus();

    @Query("SELECT i.interviewType, COUNT(i) FROM TgInterview i GROUP BY i.interviewType ORDER BY COUNT(i) DESC")
    List<Object[]> findInterviewCountByType();

    @Query("SELECT i.recommendation, COUNT(i) FROM TgInterview i WHERE i.recommendation != 'PENDING' GROUP BY i.recommendation")
    List<Object[]> findInterviewCountByRecommendation();

    @Query("SELECT DATE(i.scheduledDate), COUNT(i) FROM TgInterview i WHERE i.scheduledDate >= :fromDate " +
           "GROUP BY DATE(i.scheduledDate) ORDER BY DATE(i.scheduledDate)")
    List<Object[]> findInterviewCountByDate(@Param("fromDate") LocalDateTime fromDate);

    // Interviewer performance
    @Query("SELECT i.interviewerEmail, COUNT(i), AVG(i.rating) FROM TgInterview i WHERE i.rating IS NOT NULL " +
           "GROUP BY i.interviewerEmail ORDER BY COUNT(i) DESC")
    List<Object[]> findInterviewerPerformance();

    // Find interviews by multiple criteria
    @Query("SELECT i FROM TgInterview i WHERE " +
           "(:interviewerEmail IS NULL OR i.interviewerEmail = :interviewerEmail) AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:interviewType IS NULL OR i.interviewType = :interviewType) AND " +
           "(:fromDate IS NULL OR i.scheduledDate >= :fromDate) AND " +
           "(:toDate IS NULL OR i.scheduledDate <= :toDate) AND " +
           "(:recommendation IS NULL OR i.recommendation = :recommendation)")
    List<Interview> findByCriteria(
            @Param("interviewerEmail") String interviewerEmail,
            @Param("status") String status,
            @Param("interviewType") String interviewType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("recommendation") String recommendation
    );

    // Find high-performing interviews
    @Query("SELECT i FROM TgInterview i WHERE i.rating >= :minRating ORDER BY i.rating DESC, i.scheduledDate DESC")
    List<Interview> findHighRatedInterviews(@Param("minRating") Integer minRating);

    // Find interviews with detailed feedback
    @Query("SELECT i FROM TgInterview i WHERE i.feedback IS NOT NULL AND LENGTH(TRIM(i.feedback)) > 0 " +
           "ORDER BY i.scheduledDate DESC")
    List<Interview> findInterviewsWithFeedback();

    // Calendar view - find interviews in date range
    @Query("SELECT i FROM TgInterview i WHERE i.scheduledDate BETWEEN :startDate AND :endDate " +
           "ORDER BY i.scheduledDate ASC")
    List<Interview> findInterviewsInDateRange(@Param("startDate") LocalDateTime startDate, 
                                              @Param("endDate") LocalDateTime endDate);

    // Find completed interviews without feedback
    @Query("SELECT i FROM TgInterview i WHERE i.status = 'COMPLETED' AND " +
           "(i.feedback IS NULL OR LENGTH(TRIM(i.feedback)) = 0)")
    List<Interview> findCompletedInterviewsWithoutFeedback();

    // Additional analytics methods for performance dashboard
    long countByInterviewTypeAndStatus(String interviewType, String status);

    @Query("SELECT i.interviewerName, COUNT(i), AVG(i.rating), AVG(i.technicalScore), " +
           "AVG(i.communicationScore), AVG(i.culturalFitScore) FROM TgInterview i " +
           "WHERE i.rating IS NOT NULL GROUP BY i.interviewerName ORDER BY COUNT(i) DESC")
    List<Object[]> findInterviewerStats();

    @Query("SELECT AVG(i.rating) FROM TgInterview i WHERE i.rating IS NOT NULL")
    Double getAverageRating();

    @Query("SELECT AVG(i.technicalScore) FROM TgInterview i WHERE i.technicalScore IS NOT NULL")
    Double getAverageTechnicalScore();

    @Query("SELECT AVG(i.communicationScore) FROM TgInterview i WHERE i.communicationScore IS NOT NULL")
    Double getAverageCommunicationScore();

    @Query("SELECT AVG(i.culturalFitScore) FROM TgInterview i WHERE i.culturalFitScore IS NOT NULL")
    Double getAverageCulturalFitScore();

    @Query("SELECT AVG(i.durationMinutes) FROM TgInterview i WHERE i.durationMinutes IS NOT NULL")
    Double getAverageDurationMinutes();
}
