package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.Survey;
import com.arthmatic.shumelahire.entity.engagement.SurveyQuestion;
import com.arthmatic.shumelahire.entity.engagement.SurveyResponse;
import com.arthmatic.shumelahire.repository.SurveyResponseDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SurveyResponseItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSurveyResponseRepository extends DynamoRepository<SurveyResponseItem, SurveyResponse>
        implements SurveyResponseDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSurveyResponseRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SurveyResponseItem.class);
    }

    @Override
    protected String entityType() {
        return "SURVEY_R";
    }

    @Override
    public List<SurveyResponse> findBySurveyId(String surveyId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "SURVR_SURV#" + tenantId + "#" + surveyId);
    }

    @Override
    public List<SurveyResponse> findBySurveyIdAndEmployeeId(String surveyId, String employeeId) {
        return findBySurveyId(surveyId).stream()
                .filter(r -> r.getEmployee() != null && r.getEmployee().getId() != null
                        && employeeId.equals(r.getEmployee().getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<SurveyResponse> findBySurveyIdAndQuestionId(String surveyId, String questionId) {
        return findBySurveyId(surveyId).stream()
                .filter(r -> r.getQuestion() != null && r.getQuestion().getId() != null
                        && questionId.equals(r.getQuestion().getId()))
                .collect(Collectors.toList());
    }

    @Override
    public Double getAverageRating(String surveyId, String questionId) {
        List<SurveyResponse> responses = findBySurveyIdAndQuestionId(surveyId, questionId).stream()
                .filter(r -> r.getRating() != null)
                .collect(Collectors.toList());

        OptionalDouble avg = responses.stream()
                .mapToDouble(r -> r.getRating().doubleValue())
                .average();

        return avg.isPresent() ? avg.getAsDouble() : null;
    }

    @Override
    public long countDistinctRespondents(String surveyId) {
        return findBySurveyId(surveyId).stream()
                .filter(r -> r.getEmployee() != null && r.getEmployee().getId() != null)
                .map(r -> r.getEmployee().getId())
                .distinct()
                .count();
    }

    @Override
    public boolean existsBySurveyIdAndEmployeeId(String surveyId, String employeeId) {
        return !findBySurveyIdAndEmployeeId(surveyId, employeeId).isEmpty();
    }

    @Override
    protected SurveyResponse toEntity(SurveyResponseItem item) {
        var e = new SurveyResponse();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());

        // Create Survey stub
        if (item.getSurveyId() != null) {
            var survey = new Survey();
            survey.setId(item.getSurveyId());
            survey.setTenantId(item.getTenantId());
            e.setSurvey(survey);
        }

        // Create SurveyQuestion stub
        if (item.getQuestionId() != null) {
            var question = new SurveyQuestion();
            question.setId(item.getQuestionId());
            question.setTenantId(item.getTenantId());
            e.setQuestion(question);
        }

        // Create Employee stub
        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            employee.setId(item.getEmployeeId());
            employee.setTenantId(item.getTenantId());
            e.setEmployee(employee);
        }

        e.setRating(item.getRating());
        e.setTextResponse(item.getTextResponse());
        e.setCreatedAt(item.getCreatedAt());
        return e;
    }

    @Override
    protected SurveyResponseItem toItem(SurveyResponse entity) {
        var item = new SurveyResponseItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String surveyId = entity.getSurvey() != null && entity.getSurvey().getId() != null ? entity.getSurvey().getId() : null;
        String questionId = entity.getQuestion() != null && entity.getQuestion().getId() != null ? entity.getQuestion().getId() : null;
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null ? entity.getEmployee().getId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("SURVEY_R#" + id);
        if (surveyId != null) {
            item.setGsi1pk("SURVR_SURV#" + tenantId + "#" + surveyId);
            item.setGsi1sk("SURVEY_R#" + createdAt.format(ISO_FMT));
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setSurveyId(surveyId);
        item.setQuestionId(questionId);
        item.setEmployeeId(employeeId);
        item.setRating(entity.getRating());
        item.setTextResponse(entity.getTextResponse());
        item.setCreatedAt(createdAt);
        return item;
    }
}
