package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.PerformanceContract;
import com.arthmatic.shumelahire.entity.performance.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceContractRepository extends JpaRepository<PerformanceContract, Long> {
    
    Page<PerformanceContract> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    
    Optional<PerformanceContract> findByIdAndTenantId(Long id, String tenantId);
    
    Page<PerformanceContract> findByCycleIdAndTenantId(Long cycleId, String tenantId, Pageable pageable);
    
    Page<PerformanceContract> findByEmployeeIdAndTenantId(String employeeId, String tenantId, Pageable pageable);
    
    Page<PerformanceContract> findByManagerIdAndTenantId(String managerId, String tenantId, Pageable pageable);
    
    List<PerformanceContract> findByEmployeeIdAndTenantIdOrderByCreatedAtDesc(String employeeId, String tenantId);
    
    @Query("SELECT COUNT(c) FROM PerformanceContract c WHERE c.cycle.id = :cycleId AND c.tenantId = :tenantId AND c.status = :status")
    long countByCycleIdAndTenantIdAndStatus(@Param("cycleId") Long cycleId,
                                           @Param("tenantId") String tenantId,
                                           @Param("status") ContractStatus status);
    
    boolean existsByEmployeeIdAndCycleIdAndTenantId(String employeeId, Long cycleId, String tenantId);
}