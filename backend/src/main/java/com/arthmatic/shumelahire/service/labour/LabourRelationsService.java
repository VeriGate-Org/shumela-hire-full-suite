package com.arthmatic.shumelahire.service.labour;

import com.arthmatic.shumelahire.dto.labour.DisciplinaryCaseResponse;
import com.arthmatic.shumelahire.dto.labour.GrievanceResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.labour.*;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.labour.DisciplinaryCaseRepository;
import com.arthmatic.shumelahire.repository.labour.GrievanceRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class LabourRelationsService {

    private static final Logger logger = LoggerFactory.getLogger(LabourRelationsService.class);

    @Autowired
    private DisciplinaryCaseRepository disciplinaryCaseRepository;

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    // ---- Disciplinary Cases ----

    public DisciplinaryCaseResponse createDisciplinaryCase(Long employeeId, String offenceCategory,
                                                            String offenceDescription, LocalDate incidentDate,
                                                            Long createdBy) {
        Employee employee = employeeRepository.findById(employeeId)
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

        return DisciplinaryCaseResponse.fromEntity(dc);
    }

    @Transactional(readOnly = true)
    public DisciplinaryCaseResponse getDisciplinaryCase(Long id) {
        DisciplinaryCase dc = disciplinaryCaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disciplinary case not found: " + id));
        return DisciplinaryCaseResponse.fromEntity(dc);
    }

    @Transactional(readOnly = true)
    public Page<DisciplinaryCaseResponse> getAllDisciplinaryCases(Pageable pageable) {
        return disciplinaryCaseRepository.findAll(pageable).map(DisciplinaryCaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DisciplinaryCaseResponse> getDisciplinaryCasesByEmployee(Long employeeId, Pageable pageable) {
        return disciplinaryCaseRepository.findByEmployeeId(employeeId, pageable)
                .map(DisciplinaryCaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DisciplinaryCaseResponse> getDisciplinaryCasesByStatus(String status, Pageable pageable) {
        return disciplinaryCaseRepository.findByStatus(DisciplinaryCaseStatus.valueOf(status), pageable)
                .map(DisciplinaryCaseResponse::fromEntity);
    }

    public DisciplinaryCaseResponse updateDisciplinaryCase(Long id, String status, String outcome,
                                                            LocalDate hearingDate, String notes) {
        DisciplinaryCase dc = disciplinaryCaseRepository.findById(id)
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
        return DisciplinaryCaseResponse.fromEntity(dc);
    }

    // ---- Grievances ----

    public GrievanceResponse fileGrievance(Long employeeId, String grievanceType,
                                           String description, Long assignedToId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        Grievance grievance = new Grievance();
        grievance.setEmployee(employee);
        grievance.setGrievanceType(GrievanceType.valueOf(grievanceType));
        grievance.setDescription(description);
        grievance.setStatus(GrievanceStatus.FILED);
        grievance.setFiledDate(LocalDate.now());

        if (assignedToId != null) {
            Employee assignedTo = employeeRepository.findById(assignedToId).orElse(null);
            grievance.setAssignedTo(assignedTo);
        }

        grievance = grievanceRepository.save(grievance);

        auditLogService.saveLog(employeeId.toString(), "FILE", "GRIEVANCE",
                grievance.getId().toString(), "Filed grievance: " + grievanceType);
        logger.info("Grievance filed by employee {}", employeeId);

        return GrievanceResponse.fromEntity(grievance);
    }

    @Transactional(readOnly = true)
    public GrievanceResponse getGrievance(Long id) {
        Grievance grievance = grievanceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grievance not found: " + id));
        return GrievanceResponse.fromEntity(grievance);
    }

    @Transactional(readOnly = true)
    public Page<GrievanceResponse> getAllGrievances(Pageable pageable) {
        return grievanceRepository.findAll(pageable).map(GrievanceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<GrievanceResponse> getGrievancesByEmployee(Long employeeId, Pageable pageable) {
        return grievanceRepository.findByEmployeeId(employeeId, pageable).map(GrievanceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<GrievanceResponse> getGrievancesByStatus(String status, Pageable pageable) {
        return grievanceRepository.findByStatus(GrievanceStatus.valueOf(status), pageable)
                .map(GrievanceResponse::fromEntity);
    }

    public GrievanceResponse updateGrievance(Long id, String status, String resolution) {
        Grievance grievance = grievanceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grievance not found: " + id));

        if (status != null) grievance.setStatus(GrievanceStatus.valueOf(status));
        if (resolution != null) grievance.setResolution(resolution);
        if ("RESOLVED".equals(status)) {
            grievance.setResolvedDate(LocalDate.now());
        }

        grievance = grievanceRepository.save(grievance);

        auditLogService.saveLog("SYSTEM", "UPDATE", "GRIEVANCE",
                id.toString(), "Updated grievance status to " + status);
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
