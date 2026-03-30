package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.attendance.AttendanceRecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordDataRepository {
    Optional<AttendanceRecord> findById(String id);
    AttendanceRecord save(AttendanceRecord entity);
    List<AttendanceRecord> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<AttendanceRecord> findByEmployeeId(String employeeId);
    Optional<AttendanceRecord> findOpenSession(String employeeId);
    List<AttendanceRecord> findByDateRange(LocalDateTime start, LocalDateTime end);
    List<AttendanceRecord> findByDepartmentAndDateRange(String department, LocalDateTime start, LocalDateTime end);
}
