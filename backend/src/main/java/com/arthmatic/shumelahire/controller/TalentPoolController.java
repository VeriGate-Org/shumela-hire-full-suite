package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.AddTalentPoolEntryRequest;
import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.service.TalentPoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/talent-pools")
public class TalentPoolController {

    @Autowired
    private TalentPoolService talentPoolService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> createPool(@RequestBody TalentPool pool) {
        return ResponseEntity.status(HttpStatus.CREATED).body(talentPoolService.createPool(pool));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getAllPools() {
        return ResponseEntity.ok(talentPoolService.getAllPools());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getPool(@PathVariable String id) {
        return ResponseEntity.ok(talentPoolService.getPool(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> updatePool(@PathVariable String id, @RequestBody TalentPool pool) {
        return ResponseEntity.ok(talentPoolService.updatePool(id, pool));
    }

    @PostMapping("/{poolId}/entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> addEntry(
            @PathVariable String poolId,
            @RequestBody AddTalentPoolEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                talentPoolService.addEntry(poolId, request.getApplicantId(), request.getSourceType(), request.getNotes()));
    }

    @GetMapping("/{poolId}/entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getEntries(@PathVariable String poolId) {
        return ResponseEntity.ok(talentPoolService.getEntries(poolId));
    }

    @DeleteMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> removeEntry(
            @PathVariable String id,
            @RequestParam(defaultValue = "Removed by user") String reason) {
        talentPoolService.removeEntry(id, reason);
        return ResponseEntity.ok(Map.of("message", "Entry removed"));
    }

    @PutMapping("/entries/{id}/rating")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> updateRating(
            @PathVariable String id,
            @RequestBody Map<String, Integer> request) {
        return ResponseEntity.ok(talentPoolService.updateRating(id, request.get("rating")));
    }

    @GetMapping("/{poolId}/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getPoolAnalytics(@PathVariable String poolId) {
        return ResponseEntity.ok(talentPoolService.getPoolAnalytics(poolId));
    }
}
