package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicantCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicantResponse;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
public class ApplicantService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicantService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final ApplicantRepository applicantRepository;
    private final DocumentRepository documentRepository;
    private final AuditLogService auditLogService;
    private final FileStorageService fileStorageService;

    public ApplicantService(ApplicantRepository applicantRepository,
                           DocumentRepository documentRepository,
                           AuditLogService auditLogService,
                           FileStorageService fileStorageService) {
        this.applicantRepository = applicantRepository;
        this.documentRepository = documentRepository;
        this.auditLogService = auditLogService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Create a new applicant
     */
    public ApplicantResponse createApplicant(ApplicantCreateRequest request) {
        logger.info("Creating new applicant with email: {}", request.getEmail());

        // Check if email already exists
        if (applicantRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Create new applicant
        Applicant applicant = new Applicant();
        applicant.setName(request.getName());
        applicant.setSurname(request.getSurname());
        applicant.setEmail(request.getEmail());
        applicant.setPhone(request.getPhone());
        applicant.setIdPassportNumber(request.getIdPassportNumber());
        applicant.setAddress(request.getAddress());
        applicant.setEducation(request.getEducation());
        applicant.setExperience(request.getExperience());
        applicant.setSkills(request.getSkills());
        applicant.setGender(request.getGender());
        applicant.setRace(request.getRace());
        applicant.setDisabilityStatus(request.getDisabilityStatus());
        applicant.setCitizenshipStatus(request.getCitizenshipStatus());
        applicant.setDemographicsConsent(request.getDemographicsConsent());

        Applicant savedApplicant = applicantRepository.save(applicant);

        // Log to audit
        auditLogService.logApplicantAction(savedApplicant.getId(), "CREATED", "APPLICANT",
                                          savedApplicant.getFullName());

        logger.info("Applicant created with ID: {}", savedApplicant.getId());

        return ApplicantResponse.fromEntity(savedApplicant);
    }

    /**
     * Update an existing applicant
     */
    public ApplicantResponse updateApplicant(Long id, ApplicantCreateRequest request) {
        logger.info("Updating applicant with ID: {}", id);

        Applicant applicant = findApplicantById(id);

        // Check if email change conflicts with existing email
        if (!applicant.getEmail().equals(request.getEmail()) &&
            applicantRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Update fields
        applicant.setName(request.getName());
        applicant.setSurname(request.getSurname());
        applicant.setEmail(request.getEmail());
        applicant.setPhone(request.getPhone());
        applicant.setIdPassportNumber(request.getIdPassportNumber());
        applicant.setAddress(request.getAddress());
        applicant.setEducation(request.getEducation());
        applicant.setExperience(request.getExperience());
        applicant.setSkills(request.getSkills());
        applicant.setGender(request.getGender());
        applicant.setRace(request.getRace());
        applicant.setDisabilityStatus(request.getDisabilityStatus());
        applicant.setCitizenshipStatus(request.getCitizenshipStatus());
        applicant.setDemographicsConsent(request.getDemographicsConsent());

        Applicant updatedApplicant = applicantRepository.save(applicant);

        // Log to audit
        auditLogService.logApplicantAction(updatedApplicant.getId(), "UPDATED", "APPLICANT",
                                          updatedApplicant.getFullName());

        logger.info("Applicant updated with ID: {}", updatedApplicant.getId());

        return ApplicantResponse.fromEntity(updatedApplicant);
    }

    /**
     * Get applicant by ID
     */
    @Transactional(readOnly = true)
    public ApplicantResponse getApplicant(Long id) {
        Applicant applicant = findApplicantById(id);
        return ApplicantResponse.fromEntity(applicant);
    }

    /**
     * Upload document for applicant
     */
    public Document uploadDocument(Long applicantId, Long applicationId, DocumentType type,
                                 MultipartFile file) throws IOException {
        logger.info("Uploading {} document for applicant: {}", type, applicantId);

        // Validate file
        validateFile(file);

        Applicant applicant = findApplicantById(applicantId);

        // Store file
        String fileUrl = fileStorageService.store(file);

        // Create document record
        Document document = new Document();
        document.setApplicant(applicant);
        document.setApplicationId(applicationId);
        document.setType(type);
        document.setFilename(file.getOriginalFilename());
        document.setUrl(fileUrl);
        document.setFileSize(file.getSize());
        document.setContentType(file.getContentType());

        Document savedDocument = documentRepository.save(document);

        // Log to audit
        auditLogService.logApplicantAction(applicantId, "DOCUMENT_UPLOADED", "APPLICANT",
                                          type + ": " + file.getOriginalFilename());

        logger.info("Document uploaded with ID: {}", savedDocument.getId());

        return savedDocument;
    }

    /**
     * Delete document
     */
    public void deleteDocument(Long applicantId, Long documentId) {
        logger.info("Deleting document {} for applicant: {}", documentId, applicantId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        if (!document.getApplicant().getId().equals(applicantId)) {
            throw new IllegalArgumentException("Document does not belong to applicant");
        }

        // Delete file from storage
        try {
            fileStorageService.delete(document.getUrl());
        } catch (Exception e) {
            logger.warn("Failed to delete file from storage: {}", document.getUrl(), e);
        }

        // Delete document record
        documentRepository.delete(document);

        // Log to audit
        auditLogService.logApplicantAction(applicantId, "DOCUMENT_DELETED", "APPLICANT",
                                          document.getType() + ": " + document.getFilename());

        logger.info("Document deleted: {}", documentId);
    }

    /**
     * Get documents for applicant
     */
    @Transactional(readOnly = true)
    public List<Document> getApplicantDocuments(Long applicantId) {
        return documentRepository.findByApplicantIdOrderByUploadedAtDesc(applicantId);
    }

    /**
     * Search applicants
     */
    @Transactional(readOnly = true)
    public Page<ApplicantResponse> searchApplicants(String searchTerm, Pageable pageable) {
        Page<Applicant> applicants;

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            applicants = applicantRepository.findBySearchTerm(searchTerm, pageable);
        } else {
            applicants = applicantRepository.findAll(pageable);
        }

        return applicants.map(ApplicantResponse::fromEntity);
    }

    // Helper methods

    private Applicant findApplicantById(Long id) {
        return applicantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + id));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") &&
                                   !contentType.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml") &&
                                   !contentType.equals("application/msword"))) {
            throw new IllegalArgumentException("Only PDF and Word documents are supported");
        }
    }
}
