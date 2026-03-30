package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgram;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgramParticipant;
import com.arthmatic.shumelahire.repository.WellnessProgramParticipantDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.WellnessProgramParticipantItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DynamoWellnessProgramParticipantRepository extends DynamoRepository<WellnessProgramParticipantItem, WellnessProgramParticipant>
        implements WellnessProgramParticipantDataRepository {

    public DynamoWellnessProgramParticipantRepository(DynamoDbClient dynamoDbClient,
                                                       DynamoDbEnhancedClient enhancedClient,
                                                       String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, WellnessProgramParticipantItem.class);
    }

    @Override
    protected String entityType() {
        return "WELLNESS_PART";
    }

    @Override
    public List<WellnessProgramParticipant> findByProgramId(String programId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "WP_PROG#" + tenantId + "#" + programId);
    }

    @Override
    public Optional<WellnessProgramParticipant> findByProgramIdAndEmployeeId(String programId, String employeeId) {
        return findByProgramId(programId).stream()
                .filter(p -> p.getEmployee() != null && employeeId.equals(String.valueOf(p.getEmployee().getId())))
                .findFirst();
    }

    @Override
    public boolean existsByProgramIdAndEmployeeId(String programId, String employeeId) {
        return findByProgramIdAndEmployeeId(programId, employeeId).isPresent();
    }

    @Override
    public long countByProgramId(String programId) {
        return (long) findByProgramId(programId).size();
    }

    @Override
    protected WellnessProgramParticipant toEntity(WellnessProgramParticipantItem item) {
        var e = new WellnessProgramParticipant();
        if (item.getId() != null) {
            try {
                e.setId(Long.parseLong(item.getId()));
            } catch (NumberFormatException ex) {
                // Skip invalid ID
            }
        }
        e.setTenantId(item.getTenantId());

        // Create WellnessProgram stub
        if (item.getProgramId() != null) {
            var program = new WellnessProgram();
            try {
                program.setId(Long.parseLong(item.getProgramId()));
            } catch (NumberFormatException ex) {
                // Skip invalid program ID
            }
            program.setTenantId(item.getTenantId());
            e.setProgram(program);
        }

        // Create Employee stub
        if (item.getEmployeeId() != null) {
            var employee = new Employee();
            try {
                employee.setId(Long.parseLong(item.getEmployeeId()));
            } catch (NumberFormatException ex) {
                // Skip invalid employee ID
            }
            employee.setTenantId(item.getTenantId());
            e.setEmployee(employee);
        }

        e.setJoinedAt(item.getJoinedAt());
        return e;
    }

    @Override
    protected WellnessProgramParticipantItem toItem(WellnessProgramParticipant entity) {
        var item = new WellnessProgramParticipantItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime joinedAt = entity.getJoinedAt() != null ? entity.getJoinedAt() : LocalDateTime.now();
        String programId = entity.getProgram() != null && entity.getProgram().getId() != null ? entity.getProgram().getId().toString() : null;
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null ? entity.getEmployee().getId().toString() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("WELLNESS_PART#" + id);
        if (programId != null) {
            item.setGsi1pk("WP_PROG#" + tenantId + "#" + programId);
            item.setGsi1sk("WELLNESS_PART#" + joinedAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setProgramId(programId);
        item.setEmployeeId(employeeId);
        item.setJoinedAt(joinedAt);
        return item;
    }
}
