package com.arthmatic.shumelahire.controller.performance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.performance.PipCreateRequest;
import com.arthmatic.shumelahire.dto.performance.PipResponse;
import com.arthmatic.shumelahire.service.performance.PipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/performance/pips")
@FeatureGate("PERFORMANCE_PIP")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class PipController {

    @Autowired
    private PipService pipService;

    @PostMapping
    public ResponseEntity<?> createPip(@RequestBody PipCreateRequest request) {
        try {
            PipResponse pip = pipService.createPip(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(pip);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPip(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pipService.getPip(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Page<PipResponse>> getPipsByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(pipService.getPipsByEmployee(employeeId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<Page<PipResponse>> getPipsByManager(
            @PathVariable Long managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(pipService.getPipsByManager(managerId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/active")
    public ResponseEntity<Page<PipResponse>> getActivePips(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(pipService.getActivePips(
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestParam String status,
                                          @RequestParam(required = false) String outcome) {
        try {
            return ResponseEntity.ok(pipService.updatePipStatus(id, status, outcome));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/milestones/{milestoneId}/status")
    public ResponseEntity<?> updateMilestoneStatus(@PathVariable Long milestoneId,
                                                    @RequestParam String status,
                                                    @RequestParam(required = false) String evidence) {
        try {
            pipService.updateMilestoneStatus(milestoneId, status, evidence);
            return ResponseEntity.ok(Map.of("message", "Milestone updated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
