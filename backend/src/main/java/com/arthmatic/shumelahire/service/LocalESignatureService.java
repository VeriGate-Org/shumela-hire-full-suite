package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Simulated e-signature provider — no external service, no credentials.
 * <p>
 * Active when {@code esignature.provider=local}, which is the default. It runs the
 * full signature lifecycle against the database: sending creates a {@code SIM-}
 * envelope and moves the offer to AWAITING_SIGNATURE, and the signer's action is
 * driven through {@code /api/esignature/simulate/...} instead of arriving as a
 * provider webhook.
 * <p>
 * <b>Every artefact it produces is marked as simulated.</b> A document signed here
 * carries no legal weight; switch {@code esignature.provider} to {@code docusign}
 * and supply the {@code DOCUSIGN_*} settings for real signatures.
 */
@Service
@ConditionalOnProperty(name = "esignature.provider", havingValue = "local", matchIfMissing = true)
public class LocalESignatureService implements ESignatureService {

    private static final Logger logger = LoggerFactory.getLogger(LocalESignatureService.class);

    public static final String PROVIDER = "local";

    /** Envelope ids are prefixed so a simulated signature is recognisable in any log or export. */
    private static final String ENVELOPE_PREFIX = "SIM-";

    private static final String DISCLAIMER =
        "SIMULATED SIGNATURE - NOT LEGALLY BINDING";

    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("d MMMM yyyy 'at' HH:mm");

    @Autowired
    private OfferDataRepository offerRepository;

    @Autowired
    private ESignatureEventApplier eventApplier;

    @Autowired
    private FileStorageService fileStorageService;

    @PostConstruct
    void warnOnStartup() {
        logger.warn("E-signature provider is 'local' — signatures are SIMULATED and carry no legal weight. "
            + "Set ESIGNATURE_PROVIDER=docusign with the DOCUSIGN_* settings for real signatures.");
    }

    @Override
    public String sendForSignature(Offer offer, String signerEmail, String signerName) {
        String envelopeId = newEnvelopeId();
        logger.info("Simulating e-signature send for offer {} to {} (envelope {})",
            offer.getOfferNumber(), signerEmail, envelopeId);

        offer.setESignatureEnvelopeId(envelopeId);
        offer.setESignatureStatus("sent");
        offer.setESignatureSentAt(LocalDateTime.now());
        offer.setESignatureProvider(PROVIDER);
        offer.setESignatureSignerEmail(signerEmail);
        offer.setStatus(OfferStatus.AWAITING_SIGNATURE);
        offerRepository.save(offer);

        return envelopeId;
    }

    @Override
    public String sendDocumentForSignature(String title, byte[] documentBytes, String contentType,
                                           String signerEmail, String signerName,
                                           String callbackEntityType, String callbackEntityId) {
        String envelopeId = newEnvelopeId();
        logger.info("Simulating e-signature send for document '{}' to {} (entity {}:{}, envelope {})",
            title, signerEmail, callbackEntityType, callbackEntityId, envelopeId);
        // The caller persists the envelope id against the document, which is how
        // getEnvelopeStatus and the simulate endpoints find it again.
        return envelopeId;
    }

    @Override
    public String getEnvelopeStatus(String envelopeId) {
        return eventApplier.findOfferByEnvelopeId(envelopeId)
            .map(Offer::getESignatureStatus)
            .or(() -> eventApplier.findDocumentByEnvelopeId(envelopeId)
                .map(EmployeeDocument::getESignatureStatus))
            .orElseThrow(() -> new IllegalArgumentException("Unknown envelope: " + envelopeId));
    }

    @Override
    public byte[] getSignedDocument(String envelopeId) {
        Offer offer = eventApplier.findOfferByEnvelopeId(envelopeId).orElse(null);
        if (offer != null) {
            requireCompleted(envelopeId, offer.getESignatureStatus());
            return renderOfferPdf(offer);
        }

        EmployeeDocument document = eventApplier.findDocumentByEnvelopeId(envelopeId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown envelope: " + envelopeId));
        requireCompleted(envelopeId, document.getESignatureStatus());
        return renderDocumentPdf(document);
    }

    @Override
    public void handleWebhookEvent(Map<String, Object> event) {
        Object data = event.get("data");
        if (!(data instanceof Map<?, ?> payload)) return;
        Object envelopeId = payload.get("envelopeId");
        if (envelopeId == null) return;
        eventApplier.apply(String.valueOf(envelopeId), String.valueOf(event.get("event")));
    }

    @Override
    public void voidEnvelope(String envelopeId, String reason) {
        requireKnown(envelopeId);
        logger.info("Simulated envelope {} voided: {}", envelopeId, reason);
        eventApplier.apply(envelopeId, ESignatureEventApplier.EVENT_VOIDED);
    }

    // ── Simulation actions (driven by ESignatureSimulationController) ────────

    /** Stand in for the signer completing the signing ceremony. */
    public void simulateSigned(String envelopeId) {
        requireKnown(envelopeId);
        logger.info("Simulating signer completion for envelope {}", envelopeId);
        eventApplier.apply(envelopeId, ESignatureEventApplier.EVENT_COMPLETED);
    }

    /** Stand in for the signer declining to sign. */
    public void simulateDeclined(String envelopeId) {
        requireKnown(envelopeId);
        logger.info("Simulating signer decline for envelope {}", envelopeId);
        eventApplier.apply(envelopeId, ESignatureEventApplier.EVENT_DECLINED);
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private String newEnvelopeId() {
        return ENVELOPE_PREFIX + UUID.randomUUID();
    }

    private void requireKnown(String envelopeId) {
        boolean known = eventApplier.findOfferByEnvelopeId(envelopeId).isPresent()
            || eventApplier.findDocumentByEnvelopeId(envelopeId).isPresent();
        if (!known) {
            throw new IllegalArgumentException("Unknown envelope: " + envelopeId);
        }
    }

    private void requireCompleted(String envelopeId, String status) {
        if (!"completed".equals(status)) {
            throw new IllegalArgumentException("Envelope " + envelopeId
                + " has not been signed yet (status: " + (status == null ? "not_sent" : status) + ")");
        }
    }

    private byte[] renderOfferPdf(Offer offer) {
        List<String> body = new ArrayList<>();
        body.add("Offer Number: " + text(offer.getOfferNumber()));
        body.add("Position: " + text(offer.getJobTitle()));
        body.add("Department: " + text(offer.getDepartment()));
        body.add("Base Salary: " + text(offer.getCurrency()) + " " + text(offer.getBaseSalary()));
        body.add("Start Date: " + text(offer.getStartDate()));
        return renderPdf("Offer of Employment", body,
            offer.getESignatureSignerEmail(), offer.getESignatureCompletedAt(),
            offer.getESignatureEnvelopeId());
    }

    private byte[] renderDocumentPdf(EmployeeDocument document) {
        List<String> body = new ArrayList<>();
        body.add("Document: " + text(document.getTitle()));
        body.add("Filename: " + text(document.getFilename()));
        // The uploaded original is referenced rather than embedded: the simulated
        // provider produces a signature certificate, not a merged copy of an
        // arbitrary upload. Confirm the original is still retrievable.
        body.add("Original on file: " + (originalExists(document) ? "yes" : "not retrievable"));
        return renderPdf("Signed Document Certificate", body,
            document.getESignatureSignerEmail(), document.getESignatureCompletedAt(),
            document.getESignatureEnvelopeId());
    }

    private boolean originalExists(EmployeeDocument document) {
        try {
            return document.getFileUrl() != null && fileStorageService.exists(document.getFileUrl());
        } catch (Exception e) {
            logger.warn("Could not verify stored file for document {}: {}", document.getId(), e.getMessage());
            return false;
        }
    }

    private byte[] renderPdf(String heading, List<String> body, String signerEmail,
                             LocalDateTime signedAt, String envelopeId) {
        try (PDDocument pdf = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            pdf.addPage(page);

            PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font italic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            float margin = 60f;
            float y = page.getMediaBox().getHeight() - margin;

            try (PDPageContentStream cs = new PDPageContentStream(pdf, page)) {
                y = line(cs, bold, 11, margin, y, DISCLAIMER);
                y -= 18;
                y = line(cs, bold, 20, margin, y, heading);
                y -= 10;

                for (String entry : body) {
                    y = line(cs, regular, 12, margin, y, entry);
                }

                y -= 24;
                y = line(cs, bold, 13, margin, y, "Electronic signature");
                y = line(cs, regular, 12, margin, y, "Signed by: " + text(signerEmail));
                y = line(cs, regular, 12, margin, y,
                    "Signed at: " + (signedAt == null ? "-" : signedAt.format(TIMESTAMP)));
                y = line(cs, regular, 12, margin, y, "Envelope: " + text(envelopeId));

                y -= 24;
                line(cs, italic, 10, margin, y,
                    "Produced by the ShumelaHire simulated signature provider for demonstration");
                line(cs, italic, 10, margin, y - 14,
                    "purposes. It is not evidence of a signature by the named party.");
            }

            pdf.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            logger.error("Failed to render simulated signed document for envelope {}: {}", envelopeId, e.getMessage());
            throw new RuntimeException("Failed to retrieve signed document", e);
        }
    }

    private float line(PDPageContentStream cs, PDType1Font font, float size,
                       float x, float y, String value) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(value);
        cs.endText();
        return y - (size + 8);
    }

    /**
     * PDFBox's Standard 14 fonts encode WinAnsi only, so a stray glyph from user
     * data would throw mid-render. Fall back to ASCII.
     */
    private String text(Object value) {
        if (value == null) return "-";
        String s = String.valueOf(value);
        return s.replaceAll("[^\\x20-\\x7E]", " ").trim();
    }
}
