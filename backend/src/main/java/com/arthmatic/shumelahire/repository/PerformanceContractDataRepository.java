package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.PerformanceContract;
import com.arthmatic.shumelahire.entity.performance.ContractStatus;
import java.util.List;
import java.util.Optional;

public interface PerformanceContractDataRepository {
    Optional<PerformanceContract> findById(String id);
    PerformanceContract save(PerformanceContract entity);
    List<PerformanceContract> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<PerformanceContract> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    Optional<PerformanceContract> findByIdAndTenantId(String id, String tenantId);
    List<PerformanceContract> findByCycleIdAndTenantId(String cycleId, String tenantId);
    List<PerformanceContract> findByEmployeeIdAndTenantId(String employeeId, String tenantId);
    List<PerformanceContract> findByManagerIdAndTenantId(String managerId, String tenantId);
    List<PerformanceContract> findByEmployeeIdAndTenantIdOrderByCreatedAtDesc(String employeeId, String tenantId);
    long countByCycleIdAndTenantIdAndStatus(String cycleId, String tenantId, ContractStatus status);
    boolean existsByEmployeeIdAndCycleIdAndTenantId(String employeeId, String cycleId, String tenantId);
}
