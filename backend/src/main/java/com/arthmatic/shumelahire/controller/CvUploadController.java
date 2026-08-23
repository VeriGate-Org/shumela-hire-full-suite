package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.StorageService;
import com.arthmatic.shumelahire.service.shortlisting.CvTextExtractor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * CV upload for candidates and for staff capturing on their behalf.
 *
 * <p>This closes the gap that made "AI CV Screening" unbuildable rather than merely unwired: the
 * tenant held zero documents and zero resume URLs, so {@code CvScreeningAiService}'s
 * {@code resumeText} parameter was always empty. Text is extracted at upload and stored on the
 * document, so shortlisting and screening read it without re-parsing a PDF per run.</p>
 */
@RestController
@RequestMapping("/api/cv")
public class CvUploadController {

    private static final Logger logger = LoggerFactory.getLogger(CvUploadController.class);

    /** 10 MB. A CV above this is a portfolio, and Lambda payload limits are not generous. */
    private static final long MAX_BYTES = 10L * 1024 * 1024;

    private static final Set<String> ACCEPTED = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain");

    @Autowired private DocumentDataRepository documentRepository;
    @Autowired private ApplicantDataRepository applicantRepository;
    @Autowired private UserDataRepository userRepository;
    @Autowired private StorageService storageService;
    @Autowired private CvTextExtractor extractor;
    @Autowired private AuditLogService auditLogService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT')")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam(required = false) String applicantId,
                                    @RequestParam(required = false) String applicationId,
                                    Authentication authentication) {
        try {
            if (file == null || file.isEmpty()) {
                return bad("No file was provided");
            }
            if (file.getSize() > MAX_BYTES) {
                return bad("File exceeds the 10 MB limit");
            }
            if (file.getContentType() != null && !ACCEPTED.contains(file.getContentType())) {
                return bad("Unsupported file type. Upload a PDF, Word document or plain text file.");
            }

            String owner = resolveApplicant(applicantId, authentication);

            // Store first. If extraction fails the CV must still exist — a scanned document is
            // unreadable to us but perfectly readable to the recruiter who opens it.
            String key = storageService.store(file, "cvs/" + owner);

            String text = extractor.extract(file.getBytes(), file.getOriginalFilename(), file.getContentType());

            // Document holds an Applicant association, not a bare id — a stub carrying the id is
            // what the repository maps from, the same pattern Offer needed.
            Applicant applicantRef = new Applicant();
            applicantRef.setId(owner);

            Document document = new Document();
            document.setApplicant(applicantRef);
            document.setApplicationId(applicationId);
            document.setType(DocumentType.CV);
            document.setFilename(file.getOriginalFilename());
            document.setUrl(key);
            document.setFileSize(file.getSize());
            document.setContentType(file.getContentType());
            document.setUploadedAt(LocalDateTime.now());
            document.setExtractedText(text);
            Document saved = documentRepository.save(document);

            auditLogService.logUserAction(actingUserId(authentication), "CV_UPLOADED", "DOCUMENT",
                    String.format("CV '%s' uploaded for applicant %s (%d bytes, text %s)",
                            file.getOriginalFilename(), owner, file.getSize(),
                            text == null ? "not extractable" : text.length() + " chars"));

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("id", saved.getId());
            body.put("filename", saved.getFilename());
            body.put("textExtracted", text != null);
            body.put("characters", text == null ? 0 : text.length());
            // Said plainly so the candidate is not left guessing why screening is thin later.
            body.put("message", text == null
                    ? "CV uploaded. The text could not be read automatically — a recruiter will review it."
                    : "CV uploaded and read successfully.");
            return ResponseEntity.status(HttpStatus.CREATED).body(body);

        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return bad(e.getMessage());
        } catch (Exception e) {
            logger.error("CV upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed. Please try again."));
        }
    }

    private ResponseEntity<?> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    /**
     * Whose CV this is.
     *
     * <p>An applicant may only upload against themselves — the same rule as application
     * submission, and for the same reason: the endpoint is reachable by {@code ROLE_APPLICANT}, so
     * honouring a supplied id would let any signed-in candidate attach a document to somebody
     * else's record. Staff capture on a candidate's behalf and must name them.</p>
     */
    private String resolveApplicant(String requested, Authentication authentication) {
        if (isApplicant(authentication)) {
            String own = applicantRepository.findByEmail(email(authentication))
                    .map(Applicant::getId)
                    .orElseThrow(() -> new AccessDeniedException("No applicant profile for the signed-in user"));
            if (requested != null && !requested.equals(own)) {
                throw new AccessDeniedException("Applicants may only upload their own CV");
            }
            return own;
        }
        if (requested == null || requested.isBlank()) {
            throw new IllegalArgumentException("applicantId is required when uploading on someone's behalf");
        }
        return requested;
    }

    private String actingUserId(Authentication authentication) {
        String e = email(authentication);
        if (e == null) return "SYSTEM";
        return userRepository.findByEmail(e).map(User::getId)
                .orElseGet(() -> applicantRepository.findByEmail(e).map(Applicant::getId).orElse("SYSTEM"));
    }

    private String email(Authentication authentication) {
        if (authentication == null) return null;
        if (authentication.getPrincipal() instanceof Jwt jwt) return jwt.getClaimAsString("email");
        if (authentication.getPrincipal() instanceof User user) return user.getEmail();
        return null;
    }

    private boolean isApplicant(Authentication authentication) {
        if (authentication == null) return false;
        for (GrantedAuthority a : authentication.getAuthorities()) {
            if ("ROLE_APPLICANT".equals(a.getAuthority())) return true;
        }
        return false;
    }
}
