package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.LocalESignatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Drives the signer's side of a simulated signature.
 * <p>
 * With a real provider the signer acts in the provider's UI and the outcome
 * arrives as a webhook. The simulated provider has no signer UI, so these
 * endpoints stand in for that step. They exist only when
 * {@code esignature.provider=local} — under DocuSign the bean is never created
 * and the routes 404.
 */
@RestController
@RequestMapping("/api/esignature/simulate")
@ConditionalOnProperty(name = "esignature.provider", havingValue = "local", matchIfMissing = true)
public class ESignatureSimulationController {

    @Autowired
    private LocalESignatureService localESignatureService;

    @PostMapping("/{envelopeId}/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> sign(@PathVariable String envelopeId) {
        localESignatureService.simulateSigned(envelopeId);
        return ResponseEntity.ok(Map.of(
            "envelopeId", envelopeId,
            "status", "completed",
            "simulated", true
        ));
    }

    @PostMapping("/{envelopeId}/decline")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> decline(@PathVariable String envelopeId) {
        localESignatureService.simulateDeclined(envelopeId);
        return ResponseEntity.ok(Map.of(
            "envelopeId", envelopeId,
            "status", "declined",
            "simulated", true
        ));
    }
}
