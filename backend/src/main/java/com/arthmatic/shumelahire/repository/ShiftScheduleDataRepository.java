package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.attendance.ShiftSchedule;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ShiftScheduleDataRepository {
    Optional<ShiftSchedule> findById(String id);
    ShiftSchedule save(ShiftSchedule entity);
    List<ShiftSchedule> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<ShiftSchedule> findByEmployeeIdAndScheduleDateBetween(String employeeId, LocalDate startDate, LocalDate endDate);
    List<ShiftSchedule> findByDateRange(LocalDate start, LocalDate end);
    List<ShiftSchedule> findByDepartmentAndDateRange(String department, LocalDate start, LocalDate end);
}
