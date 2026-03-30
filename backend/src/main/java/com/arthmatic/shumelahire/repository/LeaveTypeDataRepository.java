package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.leave.LeaveType;

import java.util.List;
import java.util.Optional;

public interface LeaveTypeDataRepository {
    Optional<LeaveType> findById(String id);
    LeaveType save(LeaveType entity);
    List<LeaveType> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LeaveType> findByIsActiveTrue();
    Optional<LeaveType> findByCode(String code);
    boolean existsByCode(String code);
}
