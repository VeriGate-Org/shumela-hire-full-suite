package com.arthmatic.shumelahire.repository.training;

import com.arthmatic.shumelahire.entity.training.SessionStatus;
import com.arthmatic.shumelahire.entity.training.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {

    List<TrainingSession> findByCourseId(Long courseId);

    List<TrainingSession> findByStatus(SessionStatus status);

    @Query("SELECT s FROM TrainingSession s WHERE s.status IN ('PLANNED', 'OPEN') " +
           "AND s.startDate > :now ORDER BY s.startDate")
    List<TrainingSession> findUpcomingSessions(@Param("now") LocalDateTime now);

    @Query("SELECT s FROM TrainingSession s WHERE s.startDate >= :start AND s.endDate <= :end ORDER BY s.startDate")
    List<TrainingSession> findByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT s FROM TrainingSession s WHERE s.status = 'OPEN' AND s.availableSeats > 0 ORDER BY s.startDate")
    List<TrainingSession> findOpenWithAvailableSeats();
}
