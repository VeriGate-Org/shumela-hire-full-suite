package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.CompanyDocumentAcknowledgement;
import com.arthmatic.shumelahire.repository.CompanyDocumentAcknowledgementDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CompanyDocumentAcknowledgementItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class DynamoCompanyDocumentAcknowledgementRepository
        extends DynamoRepository<CompanyDocumentAcknowledgementItem, CompanyDocumentAcknowledgement>
        implements CompanyDocumentAcknowledgementDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoCompanyDocumentAcknowledgementRepository(DynamoDbClient dynamoDbClient,
                                                           DynamoDbEnhancedClient enhancedClient,
                                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, CompanyDocumentAcknowledgementItem.class);
    }

    @Override
    protected String entityType() {
        return "COMDOCACK";
    }

    @Override
    public List<CompanyDocumentAcknowledgement> findByDocumentId(String documentId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "COMDOCACK_DOC#" + tenantId + "#" + documentId);
    }

    @Override
    public List<CompanyDocumentAcknowledgement> findByEmployeeId(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "COMDOCACK_EMP#" + tenantId + "#" + employeeId);
    }

    @Override
    public boolean existsByDocumentIdAndEmployeeId(String documentId, String employeeId) {
        return findByDocumentId(documentId).stream()
                .anyMatch(a -> employeeId.equals(a.getEmployeeId()));
    }

    @Override
    protected CompanyDocumentAcknowledgement toEntity(CompanyDocumentAcknowledgementItem item) {
        var ack = new CompanyDocumentAcknowledgement();
        ack.setId(item.getId());
        ack.setTenantId(item.getTenantId());
        ack.setDocumentId(item.getDocumentId());
        ack.setEmployeeId(item.getEmployeeId());
        if (item.getAcknowledgedAt() != null) {
            ack.setAcknowledgedAt(LocalDateTime.parse(item.getAcknowledgedAt(), ISO_FMT));
        }
        return ack;
    }

    @Override
    protected CompanyDocumentAcknowledgementItem toItem(CompanyDocumentAcknowledgement entity) {
        var item = new CompanyDocumentAcknowledgementItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String ackAt = entity.getAcknowledgedAt() != null ? entity.getAcknowledgedAt().format(ISO_FMT) : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("COMDOCACK#" + id);

        item.setGsi1pk("COMDOCACK_DOC#" + tenantId + "#" + entity.getDocumentId());
        item.setGsi1sk("COMDOCACK#" + ackAt);

        item.setGsi2pk("COMDOCACK_EMP#" + tenantId + "#" + entity.getEmployeeId());
        item.setGsi2sk("COMDOCACK#" + ackAt);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setDocumentId(entity.getDocumentId());
        item.setEmployeeId(entity.getEmployeeId());
        if (entity.getAcknowledgedAt() != null) {
            item.setAcknowledgedAt(entity.getAcknowledgedAt().format(ISO_FMT));
        }

        return item;
    }
}
