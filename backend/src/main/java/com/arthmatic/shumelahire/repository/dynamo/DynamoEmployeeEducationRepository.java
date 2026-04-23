package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.employee.EmployeeEducation;
import com.arthmatic.shumelahire.repository.EmployeeEducationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmployeeEducationItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class DynamoEmployeeEducationRepository extends DynamoRepository<EmployeeEducationItem, EmployeeEducation>
        implements EmployeeEducationDataRepository {

    public DynamoEmployeeEducationRepository(DynamoDbClient dynamoDbClient,
                                              DynamoDbEnhancedClient enhancedClient,
                                              @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, EmployeeEducationItem.class);
    }

    @Override
    protected String entityType() {
        return "EMP_EDUCATION";
    }

    @Override
    public List<EmployeeEducation> findByEmployeeId(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "EMP_EDU_EMP#" + tenantId + "#" + employeeId);
    }

    @Override
    protected EmployeeEducation toEntity(EmployeeEducationItem item) {
        var e = new EmployeeEducation();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());
        if (item.getEmployeeId() != null) {
            e.setEmployeeId(item.getEmployeeId());
        }
        e.setInstitution(item.getInstitution());
        e.setQualification(item.getQualification());
        e.setFieldOfStudy(item.getFieldOfStudy());
        if (item.getStartDate() != null) {
            e.setStartDate(LocalDate.parse(item.getStartDate()));
        }
        if (item.getEndDate() != null) {
            e.setEndDate(LocalDate.parse(item.getEndDate()));
        }
        e.setGrade(item.getGrade());
        e.setCreatedAt(item.getCreatedAt());
        e.setUpdatedAt(item.getUpdatedAt());
        return e;
    }

    @Override
    protected EmployeeEducationItem toItem(EmployeeEducation entity) {
        var item = new EmployeeEducationItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String employeeId = entity.getEmployeeId() != null ? entity.getEmployeeId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("EMP_EDUCATION#" + id);
        if (employeeId != null) {
            item.setGsi1pk("EMP_EDU_EMP#" + tenantId + "#" + employeeId);
            item.setGsi1sk("EMP_EDUCATION#" + createdAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        item.setInstitution(entity.getInstitution());
        item.setQualification(entity.getQualification());
        item.setFieldOfStudy(entity.getFieldOfStudy());
        if (entity.getStartDate() != null) {
            item.setStartDate(entity.getStartDate().toString());
        }
        if (entity.getEndDate() != null) {
            item.setEndDate(entity.getEndDate().toString());
        }
        item.setGrade(entity.getGrade());
        item.setCreatedAt(createdAt);
        item.setUpdatedAt(entity.getUpdatedAt());
        return item;
    }
}
