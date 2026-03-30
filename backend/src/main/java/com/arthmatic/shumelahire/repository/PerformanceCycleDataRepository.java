package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.PerformanceCycle;
import com.arthmatic.shumelahire.entity.performance.CycleStatus;
import java.util.List;
import java.util.Optional;

public interface PerformanceCycleDataRepository {
    Optional<PerformanceCycle> findById(String id);
    PerformanceCycle save(PerformanceCycle entity);
    List<PerformanceCycle> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<PerformanceCycle> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    Optional<PerformanceCycle> findByIdAndTenantId(String id, String tenantId);
    List<PerformanceCycle> findByTenantIdAndStatus(String tenantId, CycleStatus status);
    Optional<PerformanceCycle> findByTenantIdAndIsDefaultTrue(String tenantId);
    List<PerformanceCycle> findActiveCycles(String tenantId);
    boolean existsByNameAndTenantId(String name, String tenantId);
}
