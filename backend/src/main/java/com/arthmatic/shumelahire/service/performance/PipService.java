package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.dto.performance.PipCreateRequest;
import com.arthmatic.shumelahire.dto.performance.PipResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.performance.PerformanceImprovementPlanRepository;
import com.arthmatic.shumelahire.repository.performance.PipMilestoneRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class PipService {

    private static final Logger logger = LoggerFactory.getLogger(PipService.class);

    @Autowired
    private PerformanceImprovementPlanRepository pipRepository;

    @Autowired
    private PipMilestoneRepository milestoneRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    public PipResponse createPip(PipCreateRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + request.getManagerId()));

        PerformanceImprovementPlan pip = new PerformanceImprovementPlan();
        pip.setEmployee(employee);
        pip.setManager(manager);
        pip.setReason(request.getReason());
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setStatus(PipStatus.ACTIVE);

        pip = pipRepository.save(pip);

        if (request.getMilestones() != null) {
            for (PipCreateRequest.MilestoneRequest mr : request.getMilestones()) {
                PipMilestone milestone = new PipMilestone();
                milestone.setPip(pip);
                milestone.setTitle(mr.getTitle());
                milestone.setDescription(mr.getDescription());
                milestone.setTargetDate(mr.getTargetDate());
                milestone.setStatus(PipMilestoneStatus.PENDING);
                milestoneRepository.save(milestone);
            }
        }

        auditLogService.saveLog(request.getManagerId().toString(), "CREATE", "PIP",
                pip.getId().toString(), "Created PIP for employee " + request.getEmployeeId());
        logger.info("PIP created for employee {} by manager {}", request.getEmployeeId(), request.getManagerId());

        return PipResponse.fromEntity(pipRepository.findById(pip.getId()).orElse(pip));
    }

    @Transactional(readOnly = true)
    public PipResponse getPip(Long id) {
        PerformanceImprovementPlan pip = pipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PIP not found: " + id));
        return PipResponse.fromEntity(pip);
    }

    @Transactional(readOnly = true)
    public Page<PipResponse> getPipsByEmployee(Long employeeId, Pageable pageable) {
        return pipRepository.findByEmployeeId(employeeId, pageable).map(PipResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<PipResponse> getPipsByManager(Long managerId, Pageable pageable) {
        return pipRepository.findByManagerId(managerId, pageable).map(PipResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<PipResponse> getActivePips(Pageable pageable) {
        return pipRepository.findByStatus(PipStatus.ACTIVE, pageable).map(PipResponse::fromEntity);
    }

    public PipResponse updatePipStatus(Long id, String status, String outcome) {
        PerformanceImprovementPlan pip = pipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PIP not found: " + id));

        pip.setStatus(PipStatus.valueOf(status));
        if (outcome != null) {
            pip.setOutcome(outcome);
        }
        pip = pipRepository.save(pip);

        auditLogService.saveLog("SYSTEM", "UPDATE_STATUS", "PIP",
                id.toString(), "Updated PIP status to " + status);
        return PipResponse.fromEntity(pip);
    }

    public void updateMilestoneStatus(Long milestoneId, String status, String evidence) {
        PipMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        milestone.setStatus(PipMilestoneStatus.valueOf(status));
        milestone.setEvidence(evidence);
        milestone.setReviewedAt(LocalDateTime.now());
        milestoneRepository.save(milestone);

        auditLogService.saveLog("SYSTEM", "UPDATE_MILESTONE", "PIP_MILESTONE",
                milestoneId.toString(), "Updated milestone status to " + status);
    }
}
