package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.PerformanceImprovementPlan;
import com.arthmatic.shumelahire.entity.performance.PipStatus;
import java.util.List;
import java.util.Optional;

public interface PerformanceImprovementPlanDataRepository {
    Optional<PerformanceImprovementPlan> findById(String id);
    PerformanceImprovementPlan save(PerformanceImprovementPlan entity);
    List<PerformanceImprovementPlan> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<PerformanceImprovementPlan> findByEmployeeId(String employeeId);
    List<PerformanceImprovementPlan> findByManagerId(String managerId);
    List<PerformanceImprovementPlan> findByStatus(PipStatus status);
}
