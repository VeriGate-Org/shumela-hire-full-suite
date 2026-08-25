package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.AddTalentPoolEntryRequest;
import com.arthmatic.shumelahire.entity.TalentPool;
import com.arthmatic.shumelahire.service.TalentPoolRetentionService;
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

    @Autowired
    private TalentPoolRetentionService retentionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> createPool(@RequestBody TalentPool pool) {
        return ResponseEntity.status(HttpStatus.CREATED).body(talentPoolService.createPool(pool));
    }

    /**
     * Every pool, with its contents described.
     *
     * <p>This used to return the raw {@code TalentPool} entity, which says nothing about who is in
     * the pool. It now returns {@link com.arthmatic.shumelahire.dto.TalentPoolResponse} — count,
     * source split, median entry age — because a pool's value is its freshness and none of that was
     * ever on the wire.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getAllPools() {
        return ResponseEntity.ok(talentPoolService.getAllPoolsDetailed());
    }

    /**
     * Counts across every pool.
     * GET /api/talent-pools/summary
     *
     * <p>Separate from the list so the figures describe every pool rather than the ones on screen.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> summary() {
        return ResponseEntity.ok(talentPoolService.summary());
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

    /**
     * Record that somebody made contact with this candidate.
     * POST /api/talent-pools/entries/{id}/contact
     *
     * <p><b>Nothing could write {@code lastContactedAt} before this.</b> The field existed on the
     * entity and the DynamoDB mapper persisted it, but no service ever set it, so it was null on
     * every record. That was harmless while nothing read it and becomes a real problem now that
     * retention does: without a way to record contact, the clock runs from the day a candidate was
     * added, and someone you have been actively engaging with for a year ages out anyway.
     *
     * <p>Recording contact pushes the retention date out and clears any notice already sent, so a
     * candidate who is being talked to is not warned that they are about to be deleted.
     */
    @PostMapping("/entries/{id}/contact")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> recordContact(@PathVariable String id) {
        try {
            return ResponseEntity.ok(retentionService.recordContact(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * What the retention policy would do today, without doing any of it.
     * GET /api/talent-pools/retention/preview
     *
     * <p>Restricted to ADMIN and HR_MANAGER: it reports counts across every pool, and it is the
     * thing to read before believing what the nightly job is about to do.
     */
    @GetMapping("/retention/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> previewRetention() {
        return ResponseEntity.ok(retentionService.previewRetention(java.time.LocalDate.now()));
    }
}
