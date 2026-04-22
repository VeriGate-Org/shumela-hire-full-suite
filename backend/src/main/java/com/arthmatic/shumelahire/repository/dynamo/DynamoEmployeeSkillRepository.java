package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.employee.EmployeeSkill;
import com.arthmatic.shumelahire.repository.EmployeeSkillDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmployeeSkillItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class DynamoEmployeeSkillRepository extends DynamoRepository<EmployeeSkillItem, EmployeeSkill>
        implements EmployeeSkillDataRepository {

    public DynamoEmployeeSkillRepository(DynamoDbClient dynamoDbClient,
                                          DynamoDbEnhancedClient enhancedClient,
                                          @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, EmployeeSkillItem.class);
    }

    @Override
    protected String entityType() {
        return "EMP_SKILL";
    }

    @Override
    public List<EmployeeSkill> findByEmployeeId(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "EMP_SKILL_EMP#" + tenantId + "#" + employeeId);
    }

    @Override
    protected EmployeeSkill toEntity(EmployeeSkillItem item) {
        var e = new EmployeeSkill();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());
        if (item.getEmployeeId() != null) {
            e.setEmployeeId(item.getEmployeeId());
        }
        e.setSkillName(item.getSkillName());
        if (item.getProficiencyLevel() != null) {
            e.setProficiencyLevel(EmployeeSkill.ProficiencyLevel.valueOf(item.getProficiencyLevel()));
        }
        e.setYearsExperience(item.getYearsExperience());
        e.setCertified(item.getCertified());
        e.setCreatedAt(item.getCreatedAt());
        e.setUpdatedAt(item.getUpdatedAt());
        return e;
    }

    @Override
    protected EmployeeSkillItem toItem(EmployeeSkill entity) {
        var item = new EmployeeSkillItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String employeeId = entity.getEmployeeId() != null ? entity.getEmployeeId().toString() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("EMP_SKILL#" + id);
        if (employeeId != null) {
            item.setGsi1pk("EMP_SKILL_EMP#" + tenantId + "#" + employeeId);
            item.setGsi1sk("EMP_SKILL#" + createdAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        item.setSkillName(entity.getSkillName());
        if (entity.getProficiencyLevel() != null) {
            item.setProficiencyLevel(entity.getProficiencyLevel().name());
        }
        item.setYearsExperience(entity.getYearsExperience());
        item.setCertified(entity.getCertified());
        item.setCreatedAt(createdAt);
        item.setUpdatedAt(entity.getUpdatedAt());
        return item;
    }
}
