package com.arthmatic.shumelahire.repository.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    Page<LeaveRequest> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<LeaveRequest> findByEmployeeIdAndStatus(Long employeeId, LeaveRequestStatus status, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.reportingManager.id = :managerId " +
           "AND lr.status = :status ORDER BY lr.createdAt DESC")
    Page<LeaveRequest> findPendingForApprover(
            @Param("managerId") Long managerId,
            @Param("status") LeaveRequestStatus status,
            Pageable pageable);

    Page<LeaveRequest> findByStatus(LeaveRequestStatus status, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status IN ('APPROVED', 'PENDING') " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "ORDER BY lr.startDate")
    List<LeaveRequest> findOverlapping(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
           "AND lr.status IN ('APPROVED', 'PENDING') " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlappingForEmployee(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
           "AND lr.leaveType.id = :leaveTypeId AND lr.status = 'APPROVED' " +
           "AND YEAR(lr.startDate) = :year")
    long countApprovedByEmployeeAndTypeAndYear(
            @Param("employeeId") Long employeeId,
            @Param("leaveTypeId") Long leaveTypeId,
            @Param("year") int year);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status IN ('APPROVED', 'PENDING') " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "AND lr.employee.department = :department ORDER BY lr.startDate")
    List<LeaveRequest> findByDepartmentAndDateRange(
            @Param("department") String department,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
