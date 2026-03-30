package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.analytics.SuccessionPlan;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlanStatus;

import java.util.List;
import java.util.Optional;

public interface SuccessionPlanDataRepository {
    Optional<SuccessionPlan> findById(String id);
    SuccessionPlan save(SuccessionPlan entity);
    List<SuccessionPlan> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SuccessionPlan> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<SuccessionPlan> findByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, SuccessionPlanStatus status);
    List<SuccessionPlan> findByTenantIdAndDepartmentOrderByCreatedAtDesc(String tenantId, String department);
    List<SuccessionPlan> findByCurrentHolderIdOrSuccessorId(String currentHolderId, String successorId);
}
