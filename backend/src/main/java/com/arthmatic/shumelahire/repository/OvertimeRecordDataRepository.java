package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.attendance.OvertimeRecord;
import com.arthmatic.shumelahire.entity.attendance.OvertimeStatus;

import java.util.List;
import java.util.Optional;

public interface OvertimeRecordDataRepository {
    Optional<OvertimeRecord> findById(String id);
    OvertimeRecord save(OvertimeRecord entity);
    List<OvertimeRecord> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<OvertimeRecord> findByEmployeeId(String employeeId);
    List<OvertimeRecord> findByStatus(OvertimeStatus status);
}
