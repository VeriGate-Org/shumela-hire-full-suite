package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.InterviewType;
import com.arthmatic.shumelahire.entity.InterviewRound;
import com.arthmatic.shumelahire.entity.InterviewRecommendation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Storage-agnostic repository interface for the Interview entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaInterviewDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoInterviewRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface InterviewDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Interview> findById(String id);

    Interview save(Interview entity);

    List<Interview> saveAll(List<Interview> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find an interview by ID with eagerly loaded application, applicant, jobPosting, feedbacks. */
    Optional<Interview> findByIdWithDetails(String id);

    /** All interviews for a given application. */
    List<Interview> findByApplicationId(String applicationId);

    /** All interviews assigned to a given interviewer. */
    List<Interview> findByInterviewerId(String interviewerId);

    /** All interviews with a given status. */
    List<Interview> findByStatus(InterviewStatus status);

    /** All interviews of a given type. */
    List<Interview> findByType(InterviewType type);

    /** All interviews of a given round. */
    List<Interview> findByRound(InterviewRound round);

    /** Interviews scheduled between two date-times. */
    List<Interview> findByScheduledAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /** An interviewer's schedule within a date range (SCHEDULED/RESCHEDULED only). */
    List<Interview> findInterviewerSchedule(String interviewerId,
                                            LocalDateTime startDate,
                                            LocalDateTime endDate);

    /** Overdue interviews (SCHEDULED but scheduledAt is past). */
    List<Interview> findOverdueInterviews(LocalDateTime now);

    /** Upcoming interviews (SCHEDULED within the given window). */
    List<Interview> findUpcomingInterviews(LocalDateTime now, LocalDateTime futureTime);

    /** Interviews by application, ordered by scheduledAt descending. */
    List<Interview> findByApplicationIdOrderByScheduledAtDesc(String applicationId);

    /** Interviews needing reminders (SCHEDULED, within window, no reminder sent). */
    List<Interview> findInterviewsNeedingReminders(LocalDateTime now, LocalDateTime reminderTime);

    /** Interviews requiring feedback (COMPLETED with no feedback). */
    List<Interview> findInterviewsRequiringFeedback();

    /** Interviews with a given recommendation. */
    List<Interview> findByRecommendation(InterviewRecommendation recommendation);

    /** Interviews for an application with HIRE recommendation. */
    List<Interview> findHireRecommendationsByApplication(String applicationId);

    /** Count interviews by interviewer within a date range. */
    long countInterviewsByInterviewerAndDateRange(String interviewerId,
                                                  LocalDateTime startDate,
                                                  LocalDateTime endDate);

    /** Count interviews scheduled within a date range. */
    long countByScheduledAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // ── Additional queries needed by services ────────────────────────────────

    /** Get all interviews for the current tenant. */
    List<Interview> findAll();

    /** Get total count of interviews for the current tenant. */
    long count();

    /** Search interviews with filters (page-based, for JPA compatibility). */
    Page<Interview> searchInterviews(String searchTerm, InterviewStatus status,
                                     InterviewType type, InterviewRound round,
                                     Long interviewerId, LocalDateTime startDate,
                                     LocalDateTime endDate, Pageable pageable);

    /** Find potential interviewer scheduling conflicts. */
    List<Interview> findPotentialInterviewerConflicts(String interviewerId, LocalDateTime endTime);

    /** Find potential meeting room scheduling conflicts. */
    List<Interview> findPotentialMeetingRoomConflicts(String meetingRoom, LocalDateTime endTime);

    /** Get interview count grouped by status within a date range. */
    List<Object[]> getInterviewStatusStatistics(LocalDateTime startDate, LocalDateTime endDate);

    /** Get interview count grouped by round within a date range. */
    List<Object[]> getInterviewRoundStatistics(LocalDateTime startDate, LocalDateTime endDate);

    /** Get average interview rating within a date range. */
    Optional<Double> getAverageInterviewRating(LocalDateTime startDate, LocalDateTime endDate);

    /** Find interviews by date (all interviews on a given day). */
    List<Interview> findByDate(LocalDateTime date);
}
