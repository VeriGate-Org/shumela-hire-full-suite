package com.arthmatic.shumelahire.controller.training;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.training.IDPGoal;
import com.arthmatic.shumelahire.entity.training.IndividualDevelopmentPlan;
import com.arthmatic.shumelahire.repository.IDPDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training/idps")
@FeatureGate("TRAINING_MANAGEMENT")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class IDPController {

    private static final Logger logger = LoggerFactory.getLogger(IDPController.class);

    @Autowired
    private IDPDataRepository idpRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getIDPs(@RequestParam(required = false) Long employeeId,
                                     @RequestParam(required = false) Long managerId) {
        if (employeeId != null) {
            return ResponseEntity.ok(idpRepository.findByEmployeeId(String.valueOf(employeeId)));
        }
        if (managerId != null) {
            return ResponseEntity.ok(idpRepository.findByManagerId(String.valueOf(managerId)));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getIDP(@PathVariable Long id) {
        return idpRepository.findById(String.valueOf(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createIDP(@RequestBody IndividualDevelopmentPlan plan) {
        try {
            IndividualDevelopmentPlan saved = idpRepository.save(plan);
            auditLogService.saveLog(plan.getEmployeeId().toString(), "CREATE", "IDP",
                    saved.getId().toString(), "Created IDP: " + saved.getTitle());
            logger.info("Created IDP '{}' for employee {}", saved.getTitle(), saved.getEmployeeId());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIDP(@PathVariable Long id,
                                       @RequestBody IndividualDevelopmentPlan request) {
        try {
            IndividualDevelopmentPlan plan = idpRepository.findById(String.valueOf(id))
                    .orElseThrow(() -> new IllegalArgumentException("IDP not found: " + id));
            if (request.getTitle() != null) plan.setTitle(request.getTitle());
            if (request.getDescription() != null) plan.setDescription(request.getDescription());
            if (request.getStartDate() != null) plan.setStartDate(request.getStartDate());
            if (request.getTargetDate() != null) plan.setTargetDate(request.getTargetDate());
            if (request.getStatus() != null) plan.setStatus(request.getStatus());
            if (request.getGoals() != null) plan.setGoals(request.getGoals());
            plan.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(idpRepository.save(plan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIDP(@PathVariable Long id) {
        idpRepository.deleteById(String.valueOf(id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/goals")
    public ResponseEntity<?> addGoal(@PathVariable Long id,
                                     @RequestBody IDPGoal goal) {
        try {
            IndividualDevelopmentPlan plan = idpRepository.findById(String.valueOf(id))
                    .orElseThrow(() -> new IllegalArgumentException("IDP not found: " + id));
            goal.setPlanId(id);
            if (plan.getGoals() == null) plan.setGoals(new ArrayList<>());
            plan.getGoals().add(goal);
            plan.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.CREATED).body(idpRepository.save(plan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{planId}/goals/{goalId}")
    public ResponseEntity<?> updateGoal(@PathVariable Long planId,
                                        @PathVariable Long goalId,
                                        @RequestBody Map<String, Object> request) {
        try {
            IndividualDevelopmentPlan plan = idpRepository.findById(String.valueOf(planId))
                    .orElseThrow(() -> new IllegalArgumentException("IDP not found: " + planId));
            if (plan.getGoals() != null) {
                for (IDPGoal goal : plan.getGoals()) {
                    if (goal.getId().equals(goalId)) {
                        if (request.containsKey("status")) {
                            goal.setStatus(IDPGoal.GoalStatus.valueOf((String) request.get("status")));
                        }
                        if (request.containsKey("title")) {
                            goal.setTitle((String) request.get("title"));
                        }
                        goal.setUpdatedAt(LocalDateTime.now());
                        break;
                    }
                }
            }
            plan.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(idpRepository.save(plan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
