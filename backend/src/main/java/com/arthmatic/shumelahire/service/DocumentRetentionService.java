package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.DocumentRetentionPolicy;
import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;
import com.arthmatic.shumelahire.repository.DocumentRetentionPolicyDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocumentRetentionService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentRetentionService.class);

    @Autowired
    private DocumentRetentionPolicyDataRepository policyRepository;

    @Autowired
    private EmployeeDocumentDataRepository documentRepository;

    @Autowired
    private AuditLogService auditLogService;

    // CRUD for policies

    public List<DocumentRetentionPolicy> getActivePolicies() {
        return policyRepository.findActive();
    }

    public List<DocumentRetentionPolicy> getAllPolicies() {
        return policyRepository.findAll();
    }

    public DocumentRetentionPolicy createPolicy(DocumentRetentionPolicy policy) {
        policy.setCreatedAt(LocalDateTime.now());
        policy.setIsActive(true);
        return policyRepository.save(policy);
    }

    public DocumentRetentionPolicy updatePolicy(String id, DocumentRetentionPolicy updates) {
        DocumentRetentionPolicy existing = policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));

        if (updates.getDocumentTypeCode() != null) existing.setDocumentTypeCode(updates.getDocumentTypeCode());
        if (updates.getRetentionDays() != null) existing.setRetentionDays(updates.getRetentionDays());
        if (updates.getAction() != null) existing.setAction(updates.getAction());
        if (updates.getNotifyDaysBeforeAction() != null) existing.setNotifyDaysBeforeAction(updates.getNotifyDaysBeforeAction());
        if (updates.getIsActive() != null) existing.setIsActive(updates.getIsActive());

        return policyRepository.save(existing);
    }

    public void deletePolicy(String id) {
        policyRepository.deleteById(id);
    }

    // Preview what would be affected
    public Map<String, Object> previewRetention() {
        List<DocumentRetentionPolicy> policies = policyRepository.findActive();
        int totalAffected = 0;
        List<Map<String, Object>> details = new ArrayList<>();

        for (DocumentRetentionPolicy policy : policies) {
            try {
                EmployeeDocumentType type = EmployeeDocumentType.valueOf(policy.getDocumentTypeCode());
                LocalDate cutoffDate = LocalDate.now().minusDays(policy.getRetentionDays());

                // Find documents older than the retention period
                // We use expiring documents query with a past date to approximate
                List<EmployeeDocument> allActive = documentRepository.findExpiringDocuments(LocalDate.of(9999, 12, 31));
                long count = allActive.stream()
                        .filter(d -> type.equals(d.getDocumentType()))
                        .filter(d -> d.getCreatedAt() != null && d.getCreatedAt().toLocalDate().isBefore(cutoffDate))
                        .count();

                totalAffected += count;
                details.add(Map.of(
                        "documentType", policy.getDocumentTypeCode(),
                        "action", policy.getAction(),
                        "retentionDays", policy.getRetentionDays(),
                        "affectedCount", count
                ));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid document type in retention policy: {}", policy.getDocumentTypeCode());
            }
        }

        return Map.of(
                "totalAffected", totalAffected,
                "policies", details
        );
    }

    // Apply retention policies (called by scheduler)
    public void applyRetentionPolicies() {
        logger.info("Starting document retention policy enforcement");
        List<DocumentRetentionPolicy> policies = policyRepository.findActive();

        for (DocumentRetentionPolicy policy : policies) {
            try {
                EmployeeDocumentType type = EmployeeDocumentType.valueOf(policy.getDocumentTypeCode());
                LocalDate cutoffDate = LocalDate.now().minusDays(policy.getRetentionDays());

                List<EmployeeDocument> allDocs = documentRepository.findExpiringDocuments(LocalDate.of(9999, 12, 31));
                List<EmployeeDocument> affected = allDocs.stream()
                        .filter(d -> type.equals(d.getDocumentType()))
                        .filter(d -> d.getCreatedAt() != null && d.getCreatedAt().toLocalDate().isBefore(cutoffDate))
                        .toList();

                for (EmployeeDocument doc : affected) {
                    switch (policy.getAction()) {
                        case "DELETE":
                            doc.setIsActive(false);
                            doc.setUpdatedAt(LocalDateTime.now());
                            documentRepository.save(doc);
                            auditLogService.logDocumentAction("SYSTEM", "DOCUMENT_RETENTION_DELETED",
                                    "EMPLOYEE_DOCUMENT", doc.getDocumentType() + ": " + doc.getFilename());
                            break;
                        case "ARCHIVE":
                            doc.setIsActive(false);
                            doc.setUpdatedAt(LocalDateTime.now());
                            documentRepository.save(doc);
                            auditLogService.logDocumentAction("SYSTEM", "DOCUMENT_RETENTION_ARCHIVED",
                                    "EMPLOYEE_DOCUMENT", doc.getDocumentType() + ": " + doc.getFilename());
                            break;
                        case "NOTIFY":
                            auditLogService.logDocumentAction("SYSTEM", "DOCUMENT_RETENTION_NOTIFY",
                                    "EMPLOYEE_DOCUMENT", doc.getDocumentType() + ": " + doc.getFilename() + " (past retention period)");
                            break;
                    }
                }

                logger.info("Retention policy applied for {}: {} documents affected", type, affected.size());
            } catch (IllegalArgumentException e) {
                logger.warn("Skipping invalid retention policy: {}", policy.getDocumentTypeCode());
            }
        }

        logger.info("Document retention policy enforcement completed");
    }
}
