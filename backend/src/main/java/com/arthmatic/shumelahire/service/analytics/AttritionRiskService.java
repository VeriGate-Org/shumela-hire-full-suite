package com.arthmatic.shumelahire.service.analytics;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.analytics.AttritionRiskScore;
import com.arthmatic.shumelahire.entity.analytics.RiskLevel;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlan;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlanStatus;
import com.arthmatic.shumelahire.entity.analytics.ReadinessLevel;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.AttritionRiskScoreDataRepository;
import com.arthmatic.shumelahire.repository.SuccessionPlanDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class AttritionRiskService {

    private static final Logger logger = LoggerFactory.getLogger(AttritionRiskService.class);

    @Autowired
    private AttritionRiskScoreDataRepository attritionRiskScoreRepository;

    @Autowired
    private SuccessionPlanDataRepository successionPlanRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Calculate attrition risk for all employees in the current tenant.
     * Uses a mock scoring algorithm based on tenure and random factors
     * since the full predictive model is not yet implemented.
     */
    public Map<String, Object> calculateRiskForAllEmployees() {
        String tenantId = TenantContext.requireCurrentTenant();
        logger.info("Calculating attrition risk for tenant: {}", tenantId);

        List<Employee> employees = employeeRepository.findAll();
        int calculated = 0;

        for (Employee employee : employees) {
            BigDecimal score = calculateMockRiskScore(employee);
            RiskLevel level = determineRiskLevel(score);

            AttritionRiskScore riskScore = new AttritionRiskScore();
            riskScore.setEmployee(employee);
            riskScore.setRiskScore(score);
            riskScore.setRiskLevel(level);
            riskScore.setFactors(generateMockFactors(employee, score));
            riskScore.setCalculatedAt(LocalDateTime.now());
            attritionRiskScoreRepository.save(riskScore);
            calculated++;
        }

        auditLogService.logSystemAction("CALCULATE", "ATTRITION_RISK",
                "Calculated attrition risk for " + calculated + " employees");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("employeesProcessed", calculated);
        result.put("calculatedAt", LocalDateTime.now().toString());
        result.put("message", "Attrition risk scores calculated successfully");
        return result;
    }

    /**
     * Get all risk scores for the current tenant.
     */
    @Transactional(readOnly = true)
    public List<AttritionRiskScore> getAllRiskScores() {
        String tenantId = TenantContext.requireCurrentTenant();
        auditLogService.logSystemAction("VIEW", "ATTRITION_RISK", "Viewing all attrition risk scores");
        return attritionRiskScoreRepository.findByTenantIdOrderByCalculatedAtDesc(tenantId);
    }

    /**
     * Get high-risk employees (HIGH and CRITICAL).
     */
    @Transactional(readOnly = true)
    public List<AttritionRiskScore> getHighRiskEmployees() {
        String tenantId = TenantContext.requireCurrentTenant();
        return attritionRiskScoreRepository.findByTenantIdAndRiskLevelInOrderByRiskScoreDesc(
                tenantId, List.of(RiskLevel.HIGH, RiskLevel.CRITICAL));
    }

    /**
     * Get all succession plans for the current tenant.
     */
    @Transactional(readOnly = true)
    public List<SuccessionPlan> getAllSuccessionPlans() {
        String tenantId = TenantContext.requireCurrentTenant();
        auditLogService.logSystemAction("VIEW", "SUCCESSION_PLAN", "Viewing all succession plans");
        return successionPlanRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    /**
     * Create a new succession plan.
     */
    public SuccessionPlan createSuccessionPlan(Map<String, Object> request) {
        String tenantId = TenantContext.requireCurrentTenant();
        logger.info("Creating succession plan for tenant: {}", tenantId);

        SuccessionPlan plan = new SuccessionPlan();
        plan.setPositionTitle((String) request.get("positionTitle"));
        plan.setDepartment((String) request.get("department"));

        if (request.get("currentHolderId") != null) {
            Long currentHolderId = Long.valueOf(request.get("currentHolderId").toString());
            Employee currentHolder = employeeRepository.findById(String.valueOf(currentHolderId))
                    .orElseThrow(() -> new RuntimeException("Current holder not found: " + currentHolderId));
            plan.setCurrentHolder(currentHolder);
        }

        if (request.get("successorId") != null) {
            Long successorId = Long.valueOf(request.get("successorId").toString());
            Employee successor = employeeRepository.findById(String.valueOf(successorId))
                    .orElseThrow(() -> new RuntimeException("Successor not found: " + successorId));
            plan.setSuccessor(successor);
        }

        String readinessStr = (String) request.get("readinessLevel");
        if (readinessStr != null) {
            plan.setReadinessLevel(ReadinessLevel.valueOf(readinessStr));
        } else {
            plan.setReadinessLevel(ReadinessLevel.DEVELOPMENT_NEEDED);
        }

        plan.setDevelopmentActions((String) request.get("developmentActions"));

        String statusStr = (String) request.get("status");
        if (statusStr != null) {
            plan.setStatus(SuccessionPlanStatus.valueOf(statusStr));
        }

        SuccessionPlan saved = successionPlanRepository.save(plan);

        auditLogService.logSystemAction("CREATE", "SUCCESSION_PLAN",
                "Created succession plan for position: " + plan.getPositionTitle());

        return saved;
    }

    // ==================== Private Helpers ====================

    private BigDecimal calculateMockRiskScore(Employee employee) {
        double baseScore = 0.3;

        // Tenure factor: newer employees have higher risk
        if (employee.getHireDate() != null) {
            long tenureMonths = ChronoUnit.MONTHS.between(employee.getHireDate(), LocalDate.now());
            if (tenureMonths < 6) {
                baseScore += 0.25;
            } else if (tenureMonths < 12) {
                baseScore += 0.15;
            } else if (tenureMonths < 24) {
                baseScore += 0.05;
            } else {
                baseScore -= 0.1;
            }
        }

        // Add some controlled randomness for realistic variation
        Random random = new Random(employee.getId() != null ? employee.getId() : 0);
        double randomFactor = (random.nextDouble() * 0.4) - 0.2; // -0.2 to +0.2
        baseScore += randomFactor;

        // Clamp between 0.0 and 1.0
        baseScore = Math.max(0.0, Math.min(1.0, baseScore));

        return BigDecimal.valueOf(baseScore).setScale(2, RoundingMode.HALF_UP);
    }

    private RiskLevel determineRiskLevel(BigDecimal score) {
        double val = score.doubleValue();
        if (val >= 0.80) return RiskLevel.CRITICAL;
        if (val >= 0.60) return RiskLevel.HIGH;
        if (val >= 0.35) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private String generateMockFactors(Employee employee, BigDecimal score) {
        List<String> factors = new ArrayList<>();

        if (employee.getHireDate() != null) {
            long tenureMonths = ChronoUnit.MONTHS.between(employee.getHireDate(), LocalDate.now());
            if (tenureMonths < 12) {
                factors.add("Short tenure (" + tenureMonths + " months)");
            }
        }

        if (score.doubleValue() >= 0.6) {
            factors.add("Low recent engagement survey score");
            factors.add("No promotion in 2+ years");
        }
        if (score.doubleValue() >= 0.4) {
            factors.add("Peer departures in department");
        }
        if (score.doubleValue() < 0.3) {
            factors.add("Strong team engagement");
            factors.add("Recent positive performance review");
        }

        return String.join("; ", factors);
    }
}
