package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.FeedbackRequest;
import com.arthmatic.shumelahire.entity.performance.FeedbackResponse;
import com.arthmatic.shumelahire.repository.FeedbackResponseDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.FeedbackResponseItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoFeedbackResponseRepository extends DynamoRepository<FeedbackResponseItem, FeedbackResponse>
        implements FeedbackResponseDataRepository {

    public DynamoFeedbackResponseRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName
    ) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, FeedbackResponseItem.class);
    }

    @Override
    protected String entityType() {
        return "FEEDBACK_RESP";
    }

    @Override
    public List<FeedbackResponse> findByRequestId(String requestId) {
        String gsi1pk = "FRESP_REQ#" + currentTenantId() + "#" + requestId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public Optional<FeedbackResponse> findByRequestIdAndRespondentId(String requestId, String respondentId) {
        String gsi1pk = "FRESP_REQ#" + currentTenantId() + "#" + requestId;
        return queryGsiAll("GSI1", gsi1pk).stream()
                .filter(resp -> {
                    if (resp.getRespondent() == null || resp.getRespondent().getId() == null) return false;
                    return respondentId.equals(resp.getRespondent().getId());
                })
                .findFirst();
    }

    @Override
    protected FeedbackResponseItem toItem(FeedbackResponse entity) {
        if (entity == null) return null;

        FeedbackResponseItem item = new FeedbackResponseItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("FEEDBACK_RESP#" + entity.getId());
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());

        if (entity.getRequest() != null && entity.getRequest().getId() != null) {
            item.setRequestId(entity.getRequest().getId());
            item.setGsi1pk("FRESP_REQ#" + entity.getTenantId() + "#" + entity.getRequest().getId());
            item.setGsi1sk("FRESP#" + entity.getId());
        }

        if (entity.getRespondent() != null && entity.getRespondent().getId() != null) {
            item.setRespondentId(entity.getRespondent().getId());
        }

        item.setRatings(entity.getRatings());
        item.setComments(entity.getComments());
        item.setStrengths(entity.getStrengths());
        item.setImprovements(entity.getImprovements());
        item.setSubmittedAt(entity.getSubmittedAt());
        item.setCreatedAt(entity.getCreatedAt());

        return item;
    }

    @Override
    protected FeedbackResponse toEntity(FeedbackResponseItem item) {
        if (item == null) return null;

        FeedbackResponse entity = new FeedbackResponse();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());

        if (item.getRequestId() != null) {
            FeedbackRequest request = new FeedbackRequest();
            request.setId(item.getRequestId());
            entity.setRequest(request);
        }

        if (item.getRespondentId() != null) {
            Employee respondent = new Employee();
            respondent.setId(item.getRespondentId());
            entity.setRespondent(respondent);
        }

        entity.setRatings(item.getRatings());
        entity.setComments(item.getComments());
        entity.setStrengths(item.getStrengths());
        entity.setImprovements(item.getImprovements());
        entity.setSubmittedAt(item.getSubmittedAt());
        entity.setCreatedAt(item.getCreatedAt());

        return entity;
    }
}
