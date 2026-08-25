package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.PipelineTransition;
import com.arthmatic.shumelahire.entity.TransitionType;
import com.arthmatic.shumelahire.repository.PipelineTransitionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PipelineTransitionItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoPipelineTransitionRepository extends DynamoRepository<PipelineTransitionItem, PipelineTransition>
        implements PipelineTransitionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoPipelineTransitionRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PipelineTransitionItem.class);
    }

    @Override
    protected String entityType() {
        return "PIPELINE_TRANS";
    }

    // ── Basic queries ────────────────────────────────────────────────────────

    @Override
    public List<PipelineTransition> findByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "PTRANS_APP#" + applicationId);
    }

    @Override
    public List<PipelineTransition> findByApplicationIdOrderByCreatedAtDesc(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .sorted(Comparator.comparing(PipelineTransition::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findByToStage(PipelineStage toStage) {
        return queryGsiAll("GSI1", "PTRANS_TO_STAGE#" + toStage.name());
    }

    @Override
    public List<PipelineTransition> findByFromStage(PipelineStage fromStage) {
        return findAll().stream()
                .filter(t -> fromStage.equals(t.getFromStage()))
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findByTransitionType(TransitionType transitionType) {
        return findAll().stream()
                .filter(t -> transitionType.equals(t.getTransitionType()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PipelineTransition> findLatestTransitionByApplicationId(String applicationId) {
        return findByApplicationIdOrderByCreatedAtDesc(applicationId).stream().findFirst();
    }

    @Override
    public List<PipelineTransition> findTransitionTimelineByApplicationId(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .sorted(Comparator.comparing(PipelineTransition::getEffectiveAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findByTriggeredByInterviewId(Long interviewId) {
        return findAll().stream()
                .filter(t -> interviewId.equals(t.getTriggeredByInterviewId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findByTriggeredByAssessmentId(Long assessmentId) {
        return findAll().stream()
                .filter(t -> assessmentId.equals(t.getTriggeredByAssessmentId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findRecentActivity(LocalDateTime since, int limit) {
        String gsi6pk = "PTRANS_CREATED#" + currentTenantId();
        String skStart = "PIPELINE_TRANS#" + since.format(ISO_FMT);
        String skEnd = "PIPELINE_TRANS#" + LocalDateTime.now().plusDays(1).format(ISO_FMT);
        return queryGsiRange("GSI6", gsi6pk, skStart, skEnd, null, limit).content();
    }

    // ── Analytics methods ────────────────────────────────────────────────────
    //
    // These were a block of sixteen methods all throwing "Analytics queries will be migrated to
    // Athena". Eight of them have live callers reached from PipelineController, so every one of
    // those endpoints was a 500 rather than an unfinished feature. Those eight are implemented
    // below.
    //
    // The other seven have no caller anywhere in the codebase and are left throwing deliberately —
    // see the note on getAverageStageDurations.

    /**
     * Every transition created in the window, for the aggregates below to reduce over.
     *
     * <p>Reads GSI6, which indexes transitions by tenant and creation time, then filters in Java.
     * Whole-range rather than paged because an aggregate computed over an arbitrary first page is
     * not an aggregate — it is a sample presented as a total, which is the failure this codebase has
     * hit repeatedly. The same trade-off the rest of this repository already makes for
     * {@code findByTriggeredByInterviewId} and its neighbours.
     *
     * <p>A transition with no {@code createdAt} is excluded rather than treated as in-range: it
     * cannot be placed in the window, and counting it would silently inflate every figure here.
     */
    private List<PipelineTransition> transitionsInRange(LocalDateTime startDate, LocalDateTime endDate) {
        return queryGsiAll("GSI6", "PTRANS_CREATED#" + currentTenantId()).stream()
                .filter(t -> t.getCreatedAt() != null)
                .filter(t -> !t.getCreatedAt().isBefore(startDate) && !t.getCreatedAt().isAfter(endDate))
                .collect(Collectors.toList());
    }

    /** Counts grouped by two keys, emitted as {@code [keyA, keyB, Long count]}. */
    private static <A, B> List<Object[]> countBy(List<PipelineTransition> transitions,
                                                 java.util.function.Function<PipelineTransition, A> keyA,
                                                 java.util.function.Function<PipelineTransition, B> keyB) {
        Map<List<Object>, Long> counts = new LinkedHashMap<>();
        for (PipelineTransition t : transitions) {
            // Arrays.asList rather than List.of: a null reason or an unset department is a real
            // state here, and the consumers render it as "No reason provided".
            counts.merge(java.util.Arrays.asList(keyA.apply(t), keyB.apply(t)), 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .map(e -> new Object[] { e.getKey().get(0), e.getKey().get(1), e.getValue() })
                .collect(Collectors.toList());
    }

    /**
     * <b>Not implemented, and not because it is hard.</b>
     *
     * <p>This method and its six unimplemented siblings have no caller anywhere in the codebase.
     * They return {@code List<Object[]>}, a shape inherited from JPA projections that carries no
     * column names, so implementing one means inventing a column order that nothing validates — and
     * the next person to add a caller would have to guess whether that order was deliberate. A
     * throw that names the problem is worth more than an unverified implementation.
     *
     * <p>Three of them are also superseded: stage durations, conversion rates and funnel data are
     * all computed, with tests, by {@link com.arthmatic.shumelahire.dto.PipelineAnalyticsResponse}
     * from {@link #findTransitionsByDateRange}. Build there rather than here.
     */
    @Override
    public List<Object[]> getAverageStageDurations(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "getAverageStageDurations has no caller; use PipelineAnalyticsResponse over "
                        + "findTransitionsByDateRange, which computes stage durations with tests");
    }

    @Override
    public List<Object[]> getStageConversionRates(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "getStageConversionRates has no caller; use PipelineAnalyticsResponse over "
                        + "findTransitionsByDateRange, which computes conversion rates with tests");
    }

    @Override
    public List<Object[]> getPipelineFunnelData(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "getPipelineFunnelData has no caller; use PipelineAnalyticsResponse over "
                        + "findTransitionsByDateRange, which computes the funnel with tests");
    }

    @Override
    public List<Object[]> getTransitionVelocity(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "getTransitionVelocity has no caller and no defined column order");
    }

    @Override
    public List<Object[]> getAutomationStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "getAutomationStatistics has no caller and no defined column order");
    }

    /**
     * Rejections in the window, as {@code [PipelineStage fromStage, String reason, Long count]}.
     *
     * <p>Grouped on {@code fromStage} — the stage the candidate was <em>at</em> when rejected —
     * rather than {@code toStage}, which is the terminal rejected stage and identical on every row.
     * Grouping by it would produce one bucket and answer nothing.
     *
     * <p>A null reason is kept rather than dropped: "rejected, no reason recorded" is the finding
     * most worth surfacing, and {@code PipelineService} already renders it as "No reason provided".
     */
    @Override
    public List<Object[]> getRejectionAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        return countBy(
                transitionsInRange(startDate, endDate).stream()
                        .filter(t -> t.getTransitionType() == TransitionType.REJECTION)
                        .collect(Collectors.toList()),
                PipelineTransition::getFromStage,
                PipelineTransition::getReason);
    }

    /** Withdrawals in the window, as {@code [PipelineStage fromStage, String reason, Long count]}. */
    @Override
    public List<Object[]> getWithdrawalAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        return countBy(
                transitionsInRange(startDate, endDate).stream()
                        .filter(t -> t.getTransitionType() == TransitionType.WITHDRAWAL)
                        .collect(Collectors.toList()),
                PipelineTransition::getFromStage,
                PipelineTransition::getReason);
    }

    /**
     * Who moved candidates, as {@code [String createdBy, Long count]}.
     *
     * <p>{@code createdBy} is a {@code String} on the entity — every id in this codebase is. Its
     * consumer in {@code PipelineService} was casting it to {@code Long}, so returning the real
     * value here would have swapped one runtime failure for another; that cast is corrected in the
     * same change.
     *
     * <p>Transitions with no recorded actor are excluded. An unattributed movement is a data gap,
     * not a person, and bucketing it under null would put a phantom recruiter on the leaderboard.
     */
    @Override
    public List<Object[]> getUserActivityStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Long> byUser = new LinkedHashMap<>();
        transitionsInRange(startDate, endDate).stream()
                .map(PipelineTransition::getCreatedBy)
                .filter(user -> user != null && !user.isBlank())
                .forEach(user -> byUser.merge(user, 1L, Long::sum));

        return byUser.entrySet().stream()
                .map(e -> new Object[] { e.getKey(), e.getValue() })
                .collect(Collectors.toList());
    }

    /**
     * Transitions created in a window, newest-indexed first.
     *
     * <p><b>Implemented rather than thrown, because every analytics figure on the pipeline board
     * and the recruiter dashboard reduces to this one read.</b> GSI6 already indexes transitions by
     * tenant and creation time — {@link #findRecentActivity} has been using it all along — so this
     * is the same query with both ends of the range supplied by the caller instead of one end being
     * "now".
     *
     * <p>The aggregates themselves are computed in Java by
     * {@link com.arthmatic.shumelahire.dto.PipelineAnalyticsResponse}, which keeps them testable
     * without a DynamoDB client and identical whatever the store underneath turns out to be. The
     * sibling methods below still throw: they return {@code List<Object[]>}, a shape inherited from
     * JPA projections that nothing should be built on, and every one of them is expressible through
     * this call instead.
     */
    @Override
    public List<PipelineTransition> findTransitionsByDateRange(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        String gsi6pk = "PTRANS_CREATED#" + currentTenantId();
        String skStart = "PIPELINE_TRANS#" + startDate.format(ISO_FMT);
        String skEnd = "PIPELINE_TRANS#" + endDate.format(ISO_FMT);
        return queryGsiRange("GSI6", gsi6pk, skStart, skEnd, null, limit).content();
    }

    /**
     * Applications sitting in a stage since before {@code cutoffDate}.
     *
     * <p>"Stuck" is a property of an application's <em>latest</em> transition, not of any transition
     * into the stage. Matching every transition into the stage would report a candidate who passed
     * through Screening in March and has since been hired as stuck in Screening — the figure would
     * grow forever and never fall.
     *
     * <p>So: take each application's most recent transition, keep the ones whose {@code toStage} is
     * the stage asked about, and keep those that happened before the cutoff.
     */
    @Override
    public List<Application> findApplicationsStuckInStage(PipelineStage stage, LocalDateTime cutoffDate) {
        Map<String, PipelineTransition> latestByApplication = new LinkedHashMap<>();
        for (PipelineTransition t : queryGsiAll("GSI6", "PTRANS_CREATED#" + currentTenantId())) {
            if (t.getApplication() == null || t.getApplication().getId() == null
                    || t.getCreatedAt() == null) {
                continue;
            }
            latestByApplication.merge(t.getApplication().getId(), t,
                    (existing, candidate) -> candidate.getCreatedAt().isAfter(existing.getCreatedAt())
                            ? candidate : existing);
        }

        return latestByApplication.values().stream()
                .filter(t -> t.getToStage() == stage)
                .filter(t -> t.getCreatedAt().isBefore(cutoffDate))
                .map(PipelineTransition::getApplication)
                .collect(Collectors.toList());
    }

    /**
     * Stages people wait in too long, as {@code [PipelineStage stage, Double avgHours, Long count]}.
     *
     * <p>Reads {@code durationInPreviousStageHours}, which is recorded on the transition <em>out</em>
     * of a stage, so the duration belongs to {@code fromStage}. Attributing it to {@code toStage}
     * would blame each stage for the delay in the one before it.
     *
     * <p>Transitions with no recorded duration are excluded from both the average and the count, so
     * an unmeasured move cannot drag an average towards zero and make a slow stage look healthy.
     * A stage is only reported when its mean exceeds the threshold — that is the whole question
     * being asked.
     */
    @Override
    public List<Object[]> identifyBottlenecks(Long thresholdHours, LocalDateTime startDate, LocalDateTime endDate) {
        Map<PipelineStage, List<Long>> durations = new LinkedHashMap<>();
        transitionsInRange(startDate, endDate).stream()
                .filter(t -> t.getFromStage() != null && t.getDurationInPreviousStageHours() != null)
                .forEach(t -> durations
                        .computeIfAbsent(t.getFromStage(), k -> new java.util.ArrayList<>())
                        .add(t.getDurationInPreviousStageHours()));

        long threshold = thresholdHours == null ? 0L : thresholdHours;
        return durations.entrySet().stream()
                .map(e -> {
                    double average = e.getValue().stream().mapToLong(Long::longValue).average().orElse(0d);
                    return new Object[] { e.getKey(), average, (long) e.getValue().size() };
                })
                .filter(row -> (Double) row[1] > threshold)
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findRegressions(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "findRegressions has no caller; PipelineAnalyticsResponse identifies regressions "
                        + "from findTransitionsByDateRange, with the stage-ordering rules tested");
    }

    @Override
    public List<Object[]> getSuccessRatesByStage(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException(
                "getSuccessRatesByStage has no caller and no defined column order");
    }

    /**
     * One vacancy's pipeline, as {@code [String jobPostingId, PipelineStage toStage, Long count]}.
     *
     * <p>Grouped on {@code toStage}: the question is how many candidates reached each stage for this
     * vacancy. The first column repeats the id the caller passed, because the consumer reads
     * {@code row[1]} and {@code row[2]} and the projection shape has three columns.
     */
    @Override
    public List<Object[]> getJobPostingPipelineStats(String jobPostingId, LocalDateTime startDate, LocalDateTime endDate) {
        return countBy(
                transitionsInRange(startDate, endDate).stream()
                        .filter(t -> t.getApplication() != null
                                && jobPostingId != null
                                && jobPostingId.equals(t.getApplication().getJobPostingId()))
                        .collect(Collectors.toList()),
                t -> jobPostingId,
                PipelineTransition::getToStage);
    }

    /**
     * Movement per department, as {@code [String department, PipelineStage toStage, Long count]}.
     *
     * <p>Department lives on the application, copied from the job posting when it was created.
     * Applications with none are excluded rather than grouped under null — an unnamed bucket beside
     * the real departments reads as a department called "null" on the dashboard.
     */
    @Override
    public List<Object[]> getDepartmentPipelineStats(LocalDateTime startDate, LocalDateTime endDate) {
        return countBy(
                transitionsInRange(startDate, endDate).stream()
                        .filter(t -> t.getApplication() != null
                                && t.getApplication().getDepartment() != null
                                && !t.getApplication().getDepartment().isBlank())
                        .collect(Collectors.toList()),
                t -> t.getApplication().getDepartment(),
                PipelineTransition::getToStage);
    }

    /** Movements by kind, as {@code [TransitionType type, Long count]}. */
    @Override
    public List<Object[]> getTransitionTypeStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<TransitionType, Long> byType = new LinkedHashMap<>();
        transitionsInRange(startDate, endDate).stream()
                .map(PipelineTransition::getTransitionType)
                .filter(java.util.Objects::nonNull)
                .forEach(type -> byType.merge(type, 1L, Long::sum));

        return byType.entrySet().stream()
                .map(e -> new Object[] { e.getKey(), e.getValue() })
                .collect(Collectors.toList());
    }

    // ── Conversion ───────────────────────────────────────────────────────────

    @Override
    protected PipelineTransition toEntity(PipelineTransitionItem item) {
        var entity = new PipelineTransition();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        if (item.getFromStage() != null) {
            entity.setFromStage(PipelineStage.valueOf(item.getFromStage()));
        }
        if (item.getToStage() != null) {
            entity.setToStage(PipelineStage.valueOf(item.getToStage()));
        }
        if (item.getTransitionType() != null) {
            entity.setTransitionType(TransitionType.valueOf(item.getTransitionType()));
        }
        entity.setReason(item.getReason());
        entity.setNotes(item.getNotes());
        entity.setAutomated(item.getAutomated());
        if (item.getTriggeredByInterviewId() != null) {
            entity.setTriggeredByInterviewId(item.getTriggeredByInterviewId());
        }
        if (item.getTriggeredByAssessmentId() != null) {
            entity.setTriggeredByAssessmentId(item.getTriggeredByAssessmentId());
        }
        entity.setMetadata(item.getMetadata());
        if (item.getCreatedBy() != null) {
            entity.setCreatedBy(item.getCreatedBy());
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(TimestampUtils.parseTimestamp(item.getCreatedAt()));
        }
        if (item.getEffectiveAt() != null) {
            entity.setEffectiveAt(TimestampUtils.parseTimestamp(item.getEffectiveAt()));
        }
        entity.setDurationInPreviousStageHours(item.getDurationInPreviousStageHours());
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected PipelineTransitionItem toItem(PipelineTransition entity) {
        var item = new PipelineTransitionItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        String applicationId = entity.getApplication() != null ?
                entity.getApplication().getId() : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("PIPELINE_TRANS#" + id);

        // GSI1: toStage index
        String toStageStr = entity.getToStage() != null ? entity.getToStage().name() : "";
        item.setGsi1pk("PTRANS_TO_STAGE#" + toStageStr);
        item.setGsi1sk("PIPELINE_TRANS#" + createdAtStr);

        // GSI2: application index
        item.setGsi2pk("PTRANS_APP#" + applicationId);
        item.setGsi2sk("PIPELINE_TRANS#" + createdAtStr);

        // GSI6: date range
        item.setGsi6pk("PTRANS_CREATED#" + tenantId);
        item.setGsi6sk("PIPELINE_TRANS#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setApplicationId(applicationId);
        if (entity.getFromStage() != null) {
            item.setFromStage(entity.getFromStage().name());
        }
        item.setToStage(toStageStr);
        if (entity.getTransitionType() != null) {
            item.setTransitionType(entity.getTransitionType().name());
        }
        item.setReason(entity.getReason());
        item.setNotes(entity.getNotes());
        item.setAutomated(entity.getAutomated());
        if (entity.getTriggeredByInterviewId() != null) {
            item.setTriggeredByInterviewId(entity.getTriggeredByInterviewId());
        }
        if (entity.getTriggeredByAssessmentId() != null) {
            item.setTriggeredByAssessmentId(entity.getTriggeredByAssessmentId());
        }
        item.setMetadata(entity.getMetadata());
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy());
        }
        item.setCreatedAt(createdAtStr);
        if (entity.getEffectiveAt() != null) {
            item.setEffectiveAt(entity.getEffectiveAt().format(ISO_FMT));
        }
        item.setDurationInPreviousStageHours(entity.getDurationInPreviousStageHours());

        return item;
    }
}
