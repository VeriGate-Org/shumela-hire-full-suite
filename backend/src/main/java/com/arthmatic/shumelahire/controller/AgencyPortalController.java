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

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getAllAgencies() {
        return ResponseEntity.ok(agencyPortalService.getAllAgencies());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getAgency(@PathVariable String id) {
        return ResponseEntity.ok(agencyPortalService.getAgency(id));
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
