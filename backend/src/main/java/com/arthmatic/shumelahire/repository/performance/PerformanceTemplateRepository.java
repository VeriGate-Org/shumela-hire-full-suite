package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.PerformanceTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceTemplateRepository extends JpaRepository<PerformanceTemplate, Long> {
    
    Page<PerformanceTemplate> findByTenantIdAndIsActiveOrderByNameAsc(String tenantId, Boolean isActive, Pageable pageable);
    
    Optional<PerformanceTemplate> findByIdAndTenantId(Long id, String tenantId);
    
    List<PerformanceTemplate> findByDepartmentAndJobLevelAndTenantIdAndIsActive(
            String department, String jobLevel, String tenantId, Boolean isActive);
    
    List<PerformanceTemplate> findByTenantIdAndIsDefaultTrue(String tenantId);
    
    boolean existsByNameAndTenantId(String name, String tenantId);
}