package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.TrainingEnrollment;
import com.arthmatic.shumelahire.entity.training.EnrollmentStatus;

import java.util.List;
import java.util.Optional;

public interface TrainingEnrollmentDataRepository {
    Optional<TrainingEnrollment> findById(String id);
    TrainingEnrollment save(TrainingEnrollment entity);
    List<TrainingEnrollment> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<TrainingEnrollment> findBySessionId(String sessionId);
    List<TrainingEnrollment> findByEmployeeId(String employeeId);
    List<TrainingEnrollment> findByEmployeeIdAndStatus(String employeeId, EnrollmentStatus status);
    Optional<TrainingEnrollment> findBySessionIdAndEmployeeId(String sessionId, String employeeId);
    long countActiveEnrollmentsBySession(String sessionId);
    long countCompleted();
    long countCompletedByEmployee(String employeeId);
    List<TrainingEnrollment> findByEmployeeWithDetails(String employeeId);
}
