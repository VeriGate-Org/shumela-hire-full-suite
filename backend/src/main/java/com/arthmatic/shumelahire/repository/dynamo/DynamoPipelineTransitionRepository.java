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
import java.util.List;
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

    // ── Analytics methods (Athena migration in Phase 4) ──────────────────────

    @Override
    public List<Object[]> getAverageStageDurations(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getStageConversionRates(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getPipelineFunnelData(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getTransitionVelocity(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getAutomationStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getRejectionAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getWithdrawalAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getUserActivityStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<PipelineTransition> findTransitionsByDateRange(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Application> findApplicationsStuckInStage(PipelineStage stage, LocalDateTime cutoffDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> identifyBottlenecks(Long thresholdHours, LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<PipelineTransition> findRegressions(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getSuccessRatesByStage(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getJobPostingPipelineStats(Long jobPostingId, LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getDepartmentPipelineStats(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    @Override
    public List<Object[]> getTransitionTypeStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be migrated to Athena");
    }

    // ── Conversion ───────────────────────────────────────────────────────────

    @Override
    protected PipelineTransition toEntity(PipelineTransitionItem item) {
        var entity = new PipelineTransition();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
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
            entity.setTriggeredByInterviewId(Long.parseLong(item.getTriggeredByInterviewId()));
        }
        if (item.getTriggeredByAssessmentId() != null) {
            entity.setTriggeredByAssessmentId(Long.parseLong(item.getTriggeredByAssessmentId()));
        }
        entity.setMetadata(item.getMetadata());
        if (item.getCreatedBy() != null) {
            entity.setCreatedBy(Long.parseLong(item.getCreatedBy()));
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getEffectiveAt() != null) {
            entity.setEffectiveAt(LocalDateTime.parse(item.getEffectiveAt(), ISO_FMT));
        }
        entity.setDurationInPreviousStageHours(item.getDurationInPreviousStageHours());
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected PipelineTransitionItem toItem(PipelineTransition entity) {
        var item = new PipelineTransitionItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        String applicationId = entity.getApplication() != null ?
                String.valueOf(entity.getApplication().getId()) : "";

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
            item.setTriggeredByInterviewId(String.valueOf(entity.getTriggeredByInterviewId()));
        }
        if (entity.getTriggeredByAssessmentId() != null) {
            item.setTriggeredByAssessmentId(String.valueOf(entity.getTriggeredByAssessmentId()));
        }
        item.setMetadata(entity.getMetadata());
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(String.valueOf(entity.getCreatedBy()));
        }
        item.setCreatedAt(createdAtStr);
        if (entity.getEffectiveAt() != null) {
            item.setEffectiveAt(entity.getEffectiveAt().format(ISO_FMT));
        }
        item.setDurationInPreviousStageHours(entity.getDurationInPreviousStageHours());

        return item;
    }
}
