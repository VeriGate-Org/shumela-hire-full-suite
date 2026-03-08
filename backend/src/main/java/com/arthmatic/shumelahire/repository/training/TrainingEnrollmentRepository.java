package com.arthmatic.shumelahire.repository.training;

import com.arthmatic.shumelahire.entity.training.EnrollmentStatus;
import com.arthmatic.shumelahire.entity.training.TrainingEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingEnrollmentRepository extends JpaRepository<TrainingEnrollment, Long> {

    List<TrainingEnrollment> findBySessionId(Long sessionId);

    List<TrainingEnrollment> findByEmployeeId(Long employeeId);

    List<TrainingEnrollment> findByEmployeeIdAndStatus(Long employeeId, EnrollmentStatus status);

    Optional<TrainingEnrollment> findBySessionIdAndEmployeeId(Long sessionId, Long employeeId);

    @Query("SELECT COUNT(e) FROM TrainingEnrollment e WHERE e.session.id = :sessionId " +
           "AND e.status NOT IN ('CANCELLED', 'NO_SHOW')")
    long countActiveEnrollmentsBySession(@Param("sessionId") Long sessionId);

    @Query("SELECT COUNT(e) FROM TrainingEnrollment e WHERE e.status = 'COMPLETED'")
    long countCompleted();

    @Query("SELECT COUNT(e) FROM TrainingEnrollment e WHERE e.employee.id = :employeeId AND e.status = 'COMPLETED'")
    long countCompletedByEmployee(@Param("employeeId") Long employeeId);

    @Query("SELECT e FROM TrainingEnrollment e JOIN FETCH e.session s JOIN FETCH s.course " +
           "WHERE e.employee.id = :employeeId ORDER BY e.enrolledAt DESC")
    List<TrainingEnrollment> findByEmployeeWithDetails(@Param("employeeId") Long employeeId);
}
