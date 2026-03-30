package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.PipelineTransition;
import com.arthmatic.shumelahire.entity.TransitionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the PipelineTransition entity.
 * <p>
 * PipelineTransition extends {@link com.arthmatic.shumelahire.entity.TenantAwareEntity}
 * and tracks all stage-to-stage movements in the recruitment pipeline.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaPipelineTransitionDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoPipelineTransitionRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 * Application references use {@code String applicationId} in this interface.
 * <p>
 * Analytics methods are included in this interface for JPA compatibility but will be
 * migrated to Athena in Phase 4. The DynamoDB implementation throws
 * {@link UnsupportedOperationException} for these methods.
 */
public interface PipelineTransitionDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<PipelineTransition> findById(String id);

    PipelineTransition save(PipelineTransition entity);

    List<PipelineTransition> saveAll(List<PipelineTransition> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Basic queries --------------------------------------------------------

    /** Find all transitions for an application. */
    List<PipelineTransition> findByApplicationId(String applicationId);

    /** Find all transitions for an application, ordered by createdAt descending. */
    List<PipelineTransition> findByApplicationIdOrderByCreatedAtDesc(String applicationId);

    /** Find all transitions that moved TO a given stage. */
    List<PipelineTransition> findByToStage(PipelineStage toStage);

    /** Find all transitions that moved FROM a given stage. */
    List<PipelineTransition> findByFromStage(PipelineStage fromStage);

    /** Find all transitions of a given type. */
    List<PipelineTransition> findByTransitionType(TransitionType transitionType);

    /** Find the most recent transition for an application. */
    Optional<PipelineTransition> findLatestTransitionByApplicationId(String applicationId);

    /** Find the full transition timeline for an application, ordered by effectiveAt ascending. */
    List<PipelineTransition> findTransitionTimelineByApplicationId(String applicationId);

    /** Find transitions triggered by a specific interview. */
    List<PipelineTransition> findByTriggeredByInterviewId(Long interviewId);

    /** Find transitions triggered by a specific assessment. */
    List<PipelineTransition> findByTriggeredByAssessmentId(Long assessmentId);

    /** Find recent transition activity since a given date, limited to the given count. */
    List<PipelineTransition> findRecentActivity(LocalDateTime since, int limit);

    // -- Analytics methods (Phase 4: Athena migration) ------------------------
    // These methods are supported in JPA but throw UnsupportedOperationException
    // in the DynamoDB implementation. They will be migrated to Athena queries.

    /** Average time spent in each stage. */
    List<Object[]> getAverageStageDurations(LocalDateTime startDate, LocalDateTime endDate);

    /** Conversion rates between stages. */
    List<Object[]> getStageConversionRates(LocalDateTime startDate, LocalDateTime endDate);

    /** Pipeline funnel data showing distinct application counts per stage. */
    List<Object[]> getPipelineFunnelData(LocalDateTime startDate, LocalDateTime endDate);

    /** Number of transitions per day. */
    List<Object[]> getTransitionVelocity(LocalDateTime startDate, LocalDateTime endDate);

    /** Automated vs manual transition statistics. */
    List<Object[]> getAutomationStatistics(LocalDateTime startDate, LocalDateTime endDate);

    /** Rejection analysis grouped by stage and reason. */
    List<Object[]> getRejectionAnalysis(LocalDateTime startDate, LocalDateTime endDate);

    /** Withdrawal analysis grouped by stage and reason. */
    List<Object[]> getWithdrawalAnalysis(LocalDateTime startDate, LocalDateTime endDate);

    /** User activity statistics showing transition counts per user. */
    List<Object[]> getUserActivityStatistics(LocalDateTime startDate, LocalDateTime endDate);

    /** Find transitions within a date range. */
    List<PipelineTransition> findTransitionsByDateRange(LocalDateTime startDate, LocalDateTime endDate, int limit);

    /** Find applications stuck in a stage since before the cutoff date. */
    List<Application> findApplicationsStuckInStage(PipelineStage stage, LocalDateTime cutoffDate);

    /** Identify pipeline bottlenecks where average duration exceeds the threshold. */
    List<Object[]> identifyBottlenecks(Long thresholdHours, LocalDateTime startDate, LocalDateTime endDate);

    /** Find regression transitions within a date range. */
    List<PipelineTransition> findRegressions(LocalDateTime startDate, LocalDateTime endDate);

    /** Success rates by stage. */
    List<Object[]> getSuccessRatesByStage(LocalDateTime startDate, LocalDateTime endDate);

    /** Pipeline statistics for a specific job posting. */
    List<Object[]> getJobPostingPipelineStats(Long jobPostingId, LocalDateTime startDate, LocalDateTime endDate);

    /** Pipeline statistics grouped by department. */
    List<Object[]> getDepartmentPipelineStats(LocalDateTime startDate, LocalDateTime endDate);

    /** Transition type statistics (count by type). */
    List<Object[]> getTransitionTypeStatistics(LocalDateTime startDate, LocalDateTime endDate);
}
