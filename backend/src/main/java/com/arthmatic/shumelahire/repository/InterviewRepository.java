package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.InterviewType;
import com.arthmatic.shumelahire.entity.InterviewRound;
import com.arthmatic.shumelahire.entity.InterviewRecommendation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    // Basic queries
    List<Interview> findByApplicationId(Long applicationId);
    
    List<Interview> findByInterviewerId(Long interviewerId);
    
    List<Interview> findByStatus(InterviewStatus status);
    
    List<Interview> findByType(InterviewType type);
    
    List<Interview> findByRound(InterviewRound round);

    // Date and time queries
    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE i.scheduledAt >= :startDate AND i.scheduledAt < :endDate")
    List<Interview> findByScheduledAtBetween(@Param("startDate") LocalDateTime startDate,
                                           @Param("endDate") LocalDateTime endDate);

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE i.interviewerId = :interviewerId " +
           "AND i.scheduledAt >= :startDate AND i.scheduledAt < :endDate " +
           "AND i.status IN ('SCHEDULED', 'RESCHEDULED')")
    List<Interview> findInterviewerSchedule(@Param("interviewerId") Long interviewerId,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);

    // Conflict checking (JPQL — database-portable, filtered in Java via hasConflictWith)
    @Query("SELECT i FROM Interview i WHERE i.interviewerId = :interviewerId " +
           "AND i.status IN (com.arthmatic.shumelahire.entity.InterviewStatus.SCHEDULED, com.arthmatic.shumelahire.entity.InterviewStatus.RESCHEDULED) " +
           "AND i.scheduledAt < :endTime")
    List<Interview> findPotentialInterviewerConflicts(@Param("interviewerId") Long interviewerId,
                                                     @Param("endTime") LocalDateTime endTime);

    @Query("SELECT i FROM Interview i WHERE i.meetingRoom = :meetingRoom " +
           "AND i.status IN (com.arthmatic.shumelahire.entity.InterviewStatus.SCHEDULED, com.arthmatic.shumelahire.entity.InterviewStatus.RESCHEDULED) " +
           "AND i.scheduledAt < :endTime")
    List<Interview> findPotentialMeetingRoomConflicts(@Param("meetingRoom") String meetingRoom,
                                                     @Param("endTime") LocalDateTime endTime);

    // Status-based queries
    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE i.status = 'SCHEDULED' AND i.scheduledAt <= :now")
    List<Interview> findOverdueInterviews(@Param("now") LocalDateTime now);

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE i.status = 'SCHEDULED' " +
           "AND i.scheduledAt BETWEEN :now AND :futureTime")
    List<Interview> findUpcomingInterviews(@Param("now") LocalDateTime now,
                                         @Param("futureTime") LocalDateTime futureTime);

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE i.status = 'COMPLETED' AND i.feedback IS NULL")
    List<Interview> findInterviewsRequiringFeedback();

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "WHERE i.status = 'COMPLETED' AND i.recommendation IS NULL")
    List<Interview> findInterviewsRequiringRecommendation();

    // Search functionality — uses @EntityGraph for pagination-safe eager loading
    @EntityGraph(value = "Interview.withApplicationDetails")
    @Query(value = "SELECT i FROM Interview i " +
           "JOIN i.application a " +
           "JOIN a.applicant ap " +
           "JOIN a.jobPosting jp " +
           "WHERE (:searchTerm IS NULL OR " +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(jp.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(jp.department) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))) " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:type IS NULL OR i.type = :type) " +
           "AND (:round IS NULL OR i.round = :round) " +
           "AND (:interviewerId IS NULL OR i.interviewerId = :interviewerId) " +
           "AND (CAST(:startDate AS LocalDateTime) IS NULL OR i.scheduledAt >= :startDate) " +
           "AND (CAST(:endDate AS LocalDateTime) IS NULL OR i.scheduledAt <= :endDate)",
           countQuery = "SELECT COUNT(i) FROM Interview i " +
           "JOIN i.application a " +
           "JOIN a.applicant ap " +
           "JOIN a.jobPosting jp " +
           "WHERE (:searchTerm IS NULL OR " +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(jp.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(jp.department) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))) " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:type IS NULL OR i.type = :type) " +
           "AND (:round IS NULL OR i.round = :round) " +
           "AND (:interviewerId IS NULL OR i.interviewerId = :interviewerId) " +
           "AND (CAST(:startDate AS LocalDateTime) IS NULL OR i.scheduledAt >= :startDate) " +
           "AND (CAST(:endDate AS LocalDateTime) IS NULL OR i.scheduledAt <= :endDate)")
    Page<Interview> searchInterviews(@Param("searchTerm") String searchTerm,
                                   @Param("status") InterviewStatus status,
                                   @Param("type") InterviewType type,
                                   @Param("round") InterviewRound round,
                                   @Param("interviewerId") Long interviewerId,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate,
                                   Pageable pageable);

    // Calendar queries
    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE i.interviewerId = :interviewerId " +
           "AND YEAR(i.scheduledAt) = :year AND MONTH(i.scheduledAt) = :month")
    List<Interview> findByInterviewerAndMonth(@Param("interviewerId") Long interviewerId,
                                            @Param("year") int year,
                                            @Param("month") int month);

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE DATE(i.scheduledAt) = DATE(:date)")
    List<Interview> findByDate(@Param("date") LocalDateTime date);

    // Analytics queries
    @Query("SELECT COUNT(i) FROM Interview i WHERE i.interviewerId = :interviewerId " +
           "AND i.scheduledAt >= :startDate AND i.scheduledAt < :endDate")
    Long countInterviewsByInterviewerAndDateRange(@Param("interviewerId") Long interviewerId,
                                                @Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate);

    @Query("SELECT i.status, COUNT(i) FROM Interview i " +
           "WHERE i.scheduledAt >= :startDate AND i.scheduledAt < :endDate " +
           "GROUP BY i.status")
    List<Object[]> getInterviewStatusStatistics(@Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT i.round, COUNT(i) FROM Interview i " +
           "WHERE i.scheduledAt >= :startDate AND i.scheduledAt < :endDate " +
           "GROUP BY i.round")
    List<Object[]> getInterviewRoundStatistics(@Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(i.rating) FROM Interview i WHERE i.rating IS NOT NULL " +
           "AND i.scheduledAt >= :startDate AND i.scheduledAt < :endDate")
    Optional<Double> getAverageInterviewRating(@Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    // Recommendation-based queries
    List<Interview> findByRecommendation(InterviewRecommendation recommendation);

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "WHERE i.status = 'COMPLETED' " +
           "AND i.recommendation IN ('HIRE', 'CONSIDER')")
    List<Interview> findPositiveRecommendations();

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "WHERE i.status = 'COMPLETED' " +
           "AND i.recommendation = 'ANOTHER_ROUND'")
    List<Interview> findRequiringAdditionalRounds();

    // Reminder and notification queries
    @Query("SELECT i FROM Interview i WHERE i.status = 'SCHEDULED' " +
           "AND i.scheduledAt BETWEEN :now AND :reminderTime " +
           "AND i.reminderSentAt IS NULL")
    List<Interview> findInterviewsNeedingReminders(@Param("now") LocalDateTime now,
                                                 @Param("reminderTime") LocalDateTime reminderTime);

    @Query("SELECT i FROM Interview i WHERE i.status = 'COMPLETED' " +
           "AND i.feedbackRequestedAt IS NULL " +
           "AND i.completedAt <= :cutoffTime")
    List<Interview> findInterviewsNeedingFeedbackRequest(@Param("cutoffTime") LocalDateTime cutoffTime);

    // Application-specific queries
    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE a.id = :applicationId " +
           "ORDER BY i.scheduledAt DESC")
    List<Interview> findByApplicationIdOrderByScheduledAtDesc(@Param("applicationId") Long applicationId);

    @Query("SELECT i FROM Interview i " +
           "JOIN FETCH i.application a " +
           "JOIN FETCH a.applicant ap " +
           "WHERE a.id = :applicationId " +
           "AND i.status = 'COMPLETED' AND i.recommendation = 'HIRE'")
    List<Interview> findHireRecommendationsByApplication(@Param("applicationId") Long applicationId);

    // Reschedule tracking
    @Query("SELECT i FROM Interview i WHERE i.rescheduleCount >= :maxReschedules")
    List<Interview> findExcessivelyRescheduledInterviews(@Param("maxReschedules") int maxReschedules);

    @Query("SELECT AVG(i.rescheduleCount) FROM Interview i WHERE i.rescheduleCount > 0")
    Optional<Double> getAverageRescheduleCount();
    
    // Analytics methods
    Long countByScheduledAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    Long countByStatusAndScheduledAtBetween(InterviewStatus status, LocalDateTime startDate, LocalDateTime endDate);
    
    List<Interview> findByStatusAndScheduledAtBetween(InterviewStatus status, LocalDateTime startDate, LocalDateTime endDate);
}