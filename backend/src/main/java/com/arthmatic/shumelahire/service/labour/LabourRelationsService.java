package com.arthmatic.shumelahire.service.labour;

import com.arthmatic.shumelahire.dto.labour.DisciplinaryCaseResponse;
import com.arthmatic.shumelahire.dto.labour.GrievanceResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.labour.*;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.DisciplinaryCaseDataRepository;
import com.arthmatic.shumelahire.repository.GrievanceDataRepository;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class LabourRelationsService {

    private static final Logger logger = LoggerFactory.getLogger(LabourRelationsService.class);

    @Autowired
    private DisciplinaryCaseDataRepository disciplinaryCaseRepository;

    @Autowired
    private GrievanceDataRepository grievanceRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    // ---- Disciplinary Cases ----

    public DisciplinaryCaseResponse createDisciplinaryCase(Long employeeId, String offenceCategory,
                                                            String offenceDescription, LocalDate incidentDate,
                                                            Long createdBy) {
        Employee employee = employeeRepository.findById(String.valueOf(employeeId))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        DisciplinaryCase dc = new DisciplinaryCase();
        dc.setEmployee(employee);
        dc.setOffenceCategory(OffenceCategory.valueOf(offenceCategory));
        dc.setOffenceDescription(offenceDescription);
        dc.setIncidentDate(incidentDate);
        dc.setStatus(DisciplinaryCaseStatus.OPEN);
        dc.setCreatedBy(createdBy);

        dc = disciplinaryCaseRepository.save(dc);

        auditLogService.saveLog(createdBy.toString(), "CREATE", "DISCIPLINARY_CASE",
                dc.getId().toString(), "Created disciplinary case for employee " + employeeId);
        logger.info("Disciplinary case created for employee {}", employeeId);

        notificationService.notifyApprovalRequired(employeeId, "Disciplinary Case",
                "A disciplinary case has been opened");

        return DisciplinaryCaseResponse.fromEntity(dc);
    }

    @Transactional(readOnly = true)
    public DisciplinaryCaseResponse getDisciplinaryCase(Long id) {
        DisciplinaryCase dc = disciplinaryCaseRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Disciplinary case not found: " + id));
        return DisciplinaryCaseResponse.fromEntity(dc);
    }

    @Transactional(readOnly = true)
    public List<DisciplinaryCaseResponse> getAllDisciplinaryCases() {
        return disciplinaryCaseRepository.findAll().stream()
                .map(DisciplinaryCaseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisciplinaryCaseResponse> getDisciplinaryCasesByEmployee(Long employeeId) {
        return disciplinaryCaseRepository.findByEmployeeId(String.valueOf(employeeId)).stream()
                .map(DisciplinaryCaseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisciplinaryCaseResponse> getDisciplinaryCasesByStatus(String status) {
        return disciplinaryCaseRepository.findByStatus(DisciplinaryCaseStatus.valueOf(status)).stream()
                .map(DisciplinaryCaseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public DisciplinaryCaseResponse updateDisciplinaryCase(Long id, String status, String outcome,
                                                            LocalDate hearingDate, String notes) {
        DisciplinaryCase dc = disciplinaryCaseRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Disciplinary case not found: " + id));

        if (status != null) dc.setStatus(DisciplinaryCaseStatus.valueOf(status));
        if (outcome != null) {
            dc.setOutcome(DisciplinaryOutcome.valueOf(outcome));
            dc.setOutcomeDate(LocalDate.now());
        }
        if (hearingDate != null) dc.setHearingDate(hearingDate);
        if (notes != null) dc.setNotes(notes);

        dc = disciplinaryCaseRepository.save(dc);

        auditLogService.saveLog("SYSTEM", "UPDATE", "DISCIPLINARY_CASE",
                id.toString(), "Updated disciplinary case");

        if (status != null) {
            notificationService.sendInternalNotification(dc.getEmployee().getId(), "Disciplinary Case Update",
                    "Case status changed to " + status,
                    NotificationType.APPROVAL_REQUIRED, NotificationPriority.HIGH);
        }

        return DisciplinaryCaseResponse.fromEntity(dc);
    }

    // ---- Grievances ----

    public GrievanceResponse fileGrievance(Long employeeId, String grievanceType,
                                           String description, Long assignedToId) {
        Employee employee = employeeRepository.findById(String.valueOf(employeeId))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        Grievance grievance = new Grievance();
        grievance.setEmployee(employee);
        grievance.setGrievanceType(GrievanceType.valueOf(grievanceType));
        grievance.setDescription(description);
        grievance.setStatus(GrievanceStatus.FILED);
        grievance.setFiledDate(LocalDate.now());

        if (assignedToId != null) {
            Employee assignedTo = employeeRepository.findById(String.valueOf(assignedToId)).orElse(null);
            grievance.setAssignedTo(assignedTo);
        }

        grievance = grievanceRepository.save(grievance);

        auditLogService.saveLog(employeeId.toString(), "FILE", "GRIEVANCE",
                grievance.getId().toString(), "Filed grievance: " + grievanceType);
        logger.info("Grievance filed by employee {}", employeeId);

        if (assignedToId != null) {
            notificationService.notifyApprovalRequired(assignedToId, "Grievance Filed",
                    employee.getFullName() + " has filed a grievance");
        }
        notificationService.sendInternalNotification(employeeId, "Grievance Received",
                "Your grievance has been filed and assigned",
                NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);

        return GrievanceResponse.fromEntity(grievance);
    }

    @Transactional(readOnly = true)
    public GrievanceResponse getGrievance(Long id) {
        Grievance grievance = grievanceRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Grievance not found: " + id));
        return GrievanceResponse.fromEntity(grievance);
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getAllGrievances() {
        return grievanceRepository.findAll().stream()
                .map(GrievanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getGrievancesByEmployee(Long employeeId) {
        return grievanceRepository.findByEmployeeId(String.valueOf(employeeId)).stream()
                .map(GrievanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getGrievancesByStatus(String status) {
        return grievanceRepository.findByStatus(GrievanceStatus.valueOf(status)).stream()
                .map(GrievanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public GrievanceResponse updateGrievance(Long id, String status, String resolution) {
        Grievance grievance = grievanceRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Grievance not found: " + id));

        if (status != null) grievance.setStatus(GrievanceStatus.valueOf(status));
        if (resolution != null) grievance.setResolution(resolution);
        if ("RESOLVED".equals(status)) {
            grievance.setResolvedDate(LocalDate.now());
        }

        grievance = grievanceRepository.save(grievance);

        auditLogService.saveLog("SYSTEM", "UPDATE", "GRIEVANCE",
                id.toString(), "Updated grievance status to " + status);

        if (status != null) {
            notificationService.sendInternalNotification(grievance.getEmployee().getId(), "Grievance Update",
                    "Your grievance status changed to " + status,
                    NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);
            if (grievance.getAssignedTo() != null) {
                notificationService.sendInternalNotification(grievance.getAssignedTo().getId(), "Grievance Update",
                        grievance.getEmployee().getFullName() + "'s grievance → " + status,
                        NotificationType.APPROVAL_REQUIRED, NotificationPriority.MEDIUM);
            }
        }

        return GrievanceResponse.fromEntity(grievance);
    }

    // ---- Dashboard Stats ----

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("openCases", disciplinaryCaseRepository.countByStatus(DisciplinaryCaseStatus.OPEN));
        stats.put("investigationCases", disciplinaryCaseRepository.countByStatus(DisciplinaryCaseStatus.INVESTIGATION));
        stats.put("hearingScheduledCases", disciplinaryCaseRepository.countByStatus(DisciplinaryCaseStatus.HEARING_SCHEDULED));
        stats.put("closedCases", disciplinaryCaseRepository.countByStatus(DisciplinaryCaseStatus.CLOSED));
        stats.put("filedGrievances", grievanceRepository.countByStatus(GrievanceStatus.FILED));
        stats.put("underReviewGrievances", grievanceRepository.countByStatus(GrievanceStatus.UNDER_REVIEW));
        stats.put("resolvedGrievances", grievanceRepository.countByStatus(GrievanceStatus.RESOLVED));
        stats.put("escalatedGrievances", grievanceRepository.countByStatus(GrievanceStatus.ESCALATED));
        return stats;
    }
}
