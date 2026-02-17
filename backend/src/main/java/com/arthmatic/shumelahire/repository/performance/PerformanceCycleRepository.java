package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.PerformanceCycle;
import com.arthmatic.shumelahire.entity.performance.CycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceCycleRepository extends JpaRepository<PerformanceCycle, Long> {
    
    Page<PerformanceCycle> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    
    Optional<PerformanceCycle> findByIdAndTenantId(Long id, String tenantId);
    
    List<PerformanceCycle> findByTenantIdAndStatus(String tenantId, CycleStatus status);
    
    Optional<PerformanceCycle> findByTenantIdAndIsDefaultTrue(String tenantId);
    
    @Query("SELECT c FROM PerformanceCycle c WHERE c.tenantId = :tenantId AND c.status = 'ACTIVE'")
    List<PerformanceCycle> findActiveCycles(@Param("tenantId") String tenantId);
    
    boolean existsByNameAndTenantId(String name, String tenantId);
}