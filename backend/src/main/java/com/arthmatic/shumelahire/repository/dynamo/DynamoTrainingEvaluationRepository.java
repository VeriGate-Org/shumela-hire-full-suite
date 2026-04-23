package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.TrainingEvaluation;
import com.arthmatic.shumelahire.repository.TrainingEvaluationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TrainingEvaluationItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
public class DynamoTrainingEvaluationRepository extends DynamoRepository<TrainingEvaluationItem, TrainingEvaluation>
        implements TrainingEvaluationDataRepository {

    public DynamoTrainingEvaluationRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, TrainingEvaluationItem.class);
    }

    @Override
    protected String entityType() {
        return "TRAINING_EVAL";
    }

    @Override
    public List<TrainingEvaluation> findBySessionId(String sessionId) {
        String gsi1pk = "TEVAL_SESS#" + currentTenantId() + "#" + sessionId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public Optional<TrainingEvaluation> findBySessionIdAndEmployeeId(String sessionId, String employeeId) {
        return findBySessionId(sessionId).stream()
                .filter(e -> e.getEmployeeId() != null && employeeId.equals(e.getEmployeeId()))
                .findFirst();
    }

    @Override
    protected TrainingEvaluationItem toItem(TrainingEvaluation entity) {
        TrainingEvaluationItem item = new TrainingEvaluationItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("TRAINING_EVAL#" + id);

        String sessionId = entity.getSessionId() != null ? entity.getSessionId() : "";
        item.setGsi1pk("TEVAL_SESS#" + tenantId + "#" + sessionId);
        item.setGsi1sk("TRAINING_EVAL#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setSessionId(entity.getSessionId() != null ? entity.getSessionId() : null);
        item.setEmployeeId(entity.getEmployeeId() != null ? entity.getEmployeeId() : null);
        item.setOverallRating(entity.getOverallRating());
        item.setContentRating(entity.getContentRating());
        item.setInstructorRating(entity.getInstructorRating());
        item.setRelevanceRating(entity.getRelevanceRating());
        item.setComments(entity.getComments());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected TrainingEvaluation toEntity(TrainingEvaluationItem item) {
        TrainingEvaluation entity = new TrainingEvaluation();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setSessionId(item.getSessionId() != null ? item.getSessionId() : null);
        entity.setEmployeeId(item.getEmployeeId() != null ? item.getEmployeeId() : null);
        entity.setOverallRating(item.getOverallRating());
        entity.setContentRating(item.getContentRating());
        entity.setInstructorRating(item.getInstructorRating());
        entity.setRelevanceRating(item.getRelevanceRating());
        entity.setComments(item.getComments());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
