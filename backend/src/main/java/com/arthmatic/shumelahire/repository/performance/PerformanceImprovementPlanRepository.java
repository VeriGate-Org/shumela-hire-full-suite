package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.PerformanceImprovementPlan;
import com.arthmatic.shumelahire.entity.performance.PipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceImprovementPlanRepository extends JpaRepository<PerformanceImprovementPlan, Long> {

    Page<PerformanceImprovementPlan> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<PerformanceImprovementPlan> findByManagerId(Long managerId, Pageable pageable);

    List<PerformanceImprovementPlan> findByStatus(PipStatus status);

    Page<PerformanceImprovementPlan> findByStatus(PipStatus status, Pageable pageable);
}
