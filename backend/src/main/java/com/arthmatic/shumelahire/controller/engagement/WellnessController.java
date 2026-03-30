package com.arthmatic.shumelahire.controller.engagement;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.engagement.WellnessProgramCreateRequest;
import com.arthmatic.shumelahire.dto.engagement.WellnessProgramResponse;
import com.arthmatic.shumelahire.service.engagement.WellnessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/engagement/wellness")
@FeatureGate("WELLNESS_PROGRAMS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class WellnessController {

    @Autowired
    private WellnessService wellnessService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createProgram(@RequestBody WellnessProgramCreateRequest request) {
        try {
            WellnessProgramResponse program = wellnessService.createProgram(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(program);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateProgram(@PathVariable Long id,
                                           @RequestBody WellnessProgramCreateRequest request) {
        try {
            return ResponseEntity.ok(wellnessService.updateProgram(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProgram(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(wellnessService.getProgram(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<WellnessProgramResponse>> getAllPrograms() {
        return ResponseEntity.ok(wellnessService.getAllPrograms());
    }

    @GetMapping("/active")
    public ResponseEntity<List<WellnessProgramResponse>> getActivePrograms() {
        return ResponseEntity.ok(wellnessService.getActivePrograms());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinProgram(@PathVariable Long id, @RequestParam Long employeeId) {
        try {
            wellnessService.joinProgram(id, employeeId);
            return ResponseEntity.ok(Map.of("message", "Successfully joined program"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveProgram(@PathVariable Long id, @RequestParam Long employeeId) {
        try {
            wellnessService.leaveProgram(id, employeeId);
            return ResponseEntity.ok(Map.of("message", "Successfully left program"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deactivateProgram(@PathVariable Long id) {
        try {
            wellnessService.deactivateProgram(id);
            return ResponseEntity.ok(Map.of("message", "Program deactivated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
