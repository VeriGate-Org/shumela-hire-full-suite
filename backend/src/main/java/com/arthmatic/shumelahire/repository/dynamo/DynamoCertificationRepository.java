package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.Certification;
import com.arthmatic.shumelahire.entity.training.CertificationStatus;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.repository.CertificationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CertificationItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoCertificationRepository extends DynamoRepository<CertificationItem, Certification>
        implements CertificationDataRepository {

    public DynamoCertificationRepository(DynamoDbClient dynamoDbClient,
                                         DynamoDbEnhancedClient enhancedClient,
                                         @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, CertificationItem.class);
    }

    @Override
    protected String entityType() {
        return "CERT";
    }

    @Override
    public List<Certification> findByEmployeeId(String employeeId) {
        String gsi1pk = "CERT_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<Certification> findByEmployeeIdAndStatus(String employeeId, CertificationStatus status) {
        return findByEmployeeId(employeeId).stream()
                .filter(c -> c.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    public List<Certification> findExpiringSoon(LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(c -> c.getExpiryDate() != null &&
                        !c.getExpiryDate().isBefore(startDate) &&
                        !c.getExpiryDate().isAfter(endDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<Certification> findExpired() {
        LocalDate now = LocalDate.now();
        return findAll().stream()
                .filter(c -> c.getExpiryDate() != null && c.getExpiryDate().isBefore(now))
                .collect(Collectors.toList());
    }

    @Override
    public long countActive() {
        return findAll().stream()
                .filter(c -> c.getStatus() == CertificationStatus.ACTIVE)
                .count();
    }

    @Override
    public long countActiveByEmployee(String employeeId) {
        return findByEmployeeId(employeeId).stream()
                .filter(c -> c.getStatus() == CertificationStatus.ACTIVE)
                .count();
    }

    @Override
    protected CertificationItem toItem(Certification entity) {
        CertificationItem item = new CertificationItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("CERT#" + entity.getId());
        Long employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        item.setGsi1pk("CERT_EMP#" + entity.getTenantId() + "#" + (employeeId != null ? employeeId : ""));
        item.setGsi1sk("CERT#" + entity.getId());
        item.setId(entity.getId() != null ? String.valueOf(entity.getId()) : null);
        item.setTenantId(entity.getTenantId());
        item.setEmployeeId(employeeId != null ? String.valueOf(employeeId) : null);
        item.setName(entity.getName());
        item.setIssuingBody(entity.getIssuingBody());
        item.setCertificationNumber(entity.getCertificationNumber());
        item.setIssueDate(entity.getIssueDate());
        item.setExpiryDate(entity.getExpiryDate());
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setDocumentUrl(entity.getDocumentUrl());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected Certification toEntity(CertificationItem item) {
        Certification entity = new Certification();
        if (item.getId() != null) {
            try { entity.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ignored) {}
        }
        entity.setTenantId(item.getTenantId());
        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            try { employee.setId(Long.parseLong(item.getEmployeeId())); } catch (NumberFormatException ignored) {}
            entity.setEmployee(employee);
        }
        entity.setName(item.getName());
        entity.setIssuingBody(item.getIssuingBody());
        entity.setCertificationNumber(item.getCertificationNumber());
        entity.setIssueDate(item.getIssueDate());
        entity.setExpiryDate(item.getExpiryDate());
        entity.setStatus(item.getStatus() != null ? CertificationStatus.valueOf(item.getStatus()) : null);
        entity.setDocumentUrl(item.getDocumentUrl());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
