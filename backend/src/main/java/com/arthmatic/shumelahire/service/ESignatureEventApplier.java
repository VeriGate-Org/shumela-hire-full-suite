package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Applies envelope outcomes to whichever entity owns the envelope.
 * <p>
 * Shared by every {@link ESignatureService} implementation so the state
 * transitions an envelope drives — offer moves to SIGNED, document records a
 * completion timestamp — are defined once rather than per provider.
 */
@Component
public class ESignatureEventApplier {

    private static final Logger logger = LoggerFactory.getLogger(ESignatureEventApplier.class);

    public static final String EVENT_COMPLETED = "envelope-completed";
    public static final String EVENT_DECLINED = "envelope-declined";
    public static final String EVENT_VOIDED = "envelope-voided";

    @Autowired
    private OfferDataRepository offerRepository;

    @Autowired
    private EmployeeDocumentDataRepository employeeDocumentRepository;

    /** The offer carrying this envelope, if any. */
    public Optional<Offer> findOfferByEnvelopeId(String envelopeId) {
        if (envelopeId == null) return Optional.empty();
        return offerRepository.findAll().stream()
            .filter(o -> envelopeId.equals(o.getESignatureEnvelopeId()))
            .findFirst();
    }

    /** The employee document carrying this envelope, if any. */
    public Optional<EmployeeDocument> findDocumentByEnvelopeId(String envelopeId) {
        if (envelopeId == null) return Optional.empty();
        return employeeDocumentRepository.findAll().stream()
            .filter(d -> envelopeId.equals(d.getESignatureEnvelopeId()))
            .findFirst();
    }

    /**
     * Apply an envelope outcome. Unknown event types and unknown envelope ids are
     * ignored — providers deliver many lifecycle events we do not model, and a
     * webhook for an envelope we never created is not an error.
     */
    public void apply(String envelopeId, String eventType) {
        if (envelopeId == null || eventType == null) return;

        findOfferByEnvelopeId(envelopeId).ifPresent(offer -> {
            if (EVENT_COMPLETED.equals(eventType)) {
                offer.setESignatureStatus("completed");
                offer.setESignatureCompletedAt(LocalDateTime.now());
                offer.setStatus(OfferStatus.SIGNED);
                offerRepository.save(offer);
                logger.info("Offer {} signed (envelope {})", offer.getOfferNumber(), envelopeId);
            } else if (EVENT_DECLINED.equals(eventType)) {
                offer.setESignatureStatus("declined");
                offer.setStatus(OfferStatus.DECLINED);
                offer.setDeclinedAt(LocalDateTime.now());
                offerRepository.save(offer);
                logger.info("Offer {} signature declined (envelope {})", offer.getOfferNumber(), envelopeId);
            } else if (EVENT_VOIDED.equals(eventType)) {
                offer.setESignatureStatus("voided");
                offer.setStatus(OfferStatus.WITHDRAWN);
                offer.setWithdrawnAt(LocalDateTime.now());
                offerRepository.save(offer);
                logger.info("Offer {} envelope voided (envelope {})", offer.getOfferNumber(), envelopeId);
            }
        });

        findDocumentByEnvelopeId(envelopeId).ifPresent(doc -> {
            if (EVENT_COMPLETED.equals(eventType)) {
                doc.setESignatureStatus("completed");
                doc.setESignatureCompletedAt(LocalDateTime.now());
                employeeDocumentRepository.save(doc);
                logger.info("Employee document {} signature completed (envelope {})", doc.getId(), envelopeId);
            } else if (EVENT_DECLINED.equals(eventType)) {
                doc.setESignatureStatus("declined");
                employeeDocumentRepository.save(doc);
                logger.info("Employee document {} signature declined (envelope {})", doc.getId(), envelopeId);
            } else if (EVENT_VOIDED.equals(eventType)) {
                doc.setESignatureStatus("voided");
                employeeDocumentRepository.save(doc);
                logger.info("Employee document {} envelope voided (envelope {})", doc.getId(), envelopeId);
            }
        });
    }
}
