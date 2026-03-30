package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.PerformanceTemplate;
import java.util.List;
import java.util.Optional;

public interface PerformanceTemplateDataRepository {
    Optional<PerformanceTemplate> findById(String id);
    PerformanceTemplate save(PerformanceTemplate entity);
    List<PerformanceTemplate> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<PerformanceTemplate> findByTenantIdAndIsActiveOrderByNameAsc(String tenantId);
    Optional<PerformanceTemplate> findByIdAndTenantId(String id, String tenantId);
    List<PerformanceTemplate> findByDepartmentAndJobLevelAndTenantIdAndIsActive(String department, String jobLevel, String tenantId);
    Optional<PerformanceTemplate> findByTenantIdAndIsDefaultTrue(String tenantId);
    boolean existsByNameAndTenantId(String name, String tenantId);
}
