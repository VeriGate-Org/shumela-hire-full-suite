package com.arthmatic.shumelahire.repository.attendance;

import com.arthmatic.shumelahire.entity.attendance.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    Page<AttendanceRecord> findByEmployeeId(Long employeeId, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.id = :employeeId " +
           "AND a.clockOut IS NULL ORDER BY a.clockIn DESC")
    Optional<AttendanceRecord> findOpenSession(@Param("employeeId") Long employeeId);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.clockIn BETWEEN :start AND :end " +
           "ORDER BY a.clockIn DESC")
    List<AttendanceRecord> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.department = :department " +
           "AND a.clockIn BETWEEN :start AND :end ORDER BY a.clockIn DESC")
    List<AttendanceRecord> findByDepartmentAndDateRange(@Param("department") String department,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
