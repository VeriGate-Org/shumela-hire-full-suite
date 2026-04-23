package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.service.ESignatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/esignature")
public class ESignatureController {

    @Autowired
    private ESignatureService eSignatureService;

    @Autowired
    private OfferDataRepository offerRepository;

    @PostMapping("/offers/{offerId}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> sendForSignature(
            @PathVariable String offerId,
            @RequestBody Map<String, String> request) {
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        String signerEmail = request.get("signerEmail");
        String signerName = request.get("signerName");

        if (signerEmail == null || signerName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "signerEmail and signerName are required"));
        }

        String envelopeId = eSignatureService.sendForSignature(offer, signerEmail, signerName);
        return ResponseEntity.ok(Map.of(
            "envelopeId", envelopeId,
            "status", "sent",
            "offerId", offerId
        ));
    }

    @GetMapping("/offers/{offerId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getSignatureStatus(@PathVariable String offerId) {
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        if (offer.getESignatureEnvelopeId() == null) {
            return ResponseEntity.ok(Map.of("status", "not_sent", "offerId", offerId));
        }

        String status = eSignatureService.getEnvelopeStatus(offer.getESignatureEnvelopeId());
        return ResponseEntity.ok(Map.of(
            "envelopeId", offer.getESignatureEnvelopeId(),
            "status", status,
            "offerId", offerId
        ));
    }

    @GetMapping("/offers/{offerId}/document")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<byte[]> getSignedDocument(@PathVariable String offerId) {
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        if (offer.getESignatureEnvelopeId() == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] document = eSignatureService.getSignedDocument(offer.getESignatureEnvelopeId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "signed-offer-" + offer.getOfferNumber() + ".pdf");

        return new ResponseEntity<>(document, headers, HttpStatus.OK);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> event) {
        eSignatureService.handleWebhookEvent(event);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/offers/{offerId}/void")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> voidEnvelope(
            @PathVariable String offerId,
            @RequestBody Map<String, String> request) {
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        if (offer.getESignatureEnvelopeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No envelope found for this offer"));
        }

        String reason = request.getOrDefault("reason", "Offer voided");
        eSignatureService.voidEnvelope(offer.getESignatureEnvelopeId(), reason);

        return ResponseEntity.ok(Map.of(
            "message", "Envelope voided",
            "offerId", offerId
        ));
    }
}
