package com.arthmatic.shumelahire.service.compliance;

import com.arthmatic.shumelahire.dto.compliance.ConsentRecordResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.compliance.ConsentRecord;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.compliance.ConsentRecordRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConsentService {

    private static final Logger logger = LoggerFactory.getLogger(ConsentService.class);

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    public ConsentRecordResponse grantConsent(Long employeeId, String consentType,
                                              String purpose, String ipAddress) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        ConsentRecord record = consentRecordRepository
                .findByEmployeeIdAndConsentType(employeeId, consentType)
                .orElse(new ConsentRecord());

        record.setEmployee(employee);
        record.setConsentType(consentType);
        record.setPurpose(purpose);
        record.setIsGranted(true);
        record.setGrantedAt(LocalDateTime.now());
        record.setWithdrawnAt(null);
        record.setIpAddress(ipAddress);

        record = consentRecordRepository.save(record);

        auditLogService.saveLog(employeeId.toString(), "GRANT_CONSENT", "CONSENT",
                record.getId().toString(), "Granted consent: " + consentType);
        logger.info("Employee {} granted consent for {}", employeeId, consentType);

        return ConsentRecordResponse.fromEntity(record);
    }

    public ConsentRecordResponse withdrawConsent(Long employeeId, String consentType) {
        ConsentRecord record = consentRecordRepository
                .findByEmployeeIdAndConsentType(employeeId, consentType)
                .orElseThrow(() -> new IllegalArgumentException("Consent record not found"));

        record.setIsGranted(false);
        record.setWithdrawnAt(LocalDateTime.now());
        record = consentRecordRepository.save(record);

        auditLogService.saveLog(employeeId.toString(), "WITHDRAW_CONSENT", "CONSENT",
                record.getId().toString(), "Withdrew consent: " + consentType);
        logger.info("Employee {} withdrew consent for {}", employeeId, consentType);

        return ConsentRecordResponse.fromEntity(record);
    }

    @Transactional(readOnly = true)
    public List<ConsentRecordResponse> getConsentsForEmployee(Long employeeId) {
        return consentRecordRepository.findByEmployeeId(employeeId).stream()
                .map(ConsentRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ConsentRecordResponse> getAllConsents(Pageable pageable) {
        return consentRecordRepository.findAll(pageable).map(ConsentRecordResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConsentStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGranted", consentRecordRepository.countByIsGrantedTrue());
        stats.put("totalWithdrawn", consentRecordRepository.countByIsGrantedFalse());
        stats.put("totalRecords", consentRecordRepository.count());
        return stats;
    }
}
