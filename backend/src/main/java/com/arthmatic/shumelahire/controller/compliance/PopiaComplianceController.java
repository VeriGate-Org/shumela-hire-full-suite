package com.arthmatic.shumelahire.controller.compliance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.compliance.ConsentRecordResponse;
import com.arthmatic.shumelahire.dto.compliance.DataSubjectRequestResponse;
import com.arthmatic.shumelahire.service.compliance.ConsentService;
import com.arthmatic.shumelahire.service.compliance.DataSubjectRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance/popia")
@FeatureGate("POPIA_COMPLIANCE")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class PopiaComplianceController {

    @Autowired
    private ConsentService consentService;

    @Autowired
    private DataSubjectRequestService dsarService;

    // ---- Consent endpoints ----

    @PostMapping("/consents")
    public ResponseEntity<?> grantConsent(@RequestParam Long employeeId,
                                          @RequestParam String consentType,
                                          @RequestParam(required = false) String purpose,
                                          @RequestParam(required = false) String ipAddress) {
        try {
            ConsentRecordResponse consent = consentService.grantConsent(employeeId, consentType, purpose, ipAddress);
            return ResponseEntity.status(HttpStatus.CREATED).body(consent);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/consents/withdraw")
    public ResponseEntity<?> withdrawConsent(@RequestParam Long employeeId,
                                              @RequestParam String consentType) {
        try {
            return ResponseEntity.ok(consentService.withdrawConsent(employeeId, consentType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/consents/employee/{employeeId}")
    public ResponseEntity<List<ConsentRecordResponse>> getConsentsForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(consentService.getConsentsForEmployee(employeeId));
    }

    @GetMapping("/consents")
    public ResponseEntity<Page<ConsentRecordResponse>> getAllConsents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(consentService.getAllConsents(
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/consents/stats")
    public ResponseEntity<Map<String, Object>> getConsentStats() {
        return ResponseEntity.ok(consentService.getConsentStats());
    }

    // ---- DSAR endpoints ----

    @PostMapping("/dsar")
    public ResponseEntity<?> createDsar(@RequestParam String requesterName,
                                        @RequestParam String requesterEmail,
                                        @RequestParam String requestType,
                                        @RequestParam(required = false) String description) {
        try {
            DataSubjectRequestResponse dsar = dsarService.createRequest(
                    requesterName, requesterEmail, requestType, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(dsar);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dsar/{id}")
    public ResponseEntity<?> getDsar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(dsarService.getRequest(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dsar")
    public ResponseEntity<Page<DataSubjectRequestResponse>> getAllDsars(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (status != null) {
            return ResponseEntity.ok(dsarService.getRequestsByStatus(status,
                    PageRequest.of(page, size, Sort.by("createdAt").descending())));
        }
        return ResponseEntity.ok(dsarService.getAllRequests(
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PutMapping("/dsar/{id}/status")
    public ResponseEntity<?> updateDsarStatus(@PathVariable Long id,
                                               @RequestParam String status,
                                               @RequestParam(required = false) String response) {
        try {
            return ResponseEntity.ok(dsarService.updateStatus(id, status, response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dsar/stats")
    public ResponseEntity<Map<String, Object>> getDsarStats() {
        return ResponseEntity.ok(dsarService.getDsarStats());
    }

    // ---- Dashboard ----

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("consentStats", consentService.getConsentStats());
        dashboard.put("dsarStats", dsarService.getDsarStats());
        return ResponseEntity.ok(dashboard);
    }
}
