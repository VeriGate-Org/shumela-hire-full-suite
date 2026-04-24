package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.CompanyDocument;
import com.arthmatic.shumelahire.entity.CompanyDocumentCategory;
import com.arthmatic.shumelahire.service.CompanyDocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/company-documents")
@FeatureGate("COMPANY_DOCUMENTS")
public class CompanyDocumentController {

    private static final Logger logger = LoggerFactory.getLogger(CompanyDocumentController.class);

    @Autowired
    private CompanyDocumentService companyDocumentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> upload(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam CompanyDocumentCategory category,
            @RequestParam(required = false) Boolean requiresAcknowledgement,
            @RequestParam("file") MultipartFile file,
            @RequestParam String uploadedBy) {
        try {
            CompanyDocument doc = companyDocumentService.upload(title, description, category,
                    requiresAcknowledgement, file, uploadedBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(doc);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            logger.error("IO error uploading company document", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "File upload failed"));
        }
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(companyDocumentService.getPublished());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(companyDocumentService.getAllActive());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<?> listByCategory(@PathVariable CompanyDocumentCategory category) {
        return ResponseEntity.ok(companyDocumentService.getByCategory(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(companyDocumentService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            CompanyDocumentCategory category = request.get("category") != null
                    ? CompanyDocumentCategory.valueOf((String) request.get("category")) : null;
            Boolean requiresAcknowledgement = request.get("requiresAcknowledgement") != null
                    ? (Boolean) request.get("requiresAcknowledgement") : null;

            CompanyDocument updated = companyDocumentService.update(id, title, description, category, requiresAcknowledgement);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> publish(@PathVariable String id) {
        try {
            return ResponseEntity.ok(companyDocumentService.publish(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> unpublish(@PathVariable String id) {
        try {
            return ResponseEntity.ok(companyDocumentService.unpublish(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            companyDocumentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable String id, @RequestParam String requestingUserId) {
        try {
            String url = companyDocumentService.getDownloadUrl(id, requestingUserId);
            return ResponseEntity.ok(Map.of("downloadUrl", url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledge(@PathVariable String id, @RequestParam String employeeId) {
        try {
            companyDocumentService.acknowledge(id, employeeId);
            return ResponseEntity.ok(Map.of("message", "Document acknowledged"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/acknowledgements")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> getAcknowledgements(@PathVariable String id) {
        return ResponseEntity.ok(companyDocumentService.getAcknowledgementStatus(id));
    }
}
