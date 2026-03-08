package com.arthmatic.shumelahire.controller.analytics;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.analytics.AttritionRiskScore;
import com.arthmatic.shumelahire.entity.analytics.SuccessionPlan;
import com.arthmatic.shumelahire.service.analytics.AttritionRiskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@FeatureGate("PREDICTIVE_ANALYTICS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class PredictiveAnalyticsController {

    @Autowired
    private AttritionRiskService attritionRiskService;

    @GetMapping("/attrition-risk")
    public ResponseEntity<List<Map<String, Object>>> getAttritionRiskScores() {
        List<AttritionRiskScore> scores = attritionRiskService.getAllRiskScores();
        List<Map<String, Object>> response = scores.stream()
                .map(this::mapRiskScore)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/attrition-risk/calculate")
    public ResponseEntity<Map<String, Object>> calculateAttritionRisk() {
        Map<String, Object> result = attritionRiskService.calculateRiskForAllEmployees();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/attrition-risk/high")
    public ResponseEntity<List<Map<String, Object>>> getHighRiskEmployees() {
        List<AttritionRiskScore> scores = attritionRiskService.getHighRiskEmployees();
        List<Map<String, Object>> response = scores.stream()
                .map(this::mapRiskScore)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/succession-plans")
    public ResponseEntity<List<Map<String, Object>>> getSuccessionPlans() {
        List<SuccessionPlan> plans = attritionRiskService.getAllSuccessionPlans();
        List<Map<String, Object>> response = plans.stream()
                .map(this::mapSuccessionPlan)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/succession-plans")
    public ResponseEntity<Map<String, Object>> createSuccessionPlan(
            @RequestBody Map<String, Object> request) {
        SuccessionPlan plan = attritionRiskService.createSuccessionPlan(request);
        return ResponseEntity.ok(mapSuccessionPlan(plan));
    }

    // ==================== Mapping Helpers ====================

    private Map<String, Object> mapRiskScore(AttritionRiskScore score) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", score.getId());
        map.put("employeeId", score.getEmployee() != null ? score.getEmployee().getId() : null);
        map.put("employeeName", score.getEmployee() != null
                ? score.getEmployee().getFirstName() + " " + score.getEmployee().getLastName()
                : "Unknown");
        map.put("department", score.getEmployee() != null ? score.getEmployee().getDepartment() : null);
        map.put("riskScore", score.getRiskScore());
        map.put("riskLevel", score.getRiskLevel().name());
        map.put("factors", score.getFactors());
        map.put("calculatedAt", score.getCalculatedAt() != null ? score.getCalculatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> mapSuccessionPlan(SuccessionPlan plan) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", plan.getId());
        map.put("positionTitle", plan.getPositionTitle());
        map.put("department", plan.getDepartment());
        map.put("currentHolderId", plan.getCurrentHolder() != null ? plan.getCurrentHolder().getId() : null);
        map.put("currentHolderName", plan.getCurrentHolder() != null
                ? plan.getCurrentHolder().getFirstName() + " " + plan.getCurrentHolder().getLastName()
                : null);
        map.put("successorId", plan.getSuccessor() != null ? plan.getSuccessor().getId() : null);
        map.put("successorName", plan.getSuccessor() != null
                ? plan.getSuccessor().getFirstName() + " " + plan.getSuccessor().getLastName()
                : null);
        map.put("readinessLevel", plan.getReadinessLevel().name());
        map.put("developmentActions", plan.getDevelopmentActions());
        map.put("status", plan.getStatus().name());
        map.put("createdAt", plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : null);
        map.put("updatedAt", plan.getUpdatedAt() != null ? plan.getUpdatedAt().toString() : null);
        return map;
    }
}
