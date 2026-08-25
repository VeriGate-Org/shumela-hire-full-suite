package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencySubmission;
import com.arthmatic.shumelahire.service.AgencyPortalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/agencies")
public class AgencyPortalController {

    @Autowired
    private AgencyPortalService agencyPortalService;

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> registerAgency(@RequestBody AgencyProfile agency) {
        AgencyProfile saved = agencyPortalService.registerAgency(agency);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Every agency on the panel.
     *
     * <p>Now returns {@link com.arthmatic.shumelahire.dto.AgencyResponse}: contract state computed
     * against today, and the placement rate that previously required one dashboard call per agency.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getAllAgencies() {
        return ResponseEntity.ok(agencyPortalService.getAllAgenciesDetailed());
    }

    /**
     * Counts across the whole panel.
     * GET /api/agencies/summary
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> summary() {
        return ResponseEntity.ok(agencyPortalService.summary());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getAgency(@PathVariable String id) {
        return ResponseEntity.ok(agencyPortalService.getAgency(id));
    }

    /**
     * Update an agency in place. Without this the UI's Edit form had nowhere to send its changes
     * and posted to {@code /register}, creating a duplicate on every edit.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> updateAgency(@PathVariable String id, @RequestBody AgencyProfile agency) {
        return ResponseEntity.ok(agencyPortalService.updateAgency(id, agency));
    }

    /**
     * Remove an agency. ADMIN only — narrower than register/update, because it is the one
     * irreversible action on this resource.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAgency(@PathVariable String id) {
        agencyPortalService.deleteAgency(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> approveAgency(@PathVariable String id) {
        return ResponseEntity.ok(agencyPortalService.approveAgency(id));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> suspendAgency(@PathVariable String id) {
        return ResponseEntity.ok(agencyPortalService.suspendAgency(id));
    }

    @PostMapping("/{agencyId}/submissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> submitCandidate(
            @PathVariable String agencyId,
            @RequestBody AgencySubmission submission) {
        AgencySubmission saved = agencyPortalService.submitCandidate(agencyId, submission);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/submissions/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> reviewSubmission(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        boolean accept = Boolean.TRUE.equals(request.get("accept"));
        String reviewedBy = request.get("reviewedBy") != null
            ? request.get("reviewedBy").toString() : null;
        return ResponseEntity.ok(agencyPortalService.reviewSubmission(id, accept, reviewedBy));
    }

    @GetMapping("/{agencyId}/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getAgencyDashboard(@PathVariable String agencyId) {
        return ResponseEntity.ok(agencyPortalService.getAgencyDashboard(agencyId));
    }
}
