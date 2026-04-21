package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.TrainingAttendance;

import java.util.List;
import java.util.Optional;

public interface TrainingAttendanceDataRepository {
    Optional<TrainingAttendance> findById(String id);
    TrainingAttendance save(TrainingAttendance entity);
    List<TrainingAttendance> saveAll(List<TrainingAttendance> entities);
    List<TrainingAttendance> findBySessionId(String sessionId);
    Optional<TrainingAttendance> findBySessionIdAndEmployeeId(String sessionId, String employeeId);
}
