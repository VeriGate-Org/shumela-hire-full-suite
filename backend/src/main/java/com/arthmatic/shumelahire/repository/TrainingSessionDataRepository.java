package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.TrainingSession;
import com.arthmatic.shumelahire.entity.training.SessionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TrainingSessionDataRepository {
    Optional<TrainingSession> findById(String id);
    TrainingSession save(TrainingSession entity);
    List<TrainingSession> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<TrainingSession> findByCourseId(String courseId);
    List<TrainingSession> findByStatus(SessionStatus status);
    List<TrainingSession> findUpcomingSessions();
    List<TrainingSession> findByDateRange(LocalDateTime start, LocalDateTime end);
    List<TrainingSession> findOpenWithAvailableSeats();
}
