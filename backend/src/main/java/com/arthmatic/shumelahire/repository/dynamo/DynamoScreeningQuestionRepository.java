package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.QuestionType;
import com.arthmatic.shumelahire.entity.ScreeningQuestion;
import com.arthmatic.shumelahire.repository.ScreeningQuestionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ScreeningQuestionItem;

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

/**
 * DynamoDB repository for the ScreeningQuestion entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     SCREENING_QUESTION#{id}
 *   GSI1PK: SQ_ACTIVE#{isActive}                             GSI1SK: SCREENING_QUESTION#{displayOrder}
 *   GSI2PK: SQ_JOBPOSTING#{jobPostingId}                     GSI2SK: SCREENING_QUESTION#{displayOrder}
 *   GSI4PK: SQ_TEXT#{tenantId}#{jobPostingId}#{questionText}  GSI4SK: SCREENING_QUESTION#{id}
 * </pre>
 */
@Repository
public class DynamoScreeningQuestionRepository extends DynamoRepository<ScreeningQuestionItem, ScreeningQuestion>
        implements ScreeningQuestionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoScreeningQuestionRepository(DynamoDbClient dynamoDbClient,
                                              DynamoDbEnhancedClient enhancedClient,
                                              String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ScreeningQuestionItem.class);
    }

    @Override
    protected String entityType() {
        return "SCREENING_QUESTION";
    }

    // -- ScreeningQuestionDataRepository implementation -----------------------

    @Override
    public List<ScreeningQuestion> findByJobPostingIdAndIsActiveTrueOrderByDisplayOrder(String jobPostingId) {
        return queryGsiAll("GSI2", "SQ_JOBPOSTING#" + jobPostingId).stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .sorted(Comparator.comparing(ScreeningQuestion::getDisplayOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<ScreeningQuestion> findByJobPostingIdAndIsActiveTrue(String jobPostingId) {
        return queryGsiAll("GSI2", "SQ_JOBPOSTING#" + jobPostingId).stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ScreeningQuestion> findByJobPostingId(String jobPostingId) {
        return queryGsiAll("GSI2", "SQ_JOBPOSTING#" + jobPostingId);
    }

    @Override
    public long countRequiredQuestionsByJobPostingId(String jobPostingId) {
        return findByJobPostingIdAndIsActiveTrue(jobPostingId).stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsRequired()))
                .count();
    }

    @Override
    public long countActiveQuestionsByJobPostingId(String jobPostingId) {
        return findByJobPostingIdAndIsActiveTrue(jobPostingId).size();
    }

    @Override
    public boolean existsByJobPostingIdAndQuestionTextAndIsActiveTrue(String jobPostingId, String questionText) {
        String tenantId = currentTenantId();
        Optional<ScreeningQuestion> match = findByGsiUnique("GSI4",
                "SQ_TEXT#" + tenantId + "#" + jobPostingId + "#" + questionText);
        return match.isPresent() && Boolean.TRUE.equals(match.get().getIsActive());
    }

    @Override
    public List<ScreeningQuestion> findActiveQuestionsByJobPostingIdOrderedByDisplay(String jobPostingId) {
        return findByJobPostingIdAndIsActiveTrueOrderByDisplayOrder(jobPostingId);
    }

    @Override
    public Integer findMaxDisplayOrderByJobPostingId(String jobPostingId) {
        return findByJobPostingId(jobPostingId).stream()
                .map(ScreeningQuestion::getDisplayOrder)
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    // -- Conversion: ScreeningQuestionItem <-> ScreeningQuestion ---------------

    @Override
    protected ScreeningQuestion toEntity(ScreeningQuestionItem item) {
        var entity = new ScreeningQuestion();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        if (item.getJobPostingId() != null) {
            entity.setJobPostingId(safeParseLong(item.getJobPostingId()));
        }
        entity.setQuestionText(item.getQuestionText());
        if (item.getQuestionType() != null) {
            entity.setQuestionType(QuestionType.valueOf(item.getQuestionType()));
        }
        entity.setIsRequired(item.getIsRequired());
        entity.setDisplayOrder(item.getDisplayOrder());
        entity.setQuestionOptions(item.getQuestionOptions());
        entity.setValidationRules(item.getValidationRules());
        entity.setHelpText(item.getHelpText());
        entity.setIsActive(item.getIsActive());
        entity.setCreatedBy(item.getCreatedBy());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected ScreeningQuestionItem toItem(ScreeningQuestion entity) {
        var item = new ScreeningQuestionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String jobPostingId = entity.getJobPostingId() != null ? String.valueOf(entity.getJobPostingId()) : "";
        int displayOrder = entity.getDisplayOrder() != null ? entity.getDisplayOrder() : 0;

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("SCREENING_QUESTION#" + id);

        // GSI1: Active status index
        item.setGsi1pk("SQ_ACTIVE#" + entity.getIsActive());
        item.setGsi1sk("SCREENING_QUESTION#" + String.format("%05d", displayOrder));

        // GSI2: Job posting FK lookup
        item.setGsi2pk("SQ_JOBPOSTING#" + jobPostingId);
        item.setGsi2sk("SCREENING_QUESTION#" + String.format("%05d", displayOrder));

        // GSI4: Unique constraint on question text per job posting
        String questionText = entity.getQuestionText() != null ? entity.getQuestionText() : "";
        item.setGsi4pk("SQ_TEXT#" + tenantId + "#" + jobPostingId + "#" + questionText);
        item.setGsi4sk("SCREENING_QUESTION#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setJobPostingId(jobPostingId);
        item.setQuestionText(entity.getQuestionText());
        if (entity.getQuestionType() != null) {
            item.setQuestionType(entity.getQuestionType().name());
        }
        item.setIsRequired(entity.getIsRequired());
        item.setDisplayOrder(entity.getDisplayOrder());
        item.setQuestionOptions(entity.getQuestionOptions());
        item.setValidationRules(entity.getValidationRules());
        item.setHelpText(entity.getHelpText());
        item.setIsActive(entity.getIsActive());
        item.setCreatedBy(entity.getCreatedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
