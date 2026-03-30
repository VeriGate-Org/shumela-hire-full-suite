package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.leave.LeaveBalance;

import java.util.List;
import java.util.Optional;

public interface LeaveBalanceDataRepository {
    Optional<LeaveBalance> findById(String id);
    LeaveBalance save(LeaveBalance entity);
    List<LeaveBalance> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LeaveBalance> findByEmployeeIdAndCycleYear(String employeeId, Integer cycleYear);
    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndCycleYear(String employeeId, String leaveTypeId, Integer cycleYear);
    List<LeaveBalance> findBalancesForEmployee(String employeeId);
    List<LeaveBalance> findByCycleYear(Integer cycleYear);
}
