package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.employee.EmployeeDocumentResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;
import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeDocumentService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeDocumentService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Autowired
    private EmployeeDocumentDataRepository documentRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AuditLogService auditLogService;

    public EmployeeDocumentResponse uploadDocument(Long employeeId, EmployeeDocumentType type,
                                                    String title, String description,
                                                    LocalDate expiryDate, MultipartFile file) throws IOException {
        logger.info("Uploading {} document for employee: {}", type, employeeId);

        validateFile(file);
        Employee employee = employeeService.findEmployeeById(employeeId);

        String fileUrl = fileStorageService.store(file);

        // Determine version
        List<EmployeeDocument> existing = documentRepository
                .findLatestByEmployeeAndType(String.valueOf(employeeId), type);
        int version = existing.isEmpty() ? 1 : existing.get(0).getVersion() + 1;

        EmployeeDocument document = new EmployeeDocument();
        document.setEmployee(employee);
        document.setDocumentType(type);
        document.setTitle(title);
        document.setDescription(description);
        document.setFilename(file.getOriginalFilename());
        document.setFileUrl(fileUrl);
        document.setFileSize(file.getSize());
        document.setContentType(file.getContentType());
        document.setVersion(version);
        document.setExpiryDate(expiryDate);

        EmployeeDocument saved = documentRepository.save(document);

        auditLogService.logDocumentAction(employeeId.toString(), "EMPLOYEE_DOCUMENT_UPLOADED", "EMPLOYEE_DOCUMENT",
                type + ": " + file.getOriginalFilename());

        logger.info("Employee document uploaded: {} (v{})", saved.getId(), version);
        return EmployeeDocumentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDocumentResponse> getDocuments(Long employeeId) {
        List<EmployeeDocument> documents = documentRepository
                .findActiveByEmployee(String.valueOf(employeeId));
        return documents.stream()
                .map(EmployeeDocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeDocumentResponse> getDocumentsByType(Long employeeId, EmployeeDocumentType type) {
        List<EmployeeDocument> documents = documentRepository
                .findActiveByEmployeeAndType(String.valueOf(employeeId), type);
        return documents.stream()
                .map(EmployeeDocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeDocumentResponse> getExpiringDocuments(int daysAhead) {
        LocalDate expiryThreshold = LocalDate.now().plusDays(daysAhead);
        List<EmployeeDocument> documents = documentRepository.findExpiringDocuments(expiryThreshold);
        return documents.stream()
                .map(EmployeeDocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public void deleteDocument(Long employeeId, Long documentId) {
        logger.info("Deleting document {} for employee: {}", documentId, employeeId);

        EmployeeDocument document = documentRepository.findById(String.valueOf(documentId))
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        if (!document.getEmployee().getId().equals(employeeId)) {
            throw new IllegalArgumentException("Document does not belong to employee");
        }

        // Soft delete
        document.setIsActive(false);
        documentRepository.save(document);

        auditLogService.logDocumentAction(employeeId.toString(), "EMPLOYEE_DOCUMENT_DELETED", "EMPLOYEE_DOCUMENT",
                document.getDocumentType() + ": " + document.getFilename());
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }
    }
}
