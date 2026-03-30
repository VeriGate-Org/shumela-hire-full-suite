package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.analytics.AttritionRiskScore;
import com.arthmatic.shumelahire.entity.analytics.RiskLevel;

import java.util.List;
import java.util.Optional;

public interface AttritionRiskScoreDataRepository {
    Optional<AttritionRiskScore> findById(String id);
    AttritionRiskScore save(AttritionRiskScore entity);
    List<AttritionRiskScore> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<AttritionRiskScore> findByTenantIdOrderByCalculatedAtDesc(String tenantId);
    List<AttritionRiskScore> findByTenantIdAndRiskLevelOrderByRiskScoreDesc(String tenantId, RiskLevel riskLevel);
    List<AttritionRiskScore> findByTenantIdAndRiskLevelInOrderByRiskScoreDesc(String tenantId, List<RiskLevel> riskLevels);
    List<AttritionRiskScore> findByEmployeeIdOrderByCalculatedAtDesc(String employeeId);
    void deleteByTenantIdAndEmployeeId(String tenantId, String employeeId);
}
