package com.arthmatic.shumelahire.repository.analytics;

import com.arthmatic.shumelahire.entity.analytics.SuccessionPlan;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuccessionPlanRepository extends JpaRepository<SuccessionPlan, Long> {

    List<SuccessionPlan> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<SuccessionPlan> findByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, SuccessionPlanStatus status);

    List<SuccessionPlan> findByTenantIdAndDepartmentOrderByCreatedAtDesc(String tenantId, String department);

    List<SuccessionPlan> findByCurrentHolderIdOrSuccessorId(Long currentHolderId, Long successorId);
}
