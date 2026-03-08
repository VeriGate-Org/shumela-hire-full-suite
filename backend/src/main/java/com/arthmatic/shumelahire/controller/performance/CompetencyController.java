package com.arthmatic.shumelahire.controller.performance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.performance.*;
import com.arthmatic.shumelahire.service.performance.CompetencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/competencies")
@FeatureGate("COMPETENCY_MAPPING")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
public class CompetencyController {

    @Autowired
    private CompetencyService competencyService;

    // Framework endpoints
    @PostMapping("/frameworks")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createFramework(@RequestParam String name,
                                              @RequestParam(required = false) String description) {
        try {
            CompetencyFrameworkResponse framework = competencyService.createFramework(name, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(framework);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/frameworks")
    public ResponseEntity<List<CompetencyFrameworkResponse>> getFrameworks(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        if (activeOnly) {
            return ResponseEntity.ok(competencyService.getActiveFrameworks());
        }
        return ResponseEntity.ok(competencyService.getAllFrameworks());
    }

    @GetMapping("/frameworks/{id}")
    public ResponseEntity<?> getFramework(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(competencyService.getFramework(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/frameworks/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deactivateFramework(@PathVariable Long id) {
        try {
            competencyService.deactivateFramework(id);
            return ResponseEntity.ok(Map.of("message", "Framework deactivated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Competency endpoints
    @PostMapping("/frameworks/{frameworkId}/competencies")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> addCompetency(@PathVariable Long frameworkId,
                                           @RequestParam String name,
                                           @RequestParam(required = false) String description,
                                           @RequestParam(required = false) String category,
                                           @RequestParam(required = false) String proficiencyLevels) {
        try {
            CompetencyResponse competency = competencyService.addCompetency(
                    frameworkId, name, description, category, proficiencyLevels);
            return ResponseEntity.status(HttpStatus.CREATED).body(competency);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/frameworks/{frameworkId}/competencies")
    public ResponseEntity<List<CompetencyResponse>> getCompetenciesByFramework(@PathVariable Long frameworkId) {
        return ResponseEntity.ok(competencyService.getCompetenciesByFramework(frameworkId));
    }

    // Employee Competency endpoints
    @PostMapping("/employees/{employeeId}/assess")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> assessCompetency(@PathVariable Long employeeId,
                                               @RequestParam Long competencyId,
                                               @RequestParam Integer currentLevel,
                                               @RequestParam Integer targetLevel,
                                               @RequestParam(required = false) Long assessorId) {
        try {
            EmployeeCompetencyResponse response = competencyService.assessCompetency(
                    employeeId, competencyId, currentLevel, targetLevel, assessorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<EmployeeCompetencyResponse>> getEmployeeCompetencies(@PathVariable Long employeeId) {
        return ResponseEntity.ok(competencyService.getEmployeeCompetencies(employeeId));
    }

    // Skill Gap Analysis endpoints

    @GetMapping("/gaps/employee/{employeeId}")
    public ResponseEntity<?> getSkillGaps(@PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(competencyService.getSkillGaps(employeeId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/gaps/department/{department}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> getDepartmentGaps(@PathVariable String department) {
        try {
            // Pass department name as-is; service handles lookup
            return ResponseEntity.ok(competencyService.getDepartmentGaps(Long.parseLong(department)));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid department ID"));
        }
    }

    @GetMapping("/training/recommendations/{employeeId}")
    public ResponseEntity<?> getTrainingRecommendations(@PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(competencyService.getTrainingRecommendations(employeeId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
