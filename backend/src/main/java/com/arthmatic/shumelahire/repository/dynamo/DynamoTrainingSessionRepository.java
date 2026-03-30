package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.training.TrainingSession;
import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import com.arthmatic.shumelahire.entity.training.SessionStatus;
import com.arthmatic.shumelahire.repository.TrainingSessionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TrainingSessionItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoTrainingSessionRepository extends DynamoRepository<TrainingSessionItem, TrainingSession>
        implements TrainingSessionDataRepository {

    public DynamoTrainingSessionRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, TrainingSessionItem.class);
    }

    @Override
    protected String entityType() {
        return "TRAIN_SESSION";
    }

    @Override
    public List<TrainingSession> findByCourseId(String courseId) {
        String gsi1pk = "TS_COURSE#" + currentTenantId() + "#" + courseId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<TrainingSession> findByStatus(SessionStatus status) {
        return findAll().stream()
                .filter(s -> s.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingSession> findUpcomingSessions() {
        LocalDateTime now = LocalDateTime.now();
        return findAll().stream()
                .filter(s -> s.getStatus() != SessionStatus.CANCELLED && s.getStartDate() != null && s.getStartDate().isAfter(now))
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingSession> findByDateRange(LocalDateTime start, LocalDateTime end) {
        return findAll().stream()
                .filter(s -> s.getStartDate() != null && !s.getStartDate().isBefore(start) && !s.getStartDate().isAfter(end))
                .collect(Collectors.toList());
    }

    @Override
    public List<TrainingSession> findOpenWithAvailableSeats() {
        return findAll().stream()
                .filter(s -> s.getStatus() == SessionStatus.PLANNED && s.getAvailableSeats() != null && s.getAvailableSeats() > 0)
                .collect(Collectors.toList());
    }

    @Override
    protected TrainingSessionItem toItem(TrainingSession entity) {
        TrainingSessionItem item = new TrainingSessionItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("TRAIN_SESSION#" + entity.getId());
        Long courseId = entity.getCourse() != null ? entity.getCourse().getId() : null;
        item.setGsi1pk("TS_COURSE#" + entity.getTenantId() + "#" + (courseId != null ? courseId : ""));
        item.setGsi1sk("TRAIN_SESSION#" + entity.getId());
        item.setId(entity.getId() != null ? String.valueOf(entity.getId()) : null);
        item.setTenantId(entity.getTenantId());
        item.setCourseId(courseId != null ? String.valueOf(courseId) : null);
        item.setTrainerName(entity.getTrainerName());
        item.setLocation(entity.getLocation());
        item.setStartDate(entity.getStartDate() != null ? entity.getStartDate().toInstant(ZoneOffset.UTC) : null);
        item.setEndDate(entity.getEndDate() != null ? entity.getEndDate().toInstant(ZoneOffset.UTC) : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setAvailableSeats(entity.getAvailableSeats());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);
        return item;
    }

    @Override
    protected TrainingSession toEntity(TrainingSessionItem item) {
        TrainingSession entity = new TrainingSession();
        if (item.getId() != null) {
            try { entity.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ignored) {}
        }
        entity.setTenantId(item.getTenantId());
        if (item.getCourseId() != null) {
            TrainingCourse course = new TrainingCourse();
            try { course.setId(Long.parseLong(item.getCourseId())); } catch (NumberFormatException ignored) {}
            entity.setCourse(course);
        }
        entity.setTrainerName(item.getTrainerName());
        entity.setLocation(item.getLocation());
        entity.setStartDate(item.getStartDate() != null ? LocalDateTime.ofInstant(item.getStartDate(), ZoneOffset.UTC) : null);
        entity.setEndDate(item.getEndDate() != null ? LocalDateTime.ofInstant(item.getEndDate(), ZoneOffset.UTC) : null);
        entity.setStatus(item.getStatus() != null ? SessionStatus.valueOf(item.getStatus()) : null);
        entity.setAvailableSeats(item.getAvailableSeats());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);
        return entity;
    }
}
