package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.TrainingEnrollment;
import com.arthmatic.shumelahire.entity.training.TrainingSession;
import com.arthmatic.shumelahire.entity.training.EnrollmentStatus;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.repository.TrainingEnrollmentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TrainingEnrollmentItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoTrainingEnrollmentRepository extends DynamoRepository<TrainingEnrollmentItem, TrainingEnrollment>
        implements TrainingEnrollmentDataRepository {

    public DynamoTrainingEnrollmentRepository(DynamoDbClient dynamoDbClient,
                                              DynamoDbEnhancedClient enhancedClient,
                                              @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, TrainingEnrollmentItem.class);
    }

    @Override
    protected String entityType() {
        return "TRAIN_ENROLL";
    }

    @Override
    public List<TrainingEnrollment> findBySessionId(String sessionId) {
        return findAll().stream()
                .filter(e -> e.getSession() != null && sessionId.equals(e.getSession().getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingEnrollment> findByEmployeeId(String employeeId) {
        String gsi1pk = "TE_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<TrainingEnrollment> findByEmployeeIdAndStatus(String employeeId, EnrollmentStatus status) {
        return findByEmployeeId(employeeId).stream()
                .filter(e -> e.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TrainingEnrollment> findBySessionIdAndEmployeeId(String sessionId, String employeeId) {
        return findAll().stream()
                .filter(e -> e.getSession() != null && sessionId.equals(e.getSession().getId()) &&
                        e.getEmployee() != null && employeeId.equals(e.getEmployee().getId()))
                .findFirst();
    }

    @Override
    public long countActiveEnrollmentsBySession(String sessionId) {
        return findAll().stream()
                .filter(e -> e.getSession() != null && sessionId.equals(e.getSession().getId()) &&
                        e.getStatus() == EnrollmentStatus.REGISTERED)
                .count();
    }

    @Override
    public long countCompleted() {
        return findAll().stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED)
                .count();
    }

    @Override
    public long countCompletedByEmployee(String employeeId) {
        return findByEmployeeId(employeeId).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED)
                .count();
    }

    @Override
    public List<TrainingEnrollment> findByEmployeeWithDetails(String employeeId) {
        return findByEmployeeId(employeeId);
    }

    @Override
    protected TrainingEnrollmentItem toItem(TrainingEnrollment entity) {
        TrainingEnrollmentItem item = new TrainingEnrollmentItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("TRAIN_ENROLL#" + entity.getId());
        String employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        item.setGsi1pk("TE_EMP#" + entity.getTenantId() + "#" + (employeeId != null ? employeeId : ""));
        item.setGsi1sk("TRAIN_ENROLL#" + entity.getId());
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());
        item.setSessionId(entity.getSession() != null && entity.getSession().getId() != null
                ? entity.getSession().getId() : null);
        item.setEmployeeId(employeeId != null ? employeeId : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setScore(entity.getScore() != null ? entity.getScore().toPlainString() : null);
        item.setCertificateUrl(entity.getCertificateUrl());
        item.setEnrolledAt(entity.getEnrolledAt() != null ? entity.getEnrolledAt().toInstant(ZoneOffset.UTC) : null);
        item.setCompletedAt(entity.getCompletedAt() != null ? entity.getCompletedAt().toInstant(ZoneOffset.UTC) : null);
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected TrainingEnrollment toEntity(TrainingEnrollmentItem item) {
        TrainingEnrollment entity = new TrainingEnrollment();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        if (item.getSessionId() != null) {
            TrainingSession session = new TrainingSession();
            session.setId(item.getSessionId());
            entity.setSession(session);
        }
        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }
        entity.setStatus(item.getStatus() != null ? EnrollmentStatus.valueOf(item.getStatus()) : null);
        entity.setScore(item.getScore() != null ? new BigDecimal(item.getScore()) : null);
        entity.setCertificateUrl(item.getCertificateUrl());
        entity.setEnrolledAt(item.getEnrolledAt() != null ? LocalDateTime.ofInstant(item.getEnrolledAt(), ZoneOffset.UTC) : null);
        entity.setCompletedAt(item.getCompletedAt() != null ? LocalDateTime.ofInstant(item.getCompletedAt(), ZoneOffset.UTC) : null);
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
