package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.labour.Grievance;
import com.arthmatic.shumelahire.entity.labour.GrievanceStatus;

import java.util.List;
import java.util.Optional;

public interface GrievanceDataRepository {
    Optional<Grievance> findById(String id);
    Grievance save(Grievance entity);
    List<Grievance> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Grievance> findByEmployeeId(String employeeId);
    List<Grievance> findByStatus(GrievanceStatus status);
    List<Grievance> findByAssignedToId(String assignedToId);
    long countByStatus(GrievanceStatus status);
}
