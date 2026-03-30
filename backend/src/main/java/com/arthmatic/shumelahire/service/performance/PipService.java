package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.dto.performance.PipCreateRequest;
import com.arthmatic.shumelahire.dto.performance.PipResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.PerformanceImprovementPlanDataRepository;
import com.arthmatic.shumelahire.repository.PipMilestoneDataRepository;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class PipService {

    private static final Logger logger = LoggerFactory.getLogger(PipService.class);

    @Autowired
    private PerformanceImprovementPlanDataRepository pipRepository;

    @Autowired
    private PipMilestoneDataRepository milestoneRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public PipResponse createPip(PipCreateRequest request) {
        Employee employee = employeeRepository.findById(String.valueOf(request.getEmployeeId()))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        Employee manager = employeeRepository.findById(String.valueOf(request.getManagerId()))
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

        notificationService.notifyApprovalRequired(employee.getId(), "Performance Improvement Plan",
                "PIP created by " + manager.getFullName());

        return PipResponse.fromEntity(pipRepository.findById(String.valueOf(pip.getId())).orElse(pip));
    }

    @Transactional(readOnly = true)
    public PipResponse getPip(Long id) {
        PerformanceImprovementPlan pip = pipRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("PIP not found: " + id));
        return PipResponse.fromEntity(pip);
    }

    @Transactional(readOnly = true)
    public List<PipResponse> getPipsByEmployee(Long employeeId) {
        return pipRepository.findByEmployeeId(String.valueOf(employeeId)).stream()
                .map(PipResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PipResponse> getPipsByManager(Long managerId) {
        return pipRepository.findByManagerId(String.valueOf(managerId)).stream()
                .map(PipResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PipResponse> getActivePips() {
        return pipRepository.findByStatus(PipStatus.ACTIVE).stream()
                .map(PipResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PipResponse updatePipStatus(Long id, String status, String outcome) {
        PerformanceImprovementPlan pip = pipRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("PIP not found: " + id));

        pip.setStatus(PipStatus.valueOf(status));
        if (outcome != null) {
            pip.setOutcome(outcome);
        }
        pip = pipRepository.save(pip);

        auditLogService.saveLog("SYSTEM", "UPDATE_STATUS", "PIP",
                id.toString(), "Updated PIP status to " + status);

        NotificationType notifType = "COMPLETED_SUCCESSFULLY".equals(status) ?
                NotificationType.APPROVAL_GRANTED : NotificationType.APPROVAL_DENIED;
        notificationService.sendInternalNotification(pip.getEmployee().getId(), "PIP Status Updated",
                "Your PIP status changed to " + status, notifType, NotificationPriority.HIGH);

        return PipResponse.fromEntity(pip);
    }

    public void updateMilestoneStatus(Long milestoneId, String status, String evidence) {
        PipMilestone milestone = milestoneRepository.findById(String.valueOf(milestoneId))
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        milestone.setStatus(PipMilestoneStatus.valueOf(status));
        milestone.setEvidence(evidence);
        milestone.setReviewedAt(LocalDateTime.now());
        milestoneRepository.save(milestone);

        auditLogService.saveLog("SYSTEM", "UPDATE_MILESTONE", "PIP_MILESTONE",
                milestoneId.toString(), "Updated milestone status to " + status);

        notificationService.sendInternalNotification(milestone.getPip().getManager().getId(), "PIP Milestone Updated",
                milestone.getPip().getEmployee().getFullName() + " - milestone '" + milestone.getTitle() + "' → " + status,
                NotificationType.APPROVAL_REQUIRED, NotificationPriority.MEDIUM);
    }
}
