package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;
import com.arthmatic.shumelahire.entity.compliance.DsarRequestType;
import com.arthmatic.shumelahire.entity.compliance.DsarStatus;
import com.arthmatic.shumelahire.repository.DataSubjectRequestDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DataSubjectRequestItem;
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
public class DynamoDataSubjectRequestRepository extends DynamoRepository<DataSubjectRequestItem, DataSubjectRequest>
        implements DataSubjectRequestDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoDataSubjectRequestRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DataSubjectRequestItem.class);
    }

    @Override
    protected String entityType() {
        return "DSAR";
    }

    @Override
    public List<DataSubjectRequest> findByStatus(DsarStatus status) {
        String gsi1Pk = "DSAR_STATUS#" + currentTenantId() + "#" + status.name();
        return queryGsiAll("GSI1", gsi1Pk);
    }

    @Override
    public List<DataSubjectRequest> findByRequesterEmail(String email) {
        return findAll().stream()
                .filter(d -> email.equalsIgnoreCase(d.getRequesterEmail()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(DsarStatus status) {
        String gsi1Pk = "DSAR_STATUS#" + currentTenantId() + "#" + status.name();
        return queryGsiAll("GSI1", gsi1Pk).size();
    }

    @Override
    protected DataSubjectRequest toEntity(DataSubjectRequestItem item) {
        if (item == null) {
            return null;
        }

        DataSubjectRequest entity = new DataSubjectRequest();
        entity.setId(Long.parseLong(item.getId()));
        entity.setTenantId(item.getTenantId());
        entity.setRequesterName(item.getRequesterName());
        entity.setRequesterEmail(item.getRequesterEmail());
        entity.setRequestType(item.getRequestType() != null ? DsarRequestType.valueOf(item.getRequestType()) : null);
        entity.setDescription(item.getDescription());
        entity.setStatus(item.getStatus() != null ? DsarStatus.valueOf(item.getStatus()) : null);
        entity.setResponse(item.getResponse());
        entity.setDueDate(item.getDueDate() != null ? LocalDate.parse(item.getDueDate(), DATE_FMT) : null);
        entity.setCompletedAt(item.getCompletedAt() != null ? LocalDateTime.parse(item.getCompletedAt(), ISO_FMT) : null);
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected DataSubjectRequestItem toItem(DataSubjectRequest entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : java.util.UUID.randomUUID().toString();

        DataSubjectRequestItem item = new DataSubjectRequestItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);

        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "";
        item.setGsi1pk("DSAR_STATUS#" + tenantId + "#" + statusStr);
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        item.setGsi1sk(createdAtStr + "#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setRequesterName(entity.getRequesterName());
        item.setRequesterEmail(entity.getRequesterEmail());
        item.setRequestType(entity.getRequestType() != null ? entity.getRequestType().name() : null);
        item.setDescription(entity.getDescription());
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setResponse(entity.getResponse());
        item.setDueDate(entity.getDueDate() != null ? entity.getDueDate().format(DATE_FMT) : null);
        item.setCompletedAt(entity.getCompletedAt() != null ? entity.getCompletedAt().format(ISO_FMT) : null);
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(ISO_FMT) : null);

        return item;
    }
}
