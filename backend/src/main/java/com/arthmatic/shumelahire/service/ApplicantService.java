package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicantApplicationSummary;
import com.arthmatic.shumelahire.dto.ApplicantCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicantResponse;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ApplicantService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicantService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final ApplicantDataRepository applicantRepository;
    private final DocumentDataRepository documentRepository;
    private final AuditLogService auditLogService;
    private final FileStorageService fileStorageService;
    private final UserDataRepository userRepository;
    private final ApplicationDataRepository applicationRepository;

    public ApplicantService(ApplicantDataRepository applicantRepository,
                           DocumentDataRepository documentRepository,
                           AuditLogService auditLogService,
                           FileStorageService fileStorageService,
                           UserDataRepository userRepository,
                           ApplicationDataRepository applicationRepository) {
        this.applicantRepository = applicantRepository;
        this.documentRepository = documentRepository;
        this.auditLogService = auditLogService;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    /**
     * Resolves the Applicant record backing a self-service action (applying,
     * viewing own applications/offers) taken by an authenticated Employee,
     * auto-provisioning one on first use.
     *
     * <p>Employee and Applicant are distinct entities (Employee.java vs
     * Applicant.java) — an Employee applying for an internal or external role
     * for the first time has no Applicant record yet. Rather than blocking
     * them, create a minimal one from their User profile, keyed by the same
     * email, so subsequent self-service calls resolve to the same Applicant
     * consistently. Applicants themselves are never auto-provisioned here —
     * a genuine Applicant account missing its profile is a real data problem
     * the caller should still surface as an error, not paper over.</p>
     */
    public String resolveOrCreateApplicantIdForEmployee(String email) {
        return applicantRepository.findByEmail(email)
                .map(Applicant::getId)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email).orElse(null);
                    String firstName = user != null ? user.getFirstName() : "";
                    String lastName = user != null ? user.getLastName() : "";
                    Applicant applicant = new Applicant(firstName, lastName, email);
                    if (user != null) {
                        applicant.setUserId(user.getId());
                        applicant.setPhone(user.getPhone());
                    }
                    applicant.setSource("EMPLOYEE_SELF_SERVICE");
                    Applicant saved = applicantRepository.save(applicant);
                    logger.info("Auto-provisioned applicant profile {} for employee {}", saved.getId(), email);
                    return saved.getId();
                });
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
    public ApplicantResponse updateApplicant(String id, ApplicantCreateRequest request) {
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
    public ApplicantResponse getApplicant(String id) {
        Applicant applicant = findApplicantById(id);
        return ApplicantResponse.fromEntity(applicant);
    }

    /**
     * This applicant's application history, summarised.
     *
     * <p>Answers the question the applicant record could never answer on its own: has this person
     * been here before, and what happened. The underlying link is not new — {@code Application}
     * stores an {@code applicantId} and DynamoDB indexes it as
     * {@code GSI4 (APP_APPLICANT#{applicantId})} — it simply had no route to a client.
     *
     * <p>Throws if the applicant does not exist, so a mistyped id is a 404 rather than an empty
     * history that reads as "never applied".
     *
     * <p><b>One query, one applicant.</b> Do not call this per row to decorate a list: on the
     * DynamoDB backend {@code findByApplicantIdOrderBySubmittedAtDesc} reads every matching item,
     * and {@code countByApplicantId} is that same read followed by {@code .size()} — so a page of
     * twenty applicants would be twenty full index reads. A list-level count needs either a batch
     * endpoint or a maintained counter on the applicant; neither is built here.
     */
    public ApplicantApplicationSummary getApplicationSummary(String applicantId) {
        findApplicantById(applicantId);

        List<com.arthmatic.shumelahire.entity.Application> applications =
                applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId);

        return ApplicantApplicationSummary.from(applications);
    }

    /**
     * The largest batch {@link #getApplicationSummaries} will accept.
     *
     * <p>Each id costs one index read, so an unbounded list is both slow and a denial-of-service
     * shape. A hundred is five pages of twenty, which is more than any list view needs at once.
     */
    public static final int MAX_SUMMARY_BATCH = 100;

    /**
     * Application summaries for several applicants at once, keyed by applicant id.
     *
     * <p>Exists so a list view can show application history without issuing one request per row.
     * Follows the batch shape already used by
     * {@code GET /api/background-checks/summary?applicationIds=...}.
     *
     * <p><b>This is one round trip, not one read.</b> Server-side it is still a GSI query per
     * applicant, because {@code findByApplicantIdOrderBySubmittedAtDesc} reads every matching item.
     * That is an acceptable trade for a page of twenty and a poor one for a pool of four hundred.
     * The durable fix is a maintained counter on the applicant record — {@code applicationCount},
     * {@code lastAppliedAt}, {@code hiredEver}, written on the application write path — which would
     * make list decoration free. This endpoint is the stopgap that unblocks the screens now.
     *
     * <p>Unlike the single-applicant call, this does <b>not</b> verify that each id is a real
     * applicant: doing so would double the reads and defeat the point. Ids come from a list the
     * caller has already loaded. An id with no applications returns a zeroed summary rather than
     * being dropped, so the caller can always look up every id it asked about.
     *
     * @throws IllegalArgumentException if more than {@link #MAX_SUMMARY_BATCH} ids are requested,
     *                                  rather than silently truncating the answer
     */
    public Map<String, ApplicantApplicationSummary> getApplicationSummaries(List<String> applicantIds) {
        if (applicantIds == null || applicantIds.isEmpty()) {
            return Map.of();
        }

        List<String> distinctIds = applicantIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        if (distinctIds.size() > MAX_SUMMARY_BATCH) {
            throw new IllegalArgumentException(
                    "Too many applicant ids: " + distinctIds.size() + ", maximum is " + MAX_SUMMARY_BATCH);
        }

        Map<String, ApplicantApplicationSummary> summaries = new LinkedHashMap<>();
        for (String applicantId : distinctIds) {
            summaries.put(applicantId, ApplicantApplicationSummary.from(
                    applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId)));
        }
        return summaries;
    }

    /**
     * Upload document for applicant
     */
    public Document uploadDocument(String applicantId, String applicationId, DocumentType type,
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
    public void deleteDocument(String applicantId, String documentId) {
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
        documentRepository.deleteById(document.getId());

        // Log to audit
        auditLogService.logApplicantAction(applicantId, "DOCUMENT_DELETED", "APPLICANT",
                                          document.getType() + ": " + document.getFilename());

        logger.info("Document deleted: {}", documentId);
    }

    /**
     * Get documents for applicant
     */
    @Transactional(readOnly = true)
    public List<Document> getApplicantDocuments(String applicantId) {
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

    private Applicant findApplicantById(String id) {
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
