package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.engagement.Survey;
import com.arthmatic.shumelahire.entity.engagement.SurveyQuestion;
import com.arthmatic.shumelahire.entity.engagement.QuestionType;
import com.arthmatic.shumelahire.repository.SurveyQuestionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SurveyQuestionItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSurveyQuestionRepository extends DynamoRepository<SurveyQuestionItem, SurveyQuestion>
        implements SurveyQuestionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSurveyQuestionRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SurveyQuestionItem.class);
    }

    @Override
    protected String entityType() {
        return "SURVEY_Q";
    }

    @Override
    public List<SurveyQuestion> findBySurveyIdOrderByDisplayOrderAsc(String surveyId) {
        String tenantId = currentTenantId();
        List<SurveyQuestion> questions = queryGsiAll("GSI1", "SURVQ_SURV#" + tenantId + "#" + surveyId);
        return questions.stream()
                .sorted(Comparator.comparing(SurveyQuestion::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    protected SurveyQuestion toEntity(SurveyQuestionItem item) {
        var e = new SurveyQuestion();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());

        // Create Survey stub
        if (item.getSurveyId() != null) {
            var survey = new Survey();
            survey.setId(safeParseLong(item.getSurveyId()));
            survey.setTenantId(item.getTenantId());
            e.setSurvey(survey);
        }

        e.setQuestionText(item.getQuestionText());
        if (item.getQuestionType() != null) {
            e.setQuestionType(QuestionType.valueOf(item.getQuestionType()));
        }
        e.setOptions(item.getOptions());
        e.setDisplayOrder(item.getDisplayOrder());
        e.setIsRequired(item.getIsRequired());
        e.setCreatedAt(item.getCreatedAt());
        return e;
    }

    @Override
    protected SurveyQuestionItem toItem(SurveyQuestion entity) {
        var item = new SurveyQuestionItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String surveyId = entity.getSurvey() != null && entity.getSurvey().getId() != null ? entity.getSurvey().getId().toString() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("SURVEY_Q#" + id);
        if (surveyId != null) {
            item.setGsi1pk("SURVQ_SURV#" + tenantId + "#" + surveyId);
            item.setGsi1sk("SURVEY_Q#" + (entity.getDisplayOrder() != null ? String.format("%06d", entity.getDisplayOrder()) : "999999") + "#" + id);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setSurveyId(surveyId);
        item.setQuestionText(entity.getQuestionText());
        if (entity.getQuestionType() != null) {
            item.setQuestionType(entity.getQuestionType().name());
        }
        item.setOptions(entity.getOptions());
        item.setDisplayOrder(entity.getDisplayOrder());
        item.setIsRequired(entity.getIsRequired());
        item.setCreatedAt(createdAt);
        return item;
    }
}
