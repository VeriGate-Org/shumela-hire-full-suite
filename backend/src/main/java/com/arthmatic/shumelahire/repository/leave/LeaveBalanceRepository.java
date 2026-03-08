package com.arthmatic.shumelahire.repository.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeIdAndCycleYear(Long employeeId, Integer cycleYear);

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndCycleYear(
            Long employeeId, Long leaveTypeId, Integer cycleYear);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.employee.id = :employeeId " +
           "AND lb.cycleYear = :cycleYear ORDER BY lb.leaveType.name")
    List<LeaveBalance> findBalancesForEmployee(
            @Param("employeeId") Long employeeId,
            @Param("cycleYear") Integer cycleYear);

    List<LeaveBalance> findByCycleYear(Integer cycleYear);
}
