package com.arthmatic.shumelahire.controller.engagement;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.engagement.*;
import com.arthmatic.shumelahire.service.engagement.SurveyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/engagement/surveys")
@FeatureGate("PULSE_SURVEYS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class SurveyController {

    @Autowired
    private SurveyService surveyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createSurvey(@RequestBody SurveyCreateRequest request,
                                          @RequestParam String createdBy) {
        try {
            SurveyResponse survey = surveyService.createSurvey(request, createdBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(survey);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSurvey(@PathVariable String id) {
        try {
            return ResponseEntity.ok(surveyService.getSurvey(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<SurveyResponse>> getAllSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }

    @GetMapping("/active")
    public ResponseEntity<List<SurveyResponse>> getActiveSurveys() {
        return ResponseEntity.ok(surveyService.getActiveSurveys());
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> activateSurvey(@PathVariable String id) {
        try {
            return ResponseEntity.ok(surveyService.activateSurvey(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> closeSurvey(@PathVariable String id) {
        try {
            return ResponseEntity.ok(surveyService.closeSurvey(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<?> submitResponse(@PathVariable String id,
                                            @RequestBody SurveySubmitRequest request) {
        try {
            surveyService.submitResponse(id, request);
            return ResponseEntity.ok(Map.of("message", "Response submitted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> getSurveyResults(@PathVariable String id) {
        try {
            return ResponseEntity.ok(surveyService.getSurveyResults(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deleteSurvey(@PathVariable String id) {
        try {
            surveyService.deleteSurvey(id);
            return ResponseEntity.ok(Map.of("message", "Survey deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
