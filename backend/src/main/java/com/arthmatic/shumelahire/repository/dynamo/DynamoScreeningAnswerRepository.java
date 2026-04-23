package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.ScreeningAnswer;
import com.arthmatic.shumelahire.entity.ScreeningQuestion;
import com.arthmatic.shumelahire.repository.ScreeningAnswerDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ScreeningAnswerItem;

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
 * DynamoDB repository for the ScreeningAnswer entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     SCREENING_ANSWER#{id}
 *   GSI2PK: SA_APP#{applicationId}                                        GSI2SK: SCREENING_ANSWER#{screeningQuestionId}
 *   GSI4PK: SA_APPQ#{tenantId}#{applicationId}#{screeningQuestionId}      GSI4SK: SCREENING_ANSWER#{id}
 * </pre>
 */
@Repository
public class DynamoScreeningAnswerRepository extends DynamoRepository<ScreeningAnswerItem, ScreeningAnswer>
        implements ScreeningAnswerDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoScreeningAnswerRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ScreeningAnswerItem.class);
    }

    @Override
    protected String entityType() {
        return "SCREENING_ANSWER";
    }

    // -- ScreeningAnswerDataRepository implementation -------------------------

    @Override
    public List<ScreeningAnswer> findByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "SA_APP#" + applicationId);
    }

    @Override
    public Optional<ScreeningAnswer> findByApplicationIdAndScreeningQuestionId(String applicationId, String screeningQuestionId) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "SA_APPQ#" + tenantId + "#" + applicationId + "#" + screeningQuestionId);
    }

    @Override
    public List<ScreeningAnswer> findByApplicationIdOrderedByQuestionDisplay(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .sorted(Comparator.comparing(
                        a -> a.getScreeningQuestion() != null && a.getScreeningQuestion().getDisplayOrder() != null
                                ? a.getScreeningQuestion().getDisplayOrder() : Integer.MAX_VALUE))
                .collect(Collectors.toList());
    }

    @Override
    public long countMissingRequiredAnswersByApplicationId(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .filter(a -> a.getScreeningQuestion() != null
                        && Boolean.TRUE.equals(a.getScreeningQuestion().getIsRequired())
                        && (a.getAnswerValue() == null || a.getAnswerValue().isBlank()))
                .count();
    }

    @Override
    public long countInvalidAnswersByApplicationId(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .filter(a -> Boolean.FALSE.equals(a.getIsValid()))
                .count();
    }

    @Override
    public long countRequiredAnswersByApplicationId(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .filter(a -> a.getScreeningQuestion() != null
                        && Boolean.TRUE.equals(a.getScreeningQuestion().getIsRequired()))
                .count();
    }

    @Override
    public long countTotalAnswersByApplicationId(String applicationId) {
        return findByApplicationId(applicationId).size();
    }

    @Override
    public List<ScreeningAnswer> findValidAnswersByJobPostingId(String jobPostingId) {
        // No direct GSI for this; scan answers and filter by job posting through question
        return findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsValid())
                        && a.getScreeningQuestion() != null
                        && a.getScreeningQuestion().getJobPostingId() != null
                        && a.getScreeningQuestion().getJobPostingId().equals(jobPostingId))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByApplicationId(String applicationId) {
        List<ScreeningAnswer> answers = findByApplicationId(applicationId);
        for (ScreeningAnswer answer : answers) {
            deleteById(answer.getId());
        }
    }

    @Override
    public boolean existsByApplicationIdAndScreeningQuestionId(String applicationId, String screeningQuestionId) {
        return findByApplicationIdAndScreeningQuestionId(applicationId, screeningQuestionId).isPresent();
    }

    // -- Conversion: ScreeningAnswerItem <-> ScreeningAnswer ------------------

    @Override
    protected ScreeningAnswer toEntity(ScreeningAnswerItem item) {
        var entity = new ScreeningAnswer();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        if (item.getApplicationId() != null) {
            entity.setApplicationId(item.getApplicationId());
        }
        // FK: ScreeningQuestion is stored as ID only; set a stub with the ID
        if (item.getScreeningQuestionId() != null) {
            var question = new ScreeningQuestion();
            question.setId(item.getScreeningQuestionId());
            entity.setScreeningQuestion(question);
        }
        entity.setAnswerValue(item.getAnswerValue());
        entity.setAnswerFileUrl(item.getAnswerFileUrl());
        entity.setAnswerFileName(item.getAnswerFileName());
        entity.setIsValid(item.getIsValid());
        entity.setValidationMessage(item.getValidationMessage());
        if (item.getAnsweredAt() != null) {
            entity.setAnsweredAt(LocalDateTime.parse(item.getAnsweredAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected ScreeningAnswerItem toItem(ScreeningAnswer entity) {
        var item = new ScreeningAnswerItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String applicationId = entity.getApplicationId() != null ? entity.getApplicationId() : "";
        String questionId = entity.getScreeningQuestion() != null && entity.getScreeningQuestion().getId() != null
                ? entity.getScreeningQuestion().getId() : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("SCREENING_ANSWER#" + id);

        // GSI2: Application FK lookup
        item.setGsi2pk("SA_APP#" + applicationId);
        item.setGsi2sk("SCREENING_ANSWER#" + questionId);

        // GSI4: Unique constraint on application + question
        item.setGsi4pk("SA_APPQ#" + tenantId + "#" + applicationId + "#" + questionId);
        item.setGsi4sk("SCREENING_ANSWER#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setApplicationId(applicationId);
        item.setScreeningQuestionId(questionId);
        item.setAnswerValue(entity.getAnswerValue());
        item.setAnswerFileUrl(entity.getAnswerFileUrl());
        item.setAnswerFileName(entity.getAnswerFileName());
        item.setIsValid(entity.getIsValid());
        item.setValidationMessage(entity.getValidationMessage());
        if (entity.getAnsweredAt() != null) {
            item.setAnsweredAt(entity.getAnsweredAt().format(ISO_FMT));
        }

        return item;
    }
}
