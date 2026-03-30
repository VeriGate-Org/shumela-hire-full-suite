package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.leave.LeavePolicy;

import java.util.List;
import java.util.Optional;

public interface LeavePolicyDataRepository {
    Optional<LeavePolicy> findById(String id);
    LeavePolicy save(LeavePolicy entity);
    List<LeavePolicy> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LeavePolicy> findByLeaveTypeId(String leaveTypeId);
    List<LeavePolicy> findByIsActiveTrue();
    List<LeavePolicy> findByLeaveTypeIdAndIsActiveTrue(String leaveTypeId);
}
