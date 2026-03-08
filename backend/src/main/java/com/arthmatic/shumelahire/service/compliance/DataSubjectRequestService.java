package com.arthmatic.shumelahire.service.compliance;

import com.arthmatic.shumelahire.dto.compliance.DataSubjectRequestResponse;
import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;
import com.arthmatic.shumelahire.entity.compliance.DsarRequestType;
import com.arthmatic.shumelahire.entity.compliance.DsarStatus;
import com.arthmatic.shumelahire.repository.compliance.DataSubjectRequestRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class DataSubjectRequestService {

    private static final Logger logger = LoggerFactory.getLogger(DataSubjectRequestService.class);

    @Autowired
    private DataSubjectRequestRepository dsarRepository;

    @Autowired
    private AuditLogService auditLogService;

    public DataSubjectRequestResponse createRequest(String requesterName, String requesterEmail,
                                                     String requestType, String description) {
        DataSubjectRequest dsar = new DataSubjectRequest();
        dsar.setRequesterName(requesterName);
        dsar.setRequesterEmail(requesterEmail);
        dsar.setRequestType(DsarRequestType.valueOf(requestType));
        dsar.setDescription(description);
        dsar.setStatus(DsarStatus.RECEIVED);
        dsar.setDueDate(LocalDate.now().plusDays(30)); // POPIA requires response within 30 days

        dsar = dsarRepository.save(dsar);

        auditLogService.saveLog("SYSTEM", "CREATE", "DSAR",
                dsar.getId().toString(), "Created DSAR from " + requesterEmail + " type: " + requestType);
        logger.info("DSAR created: {} from {}", requestType, requesterEmail);

        return DataSubjectRequestResponse.fromEntity(dsar);
    }

    @Transactional(readOnly = true)
    public DataSubjectRequestResponse getRequest(Long id) {
        DataSubjectRequest dsar = dsarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DSAR not found: " + id));
        return DataSubjectRequestResponse.fromEntity(dsar);
    }

    @Transactional(readOnly = true)
    public Page<DataSubjectRequestResponse> getAllRequests(Pageable pageable) {
        return dsarRepository.findAll(pageable).map(DataSubjectRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DataSubjectRequestResponse> getRequestsByStatus(String status, Pageable pageable) {
        return dsarRepository.findByStatus(DsarStatus.valueOf(status), pageable)
                .map(DataSubjectRequestResponse::fromEntity);
    }

    public DataSubjectRequestResponse updateStatus(Long id, String status, String response) {
        DataSubjectRequest dsar = dsarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DSAR not found: " + id));

        dsar.setStatus(DsarStatus.valueOf(status));
        if (response != null) {
            dsar.setResponse(response);
        }
        if ("COMPLETED".equals(status) || "REJECTED".equals(status)) {
            dsar.setCompletedAt(LocalDateTime.now());
        }

        dsar = dsarRepository.save(dsar);

        auditLogService.saveLog("SYSTEM", "UPDATE_STATUS", "DSAR",
                id.toString(), "Updated DSAR status to " + status);
        return DataSubjectRequestResponse.fromEntity(dsar);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDsarStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRequests", dsarRepository.count());
        stats.put("received", dsarRepository.countByStatus(DsarStatus.RECEIVED));
        stats.put("inProgress", dsarRepository.countByStatus(DsarStatus.IN_PROGRESS));
        stats.put("completed", dsarRepository.countByStatus(DsarStatus.COMPLETED));
        stats.put("rejected", dsarRepository.countByStatus(DsarStatus.REJECTED));
        return stats;
    }
}
