package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.Competency;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.EmployeeCompetency;
import com.arthmatic.shumelahire.repository.EmployeeCompetencyDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmployeeCompetencyItem;
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
public class DynamoEmployeeCompetencyRepository extends DynamoRepository<EmployeeCompetencyItem, EmployeeCompetency> implements EmployeeCompetencyDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoEmployeeCompetencyRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName
    ) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, EmployeeCompetencyItem.class);
    }

    @Override
    public List<EmployeeCompetency> findByEmployeeId(String employeeId) {
        String gsi1pk = "EC_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public Optional<EmployeeCompetency> findByEmployeeIdAndCompetencyId(String employeeId, String competencyId) {
        String gsi1pk = "EC_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk).stream()
                .filter(ec -> ec.getCompetency() != null && competencyId.equals(ec.getCompetency().getId()))
                .findFirst();
    }

    @Override
    public List<EmployeeCompetency> findByCompetencyId(String competencyId) {
        return findAll().stream()
                .filter(ec -> ec.getCompetency() != null && competencyId.equals(ec.getCompetency().getId()))
                .collect(Collectors.toList());
    }

    @Override
    protected String entityType() {
        return "EMP_COMP";
    }

    @Override
    protected EmployeeCompetencyItem toItem(EmployeeCompetency entity) {
        if (entity == null) {
            return null;
        }

        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        EmployeeCompetencyItem item = new EmployeeCompetencyItem();
        item.setPk("TENANT#" + tenantId);
        item.setSk(entityType() + "#" + id);
        item.setId(id);
        item.setTenantId(tenantId);

        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            item.setEmployeeId(entity.getEmployee().getId());
            String gsi1pk = "EC_EMP#" + tenantId + "#" + entity.getEmployee().getId();
            item.setGsi1pk(gsi1pk);
            item.setGsi1sk("COMP#" + id);
        }

        if (entity.getCompetency() != null && entity.getCompetency().getId() != null) {
            item.setCompetencyId(entity.getCompetency().getId());
        }

        item.setCurrentLevel(entity.getCurrentLevel());
        item.setTargetLevel(entity.getTargetLevel());
        item.setAssessedAt(entity.getAssessedAt());

        if (entity.getAssessor() != null && entity.getAssessor().getId() != null) {
            item.setAssessorId(entity.getAssessor().getId());
        }

        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        return item;
    }

    @Override
    protected EmployeeCompetency toEntity(EmployeeCompetencyItem item) {
        if (item == null) {
            return null;
        }

        EmployeeCompetency entity = new EmployeeCompetency();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        if (item.getCompetencyId() != null) {
            Competency competency = new Competency();
            competency.setId(item.getCompetencyId());
            entity.setCompetency(competency);
        }

        entity.setCurrentLevel(item.getCurrentLevel());
        entity.setTargetLevel(item.getTargetLevel());
        entity.setAssessedAt(item.getAssessedAt());

        if (item.getAssessorId() != null) {
            Employee assessor = new Employee();
            assessor.setId(item.getAssessorId());
            entity.setAssessor(assessor);
        }

        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        return entity;
    }
}
