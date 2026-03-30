package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentStatus;

import java.util.List;
import java.util.Optional;

public interface LeaveEncashmentRequestDataRepository {
    Optional<LeaveEncashmentRequest> findById(String id);
    LeaveEncashmentRequest save(LeaveEncashmentRequest entity);
    List<LeaveEncashmentRequest> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LeaveEncashmentRequest> findByEmployeeId(String employeeId);
    List<LeaveEncashmentRequest> findByStatus(LeaveEncashmentStatus status);
    long countByEmployeeIdAndCycleYear(String employeeId, Integer cycleYear);
}
