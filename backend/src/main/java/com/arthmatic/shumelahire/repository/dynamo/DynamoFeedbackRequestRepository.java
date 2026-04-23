package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.FeedbackRequest;
import com.arthmatic.shumelahire.entity.performance.FeedbackStatus;
import com.arthmatic.shumelahire.entity.performance.FeedbackType;
import com.arthmatic.shumelahire.repository.FeedbackRequestDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.FeedbackRequestItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoFeedbackRequestRepository extends DynamoRepository<FeedbackRequestItem, FeedbackRequest> implements FeedbackRequestDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoFeedbackRequestRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName
    ) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, FeedbackRequestItem.class);
    }

    @Override
    public List<FeedbackRequest> findByEmployeeId(String employeeId) {
        String gsi1pk = "FR_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<FeedbackRequest> findByRequesterId(String requesterId) {
        return findAll().stream()
                .filter(req -> req.getRequester() != null && requesterId.equals(req.getRequester().getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedbackRequest> findByEmployeeIdAndStatus(String employeeId, FeedbackStatus status) {
        String gsi1pk = "FR_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk).stream()
                .filter(req -> req.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedbackRequest> findByStatus(FeedbackStatus status) {
        return findAll().stream()
                .filter(req -> req.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    protected String entityType() {
        return "FEEDBACK_REQ";
    }

    @Override
    protected FeedbackRequestItem toItem(FeedbackRequest entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        FeedbackRequestItem item = new FeedbackRequestItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);
        item.setId(id);
        item.setTenantId(tenantId);

        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            item.setEmployeeId(entity.getEmployee().getId());
            String gsi1pk = "FR_EMP#" + tenantId + "#" + entity.getEmployee().getId();
            item.setGsi1pk(gsi1pk);
            item.setGsi1sk("FR#" + id);
        }

        if (entity.getRequester() != null && entity.getRequester().getId() != null) {
            item.setRequesterId(entity.getRequester().getId());
        }

        if (entity.getFeedbackType() != null) {
            item.setFeedbackType(entity.getFeedbackType().name());
        }

        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }

        item.setDueDate(entity.getDueDate());
        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        return item;
    }

    @Override
    protected FeedbackRequest toEntity(FeedbackRequestItem item) {
        if (item == null) {
            return null;
        }

        FeedbackRequest entity = new FeedbackRequest();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        if (item.getRequesterId() != null) {
            Employee requester = new Employee();
            requester.setId(item.getRequesterId());
            entity.setRequester(requester);
        }

        if (item.getFeedbackType() != null) {
            entity.setFeedbackType(FeedbackType.valueOf(item.getFeedbackType()));
        }

        if (item.getStatus() != null) {
            entity.setStatus(FeedbackStatus.valueOf(item.getStatus()));
        }

        entity.setDueDate(item.getDueDate());
        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        return entity;
    }
}
