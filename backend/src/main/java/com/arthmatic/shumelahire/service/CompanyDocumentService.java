package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.CompanyDocument;
import com.arthmatic.shumelahire.entity.CompanyDocumentAcknowledgement;
import com.arthmatic.shumelahire.entity.CompanyDocumentCategory;
import com.arthmatic.shumelahire.repository.CompanyDocumentAcknowledgementDataRepository;
import com.arthmatic.shumelahire.repository.CompanyDocumentDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CompanyDocumentService {

    private static final Logger logger = LoggerFactory.getLogger(CompanyDocumentService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @Autowired
    private CompanyDocumentDataRepository documentRepository;

    @Autowired
    private CompanyDocumentAcknowledgementDataRepository acknowledgementRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AuditLogService auditLogService;

    public CompanyDocument upload(String title, String description, CompanyDocumentCategory category,
                                  Boolean requiresAcknowledgement, MultipartFile file, String uploadedBy) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("File size exceeds 10MB limit");

        String fileUrl = fileStorageService.store(file);

        CompanyDocument doc = new CompanyDocument();
        doc.setTitle(title);
        doc.setDescription(description);
        doc.setCategory(category);
        doc.setFilename(file.getOriginalFilename());
        doc.setFileUrl(fileUrl);
        doc.setFileSize(file.getSize());
        doc.setContentType(file.getContentType());
        doc.setVersion(1);
        doc.setIsPublished(false);
        doc.setIsActive(true);
        doc.setRequiresAcknowledgement(requiresAcknowledgement != null ? requiresAcknowledgement : false);
        doc.setUploadedBy(uploadedBy);
        doc.setCreatedAt(LocalDateTime.now());

        CompanyDocument saved = documentRepository.save(doc);
        auditLogService.logDocumentAction(uploadedBy, "COMPANY_DOCUMENT_UPLOADED", "COMPANY_DOCUMENT",
                category + ": " + file.getOriginalFilename());

        logger.info("Company document uploaded: {}", saved.getId());
        return saved;
    }

    public CompanyDocument publish(String documentId) {
        CompanyDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        doc.setIsPublished(true);
        doc.setPublishedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());
        CompanyDocument saved = documentRepository.save(doc);
        auditLogService.logDocumentAction(doc.getUploadedBy(), "COMPANY_DOCUMENT_PUBLISHED", "COMPANY_DOCUMENT",
                doc.getTitle());
        return saved;
    }

    public CompanyDocument unpublish(String documentId) {
        CompanyDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        doc.setIsPublished(false);
        doc.setPublishedAt(null);
        doc.setUpdatedAt(LocalDateTime.now());
        return documentRepository.save(doc);
    }

    public CompanyDocument update(String documentId, String title, String description,
                                   CompanyDocumentCategory category, Boolean requiresAcknowledgement) {
        CompanyDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        if (title != null) doc.setTitle(title);
        if (description != null) doc.setDescription(description);
        if (category != null) doc.setCategory(category);
        if (requiresAcknowledgement != null) doc.setRequiresAcknowledgement(requiresAcknowledgement);
        doc.setUpdatedAt(LocalDateTime.now());
        return documentRepository.save(doc);
    }

    public void delete(String documentId) {
        CompanyDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        doc.setIsActive(false);
        doc.setUpdatedAt(LocalDateTime.now());
        documentRepository.save(doc);
        auditLogService.logDocumentAction(doc.getUploadedBy(), "COMPANY_DOCUMENT_DELETED", "COMPANY_DOCUMENT",
                doc.getTitle());
    }

    public List<CompanyDocument> getAllActive() {
        return documentRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .toList();
    }

    public List<CompanyDocument> getPublished() {
        return documentRepository.findPublished();
    }

    public List<CompanyDocument> getByCategory(CompanyDocumentCategory category) {
        return documentRepository.findByCategory(category);
    }

    public CompanyDocument getById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
    }

    public String getDownloadUrl(String documentId, String requestingUserId) {
        CompanyDocument doc = getById(documentId);
        String url = fileStorageService.generateSignedUrl(doc.getFileUrl(), Duration.ofMinutes(15));
        auditLogService.logDocumentAction(requestingUserId, "COMPANY_DOCUMENT_DOWNLOADED", "COMPANY_DOCUMENT",
                doc.getTitle());
        return url;
    }

    // Acknowledgement methods

    public void acknowledge(String documentId, String employeeId) {
        if (acknowledgementRepository.existsByDocumentIdAndEmployeeId(documentId, employeeId)) {
            throw new IllegalArgumentException("Document already acknowledged");
        }
        CompanyDocumentAcknowledgement ack = new CompanyDocumentAcknowledgement();
        ack.setDocumentId(documentId);
        ack.setEmployeeId(employeeId);
        ack.setAcknowledgedAt(LocalDateTime.now());
        acknowledgementRepository.save(ack);

        auditLogService.logDocumentAction(employeeId, "COMPANY_DOCUMENT_ACKNOWLEDGED", "COMPANY_DOCUMENT",
                documentId);
    }

    public List<CompanyDocumentAcknowledgement> getAcknowledgements(String documentId) {
        return acknowledgementRepository.findByDocumentId(documentId);
    }

    public Map<String, Object> getAcknowledgementStatus(String documentId) {
        List<CompanyDocumentAcknowledgement> acks = acknowledgementRepository.findByDocumentId(documentId);
        return Map.of(
                "documentId", documentId,
                "acknowledgedCount", acks.size(),
                "acknowledgements", acks
        );
    }
}
