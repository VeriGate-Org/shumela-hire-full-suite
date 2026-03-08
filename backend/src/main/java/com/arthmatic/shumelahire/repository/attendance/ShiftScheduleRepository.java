package com.arthmatic.shumelahire.repository.attendance;

import com.arthmatic.shumelahire.entity.attendance.ShiftSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftScheduleRepository extends JpaRepository<ShiftSchedule, Long> {

    List<ShiftSchedule> findByEmployeeIdAndScheduleDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT ss FROM ShiftSchedule ss WHERE ss.scheduleDate BETWEEN :start AND :end " +
           "ORDER BY ss.scheduleDate, ss.employee.lastName")
    List<ShiftSchedule> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT ss FROM ShiftSchedule ss WHERE ss.employee.department = :department " +
           "AND ss.scheduleDate BETWEEN :start AND :end ORDER BY ss.scheduleDate")
    List<ShiftSchedule> findByDepartmentAndDateRange(@Param("department") String department,
            @Param("start") LocalDate start, @Param("end") LocalDate end);
}
