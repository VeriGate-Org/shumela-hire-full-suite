package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * The simulated provider is what every demo and evaluation runs on until a real
 * DocuSign tenancy exists, so its lifecycle is covered end to end.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LocalESignatureServiceTest {

    @Mock
    private OfferDataRepository offerRepository;

    @Mock
    private EmployeeDocumentDataRepository employeeDocumentRepository;

    @Mock
    private FileStorageService fileStorageService;

    private LocalESignatureService service;
    private Offer offer;

    @BeforeEach
    void setUp() {
        ESignatureEventApplier applier = new ESignatureEventApplier();
        ReflectionTestUtils.setField(applier, "offerRepository", offerRepository);
        ReflectionTestUtils.setField(applier, "employeeDocumentRepository", employeeDocumentRepository);

        service = new LocalESignatureService();
        ReflectionTestUtils.setField(service, "offerRepository", offerRepository);
        ReflectionTestUtils.setField(service, "eventApplier", applier);
        ReflectionTestUtils.setField(service, "fileStorageService", fileStorageService);

        offer = new Offer();
        offer.setId("1");
        offer.setOfferNumber("OFF-2026-001");
        offer.setJobTitle("Systems Analyst");
        offer.setDepartment("Information Technology");
        offer.setCurrency("ZAR");
        offer.setBaseSalary(new BigDecimal("780000"));
        offer.setStartDate(LocalDate.of(2026, 10, 1));
        offer.setStatus(OfferStatus.SENT);

        when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(offerRepository.findAll()).thenReturn(List.of(offer));
        when(employeeDocumentRepository.findAll()).thenReturn(List.of());
    }

    @Test
    void sendForSignaturePutsOfferIntoAwaitingSignature() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");

        assertTrue(envelopeId.startsWith("SIM-"), "envelope id must be recognisable as simulated");
        assertEquals(OfferStatus.AWAITING_SIGNATURE, offer.getStatus());
        assertEquals("sent", offer.getESignatureStatus());
        assertEquals("local", offer.getESignatureProvider());
        assertEquals("candidate@example.com", offer.getESignatureSignerEmail());
        assertNotNull(offer.getESignatureSentAt());
        verify(offerRepository).save(offer);
    }

    @Test
    void statusIsReadableForAnEnvelopeThatWasSent() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");
        assertEquals("sent", service.getEnvelopeStatus(envelopeId));
    }

    @Test
    void simulatedSignatureCompletesTheOffer() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");

        service.simulateSigned(envelopeId);

        assertEquals(OfferStatus.SIGNED, offer.getStatus());
        assertEquals("completed", offer.getESignatureStatus());
        assertNotNull(offer.getESignatureCompletedAt());
        assertEquals("completed", service.getEnvelopeStatus(envelopeId));
    }

    @Test
    void simulatedDeclineDeclinesTheOffer() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");

        service.simulateDeclined(envelopeId);

        assertEquals(OfferStatus.DECLINED, offer.getStatus());
        assertEquals("declined", offer.getESignatureStatus());
        assertNotNull(offer.getDeclinedAt());
    }

    @Test
    void signedDocumentIsAPdfMarkedAsSimulated() throws Exception {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");
        service.simulateSigned(envelopeId);

        byte[] pdf = service.getSignedDocument(envelopeId);
        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));

        // The disclaimer must survive into the artefact itself, not just the UI —
        // a simulated signature that reads as genuine is the one real risk here.
        String rendered;
        try (PDDocument document = Loader.loadPDF(pdf)) {
            rendered = new PDFTextStripper().getText(document);
        }
        assertTrue(rendered.contains("SIMULATED SIGNATURE - NOT LEGALLY BINDING"),
            "signed artefact must carry the simulation disclaimer, got:\n" + rendered);
        assertTrue(rendered.contains("OFF-2026-001"), "offer detail should be rendered");
        assertTrue(rendered.contains("candidate@example.com"), "signer should be named");
        assertTrue(rendered.contains(envelopeId), "envelope should be traceable from the artefact");
    }

    @Test
    void signedDocumentIsRefusedBeforeTheSignerActs() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> service.getSignedDocument(envelopeId));
        assertTrue(ex.getMessage().contains("has not been signed yet"));
    }

    @Test
    void unknownEnvelopeIsRejectedRatherThanSilentlyIgnored() {
        assertThrows(IllegalArgumentException.class, () -> service.getEnvelopeStatus("SIM-does-not-exist"));
        assertThrows(IllegalArgumentException.class, () -> service.simulateSigned("SIM-does-not-exist"));
        assertThrows(IllegalArgumentException.class, () -> service.voidEnvelope("SIM-does-not-exist", "nope"));
    }

    @Test
    void voidingWithdrawsTheOffer() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");

        service.voidEnvelope(envelopeId, "Role withdrawn");

        assertEquals(OfferStatus.WITHDRAWN, offer.getStatus());
        assertEquals("voided", offer.getESignatureStatus());
    }

    @Test
    void webhookPayloadDrivesTheSameTransition() {
        String envelopeId = service.sendForSignature(offer, "candidate@example.com", "Thandi Mokoena");

        service.handleWebhookEvent(Map.of(
            "event", "envelope-completed",
            "data", Map.of("envelopeId", envelopeId)
        ));

        assertEquals(OfferStatus.SIGNED, offer.getStatus());
    }

    @Test
    void employeeDocumentEnvelopeIsTrackedThroughTheDocumentRecord() {
        EmployeeDocument document = new EmployeeDocument();
        document.setId("doc-1");
        String envelopeId = service.sendDocumentForSignature(
            "Employment Contract", "file".getBytes(StandardCharsets.UTF_8), "application/pdf",
            "employee@example.com", "Sipho Dlamini", "EMPLOYEE_DOCUMENT", "doc-1");

        // The controller is what persists the envelope id against the document.
        document.setESignatureEnvelopeId(envelopeId);
        document.setESignatureStatus("sent");
        when(employeeDocumentRepository.findAll()).thenReturn(List.of(document));
        when(employeeDocumentRepository.save(any(EmployeeDocument.class))).thenAnswer(inv -> inv.getArgument(0));

        assertTrue(envelopeId.startsWith("SIM-"));
        assertEquals("sent", service.getEnvelopeStatus(envelopeId));

        service.simulateSigned(envelopeId);

        assertEquals("completed", document.getESignatureStatus());
        assertNotNull(document.getESignatureCompletedAt());
    }
}
