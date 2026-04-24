package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.DocumentRetentionPolicy;
import com.arthmatic.shumelahire.service.DocumentRetentionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/retention-policies")
@FeatureGate("DOCUMENT_RETENTION")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class DocumentRetentionController {

    @Autowired
    private DocumentRetentionService retentionService;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(retentionService.getAllPolicies());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DocumentRetentionPolicy policy) {
        try {
            DocumentRetentionPolicy saved = retentionService.createPolicy(policy);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody DocumentRetentionPolicy policy) {
        try {
            DocumentRetentionPolicy updated = retentionService.updatePolicy(id, policy);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        retentionService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/preview")
    public ResponseEntity<?> preview() {
        return ResponseEntity.ok(retentionService.previewRetention());
    }
}
