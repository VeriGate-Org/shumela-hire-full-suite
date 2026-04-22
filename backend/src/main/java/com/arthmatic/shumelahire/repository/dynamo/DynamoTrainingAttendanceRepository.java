package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.TrainingAttendance;
import com.arthmatic.shumelahire.repository.TrainingAttendanceDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TrainingAttendanceItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
public class DynamoTrainingAttendanceRepository extends DynamoRepository<TrainingAttendanceItem, TrainingAttendance>
        implements TrainingAttendanceDataRepository {

    public DynamoTrainingAttendanceRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, TrainingAttendanceItem.class);
    }

    @Override
    protected String entityType() {
        return "TRAINING_ATTEND";
    }

    @Override
    public List<TrainingAttendance> findBySessionId(String sessionId) {
        String gsi1pk = "TA_SESS#" + currentTenantId() + "#" + sessionId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public Optional<TrainingAttendance> findBySessionIdAndEmployeeId(String sessionId, String employeeId) {
        return findBySessionId(sessionId).stream()
                .filter(a -> a.getEmployeeId() != null && employeeId.equals(String.valueOf(a.getEmployeeId())))
                .findFirst();
    }

    @Override
    protected TrainingAttendanceItem toItem(TrainingAttendance entity) {
        TrainingAttendanceItem item = new TrainingAttendanceItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("TRAINING_ATTEND#" + id);

        String sessionId = entity.getSessionId() != null ? String.valueOf(entity.getSessionId()) : "";
        item.setGsi1pk("TA_SESS#" + tenantId + "#" + sessionId);
        item.setGsi1sk("TRAINING_ATTEND#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setSessionId(entity.getSessionId() != null ? String.valueOf(entity.getSessionId()) : null);
        item.setEnrollmentId(entity.getEnrollmentId() != null ? String.valueOf(entity.getEnrollmentId()) : null);
        item.setEmployeeId(entity.getEmployeeId() != null ? String.valueOf(entity.getEmployeeId()) : null);
        item.setAttended(entity.getAttended());
        item.setCheckInTime(entity.getCheckInTime() != null ? entity.getCheckInTime().toInstant(ZoneOffset.UTC) : null);
        item.setNotes(entity.getNotes());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected TrainingAttendance toEntity(TrainingAttendanceItem item) {
        TrainingAttendance entity = new TrainingAttendance();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setSessionId(item.getSessionId() != null ? safeParseLong(item.getSessionId()) : null);
        entity.setEnrollmentId(item.getEnrollmentId() != null ? safeParseLong(item.getEnrollmentId()) : null);
        entity.setEmployeeId(item.getEmployeeId() != null ? safeParseLong(item.getEmployeeId()) : null);
        entity.setAttended(item.getAttended());
        entity.setCheckInTime(item.getCheckInTime() != null ? LocalDateTime.ofInstant(item.getCheckInTime(), ZoneOffset.UTC) : null);
        entity.setNotes(item.getNotes());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
