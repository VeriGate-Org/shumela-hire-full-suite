package com.arthmatic.shumelahire.service.compliance;

import com.arthmatic.shumelahire.dto.compliance.DataSubjectRequestResponse;
import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;
import com.arthmatic.shumelahire.entity.compliance.DsarRequestType;
import com.arthmatic.shumelahire.entity.compliance.DsarStatus;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.DataSubjectRequestDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class DataSubjectRequestService {

    private static final Logger logger = LoggerFactory.getLogger(DataSubjectRequestService.class);

    @Autowired
    private DataSubjectRequestDataRepository dsarRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmployeeDataRepository employeeRepository;

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

        employeeRepository.findByEmail(requesterEmail).ifPresent(emp ->
                notificationService.sendInternalNotification(emp.getId(), "Data Subject Request",
                        "Your DSAR has been received and is being processed",
                        NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM));

        return DataSubjectRequestResponse.fromEntity(dsar);
    }

    @Transactional(readOnly = true)
    public DataSubjectRequestResponse getRequest(Long id) {
        DataSubjectRequest dsar = dsarRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("DSAR not found: " + id));
        return DataSubjectRequestResponse.fromEntity(dsar);
    }

    @Transactional(readOnly = true)
    public List<DataSubjectRequestResponse> getAllRequests() {
        return dsarRepository.findAll().stream()
                .map(DataSubjectRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DataSubjectRequestResponse> getRequestsByStatus(String status) {
        return dsarRepository.findByStatus(DsarStatus.valueOf(status)).stream()
                .map(DataSubjectRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public DataSubjectRequestResponse updateStatus(Long id, String status, String response) {
        DataSubjectRequest dsar = dsarRepository.findById(String.valueOf(id))
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

        Optional<Employee> requesterOpt = employeeRepository.findByEmail(dsar.getRequesterEmail());
        if (requesterOpt.isPresent()) {
            Long empId = requesterOpt.get().getId();
            switch (status) {
                case "COMPLETED":
                    notificationService.notifyApprovalGranted(empId, "Data Subject Request", "Your request has been completed");
                    break;
                case "REJECTED":
                    notificationService.notifyApprovalDenied(empId, "Data Subject Request", "Your request", response);
                    break;
                case "IN_PROGRESS":
                    notificationService.sendInternalNotification(empId, "Data Subject Request",
                            "Your request is now being processed",
                            NotificationType.APPROVAL_GRANTED, NotificationPriority.LOW);
                    break;
            }
        }

        return DataSubjectRequestResponse.fromEntity(dsar);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDsarStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRequests", (long) dsarRepository.findAll().size());
        stats.put("received", dsarRepository.countByStatus(DsarStatus.RECEIVED));
        stats.put("inProgress", dsarRepository.countByStatus(DsarStatus.IN_PROGRESS));
        stats.put("completed", dsarRepository.countByStatus(DsarStatus.COMPLETED));
        stats.put("rejected", dsarRepository.countByStatus(DsarStatus.REJECTED));
        return stats;
    }
}
