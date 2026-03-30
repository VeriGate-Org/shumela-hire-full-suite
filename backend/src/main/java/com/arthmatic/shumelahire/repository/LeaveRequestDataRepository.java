package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LeaveRequestDataRepository {
    Optional<LeaveRequest> findById(String id);
    LeaveRequest save(LeaveRequest entity);
    List<LeaveRequest> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LeaveRequest> findByEmployeeId(String employeeId);
    List<LeaveRequest> findByEmployeeIdAndStatus(String employeeId, LeaveRequestStatus status);
    List<LeaveRequest> findPendingForApprover(String approverId);
    List<LeaveRequest> findByStatus(LeaveRequestStatus status);
    List<LeaveRequest> findOverlapping(String employeeId, LocalDate startDate, LocalDate endDate);
    List<LeaveRequest> findOverlappingForEmployee(String employeeId, LocalDate startDate, LocalDate endDate);
    long countApprovedByEmployeeAndTypeAndYear(String employeeId, String leaveTypeId, int year);
    List<LeaveRequest> findByDepartmentAndDateRange(String department, LocalDate startDate, LocalDate endDate);
    List<LeaveRequest> findAllOverlapping(LocalDate startDate, LocalDate endDate);
}
