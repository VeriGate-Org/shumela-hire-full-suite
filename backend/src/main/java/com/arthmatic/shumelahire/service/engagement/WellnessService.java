package com.arthmatic.shumelahire.service.engagement;

import com.arthmatic.shumelahire.dto.engagement.WellnessProgramCreateRequest;
import com.arthmatic.shumelahire.dto.engagement.WellnessProgramResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgram;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgramParticipant;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgramType;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.WellnessProgramParticipantDataRepository;
import com.arthmatic.shumelahire.repository.WellnessProgramDataRepository;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WellnessService {

    private static final Logger logger = LoggerFactory.getLogger(WellnessService.class);

    @Autowired
    private WellnessProgramDataRepository wellnessProgramRepository;

    @Autowired
    private WellnessProgramParticipantDataRepository participantRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public WellnessProgramResponse createProgram(WellnessProgramCreateRequest request) {
        WellnessProgram program = new WellnessProgram();
        program.setName(request.getName());
        program.setDescription(request.getDescription());
        program.setProgramType(WellnessProgramType.valueOf(request.getProgramType()));
        program.setStartDate(request.getStartDate());
        program.setEndDate(request.getEndDate());
        program.setMaxParticipants(request.getMaxParticipants());
        program.setIsActive(true);

        program = wellnessProgramRepository.save(program);

        auditLogService.saveLog("SYSTEM", "CREATE", "WELLNESS_PROGRAM",
                program.getId().toString(), "Created wellness program: " + program.getName());
        logger.info("Wellness program created: {}", program.getName());

        return enrichWithParticipantCount(WellnessProgramResponse.fromEntity(program), program.getId());
    }

    public WellnessProgramResponse updateProgram(Long id, WellnessProgramCreateRequest request) {
        WellnessProgram program = wellnessProgramRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Wellness program not found: " + id));

        program.setName(request.getName());
        program.setDescription(request.getDescription());
        program.setProgramType(WellnessProgramType.valueOf(request.getProgramType()));
        program.setStartDate(request.getStartDate());
        program.setEndDate(request.getEndDate());
        program.setMaxParticipants(request.getMaxParticipants());

        program = wellnessProgramRepository.save(program);

        auditLogService.saveLog("SYSTEM", "UPDATE", "WELLNESS_PROGRAM",
                program.getId().toString(), "Updated wellness program: " + program.getName());

        return enrichWithParticipantCount(WellnessProgramResponse.fromEntity(program), program.getId());
    }

    @Transactional(readOnly = true)
    public WellnessProgramResponse getProgram(Long id) {
        WellnessProgram program = wellnessProgramRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Wellness program not found: " + id));
        return enrichWithParticipantCount(WellnessProgramResponse.fromEntity(program), id);
    }

    @Transactional(readOnly = true)
    public List<WellnessProgramResponse> getActivePrograms() {
        return wellnessProgramRepository.findByIsActiveTrue().stream()
                .map(p -> enrichWithParticipantCount(WellnessProgramResponse.fromEntity(p), p.getId()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WellnessProgramResponse> getAllPrograms() {
        return wellnessProgramRepository.findAll().stream()
                .map(p -> enrichWithParticipantCount(WellnessProgramResponse.fromEntity(p), p.getId()))
                .collect(Collectors.toList());
    }

    public void joinProgram(Long programId, Long employeeId) {
        WellnessProgram program = wellnessProgramRepository.findById(String.valueOf(programId))
                .orElseThrow(() -> new IllegalArgumentException("Wellness program not found: " + programId));

        if (!program.getIsActive()) {
            throw new IllegalArgumentException("Program is not active");
        }

        Employee employee = employeeRepository.findById(String.valueOf(employeeId))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        if (participantRepository.existsByProgramIdAndEmployeeId(String.valueOf(programId), String.valueOf(employeeId))) {
            throw new IllegalArgumentException("Employee is already enrolled in this program");
        }

        if (program.getMaxParticipants() != null) {
            long currentCount = participantRepository.countByProgramId(String.valueOf(programId));
            if (currentCount >= program.getMaxParticipants()) {
                throw new IllegalArgumentException("Program has reached maximum capacity");
            }
        }

        WellnessProgramParticipant participant = new WellnessProgramParticipant();
        participant.setProgram(program);
        participant.setEmployee(employee);
        participantRepository.save(participant);

        auditLogService.saveLog(employeeId.toString(), "JOIN", "WELLNESS_PROGRAM",
                programId.toString(), "Joined wellness program: " + program.getName());
        logger.info("Employee {} joined wellness program {}", employeeId, programId);

        notificationService.sendInternalNotification(employeeId, "Wellness Program",
                "You've joined '" + program.getName() + "'",
                NotificationType.APPROVAL_GRANTED, NotificationPriority.LOW);
    }

    public void leaveProgram(Long programId, Long employeeId) {
        WellnessProgramParticipant participant = participantRepository
                .findByProgramIdAndEmployeeId(String.valueOf(programId), String.valueOf(employeeId))
                .orElseThrow(() -> new IllegalArgumentException("Employee is not enrolled in this program"));

        participantRepository.deleteById(String.valueOf(participant.getId()));

        auditLogService.saveLog(employeeId.toString(), "LEAVE", "WELLNESS_PROGRAM",
                programId.toString(), "Left wellness program");
        logger.info("Employee {} left wellness program {}", employeeId, programId);
    }

    public void deactivateProgram(Long id) {
        WellnessProgram program = wellnessProgramRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Wellness program not found: " + id));
        program.setIsActive(false);
        wellnessProgramRepository.save(program);

        List<WellnessProgramParticipant> participants = participantRepository.findByProgramId(String.valueOf(id));
        for (WellnessProgramParticipant participant : participants) {
            notificationService.sendInternalNotification(participant.getEmployee().getId(), "Wellness Program Ended",
                    "'" + program.getName() + "' has been deactivated",
                    NotificationType.APPROVAL_DENIED, NotificationPriority.LOW);
        }

        auditLogService.saveLog("SYSTEM", "DEACTIVATE", "WELLNESS_PROGRAM",
                id.toString(), "Deactivated wellness program: " + program.getName());
    }

    private WellnessProgramResponse enrichWithParticipantCount(WellnessProgramResponse response, Long programId) {
        response.setCurrentParticipants(participantRepository.countByProgramId(String.valueOf(programId)));
        return response;
    }
}
