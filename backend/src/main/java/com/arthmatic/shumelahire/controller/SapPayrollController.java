package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.SapPayrollTransmission;
import com.arthmatic.shumelahire.service.SapPayrollService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.arthmatic.shumelahire.annotation.FeatureGate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sap-payroll")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TA_MANAGER')")
@FeatureGate("SAP_PAYROLL")
public class SapPayrollController {

    @Autowired(required = false)
    private SapPayrollService sapPayrollService;

    @PostMapping("/offers/{offerId}/transmit")
    public ResponseEntity<?> transmitNewHire(
            @PathVariable String offerId,
            @RequestParam String userId) {

        if (sapPayrollService == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "SAP Payroll integration is not enabled",
                    "message", "Set sap.payroll.enabled=true and configure SAP credentials"));
        }

        SapPayrollTransmission transmission = sapPayrollService.sendNewHireData(offerId, userId);
        return ResponseEntity.ok(transmission);
    }

    @GetMapping("/transmissions/{transmissionId}/status")
    public ResponseEntity<?> getTransmissionStatus(@PathVariable String transmissionId) {
        if (sapPayrollService == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "SAP Payroll integration is not enabled"));
        }

        SapPayrollTransmission transmission = sapPayrollService.getTransmissionStatus(transmissionId);
        return ResponseEntity.ok(transmission);
    }

    @GetMapping("/offers/{offerId}/validate")
    public ResponseEntity<?> validateEmployeeData(@PathVariable String offerId) {
        if (sapPayrollService == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "SAP Payroll integration is not enabled"));
        }

        Map<String, String> errors = sapPayrollService.validateEmployeeData(offerId);
        if (errors.isEmpty()) {
            return ResponseEntity.ok(Map.of("valid", true, "message", "Employee data is valid for SAP transmission"));
        }
        return ResponseEntity.ok(Map.of("valid", false, "errors", errors));
    }

    @PostMapping("/transmissions/{transmissionId}/retry")
    public ResponseEntity<?> retryTransmission(
            @PathVariable String transmissionId,
            @RequestParam String userId) {

        if (sapPayrollService == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "SAP Payroll integration is not enabled"));
        }

        SapPayrollTransmission transmission = sapPayrollService.retryFailedTransmission(transmissionId, userId);
        return ResponseEntity.ok(transmission);
    }

    @GetMapping("/transmissions/pending")
    public ResponseEntity<?> getPendingTransmissions() {
        if (sapPayrollService == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "SAP Payroll integration is not enabled"));
        }

        List<SapPayrollTransmission> pending = sapPayrollService.getPendingTransmissions();
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/transmissions/{transmissionId}/cancel")
    public ResponseEntity<?> cancelTransmission(
            @PathVariable String transmissionId,
            @RequestParam String reason,
            @RequestParam String userId) {

        if (sapPayrollService == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "SAP Payroll integration is not enabled"));
        }

        SapPayrollTransmission transmission = sapPayrollService.cancelTransmission(transmissionId, reason, userId);
        return ResponseEntity.ok(transmission);
    }
}
