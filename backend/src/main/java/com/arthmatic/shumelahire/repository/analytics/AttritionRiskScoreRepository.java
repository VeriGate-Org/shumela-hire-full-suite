package com.arthmatic.shumelahire.repository.analytics;

import com.arthmatic.shumelahire.entity.analytics.AttritionRiskScore;
import com.arthmatic.shumelahire.entity.analytics.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttritionRiskScoreRepository extends JpaRepository<AttritionRiskScore, Long> {

    List<AttritionRiskScore> findByTenantIdOrderByCalculatedAtDesc(String tenantId);

    List<AttritionRiskScore> findByTenantIdAndRiskLevelOrderByRiskScoreDesc(String tenantId, RiskLevel riskLevel);

    List<AttritionRiskScore> findByTenantIdAndRiskLevelInOrderByRiskScoreDesc(String tenantId, List<RiskLevel> riskLevels);

    List<AttritionRiskScore> findByEmployeeIdOrderByCalculatedAtDesc(Long employeeId);

    void deleteByTenantIdAndEmployeeId(String tenantId, Long employeeId);
}
