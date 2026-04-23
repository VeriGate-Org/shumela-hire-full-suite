package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.compliance.ConsentRecord;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.repository.ConsentRecordDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ConsentRecordItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoConsentRecordRepository extends DynamoRepository<ConsentRecordItem, ConsentRecord>
        implements ConsentRecordDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoConsentRecordRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ConsentRecordItem.class);
    }

    @Override
    protected String entityType() {
        return "CONSENT";
    }

    @Override
    public List<ConsentRecord> findByEmployeeId(String employeeId) {
        String gsi1Pk = "CONSENT_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk);
    }

    @Override
    public Optional<ConsentRecord> findByEmployeeIdAndConsentType(String employeeId, String consentType) {
        String gsi1Pk = "CONSENT_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1Pk).stream()
                .filter(c -> consentType.equals(c.getConsentType()))
                .findFirst();
    }

    @Override
    public List<ConsentRecord> findByConsentType(String consentType) {
        return findAll().stream()
                .filter(c -> consentType.equals(c.getConsentType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ConsentRecord> findByIsGrantedTrue() {
        return findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsGranted()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByIsGrantedTrue() {
        return findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsGranted()))
                .count();
    }

    @Override
    public long countByIsGrantedFalse() {
        return findAll().stream()
                .filter(c -> Boolean.FALSE.equals(c.getIsGranted()))
                .count();
    }

    @Override
    protected ConsentRecord toEntity(ConsentRecordItem item) {
        if (item == null) {
            return null;
        }

        ConsentRecord entity = new ConsentRecord();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        entity.setConsentType(item.getConsentType());
        entity.setPurpose(item.getPurpose());
        entity.setIsGranted(item.getIsGranted());
        entity.setGrantedAt(item.getGrantedAt() != null ? LocalDateTime.parse(item.getGrantedAt(), ISO_FMT) : null);
        entity.setWithdrawnAt(item.getWithdrawnAt() != null ? LocalDateTime.parse(item.getWithdrawnAt(), ISO_FMT) : null);
        entity.setIpAddress(item.getIpAddress());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.parse(item.getCreatedAt(), ISO_FMT) : null);

        return entity;
    }

    @Override
    protected ConsentRecordItem toItem(ConsentRecord entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        ConsentRecordItem item = new ConsentRecordItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);

        String empId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId() : "";
        item.setGsi1pk("CONSENT_EMP#" + tenantId + "#" + empId);
        item.setGsi1sk((entity.getConsentType() != null ? entity.getConsentType() : "") + "#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(empId.isEmpty() ? null : empId);
        item.setConsentType(entity.getConsentType());
        item.setPurpose(entity.getPurpose());
        item.setIsGranted(entity.getIsGranted());
        item.setGrantedAt(entity.getGrantedAt() != null ? entity.getGrantedAt().format(ISO_FMT) : null);
        item.setWithdrawnAt(entity.getWithdrawnAt() != null ? entity.getWithdrawnAt().format(ISO_FMT) : null);
        item.setIpAddress(entity.getIpAddress());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : null);

        return item;
    }
}
