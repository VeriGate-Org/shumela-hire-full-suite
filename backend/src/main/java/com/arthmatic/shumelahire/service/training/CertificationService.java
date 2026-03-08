package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.dto.training.CertificationRequest;
import com.arthmatic.shumelahire.dto.training.CertificationResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.training.Certification;
import com.arthmatic.shumelahire.entity.training.CertificationStatus;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.training.CertificationRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CertificationService {

    private static final Logger logger = LoggerFactory.getLogger(CertificationService.class);

    @Autowired
    private CertificationRepository certificationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<CertificationResponse> getAll() {
        return certificationRepository.findAll().stream()
                .map(CertificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getByEmployee(Long employeeId) {
        return certificationRepository.findByEmployeeId(employeeId).stream()
                .map(CertificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificationResponse getById(Long id) {
        Certification cert = certificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Certification not found: " + id));
        return CertificationResponse.fromEntity(cert);
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getExpiring(int daysAhead) {
        LocalDate now = LocalDate.now();
        LocalDate threshold = now.plusDays(daysAhead);
        return certificationRepository.findExpiringSoon(now, threshold).stream()
                .map(CertificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getExpired() {
        return certificationRepository.findExpired(LocalDate.now()).stream()
                .map(CertificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public CertificationResponse create(CertificationRequest request, String userId) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        Certification cert = new Certification();
        cert.setEmployee(employee);
        cert.setName(request.getName());
        cert.setIssuingBody(request.getIssuingBody());
        cert.setCertificationNumber(request.getCertificationNumber());
        cert.setIssueDate(request.getIssueDate());
        cert.setExpiryDate(request.getExpiryDate());
        cert.setStatus(request.getStatus() != null ? CertificationStatus.valueOf(request.getStatus()) : CertificationStatus.ACTIVE);
        cert.setDocumentUrl(request.getDocumentUrl());

        Certification saved = certificationRepository.save(cert);
        auditLogService.saveLog(userId, "CREATE", "CERTIFICATION", saved.getId().toString(),
                "Created certification: " + saved.getName() + " for " + employee.getFullName());
        logger.info("Created certification '{}' for employee {}", saved.getName(), employee.getFullName());

        return CertificationResponse.fromEntity(saved);
    }

    public CertificationResponse update(Long id, CertificationRequest request, String userId) {
        Certification cert = certificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Certification not found: " + id));

        cert.setName(request.getName());
        cert.setIssuingBody(request.getIssuingBody());
        cert.setCertificationNumber(request.getCertificationNumber());
        cert.setIssueDate(request.getIssueDate());
        cert.setExpiryDate(request.getExpiryDate());
        if (request.getStatus() != null) {
            cert.setStatus(CertificationStatus.valueOf(request.getStatus()));
        }
        cert.setDocumentUrl(request.getDocumentUrl());

        Certification saved = certificationRepository.save(cert);
        auditLogService.saveLog(userId, "UPDATE", "CERTIFICATION", saved.getId().toString(),
                "Updated certification: " + saved.getName());

        return CertificationResponse.fromEntity(saved);
    }

    public void revoke(Long id, String userId) {
        Certification cert = certificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Certification not found: " + id));
        cert.setStatus(CertificationStatus.REVOKED);
        certificationRepository.save(cert);
        auditLogService.saveLog(userId, "REVOKE", "CERTIFICATION", id.toString(),
                "Revoked certification: " + cert.getName());
    }
}
