package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.LeaveTypeRequest;
import com.arthmatic.shumelahire.dto.leave.LeaveTypeResponse;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeaveTypeDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveTypeService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveTypeService.class);

    @Autowired
    private LeaveTypeDataRepository leaveTypeRepository;

    @Autowired
    private AuditLogService auditLogService;

    public LeaveTypeResponse create(LeaveTypeRequest request, String userId) {
        if (leaveTypeRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Leave type code already exists: " + request.getCode());
        }

        LeaveType leaveType = new LeaveType();
        mapRequestToEntity(request, leaveType);
        leaveType = leaveTypeRepository.save(leaveType);

        auditLogService.saveLog(userId, "CREATE", "LEAVE_TYPE",
                leaveType.getId().toString(), "Created leave type: " + leaveType.getName());

        logger.info("Leave type created: {} ({})", leaveType.getName(), leaveType.getCode());
        return LeaveTypeResponse.fromEntity(leaveType);
    }

    public LeaveTypeResponse update(Long id, LeaveTypeRequest request, String userId) {
        LeaveType leaveType = leaveTypeRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + id));

        mapRequestToEntity(request, leaveType);
        leaveType = leaveTypeRepository.save(leaveType);

        auditLogService.saveLog(userId, "UPDATE", "LEAVE_TYPE",
                id.toString(), "Updated leave type: " + leaveType.getName());

        return LeaveTypeResponse.fromEntity(leaveType);
    }

    @Transactional(readOnly = true)
    public LeaveTypeResponse getById(Long id) {
        LeaveType leaveType = leaveTypeRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + id));
        return LeaveTypeResponse.fromEntity(leaveType);
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getAll() {
        return leaveTypeRepository.findAll().stream()
                .map(LeaveTypeResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getActive() {
        return leaveTypeRepository.findByIsActiveTrue().stream()
                .map(LeaveTypeResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void mapRequestToEntity(LeaveTypeRequest request, LeaveType entity) {
        entity.setName(request.getName());
        entity.setCode(request.getCode());
        entity.setDescription(request.getDescription());
        entity.setDefaultDaysPerYear(request.getDefaultDaysPerYear());
        if (request.getMaxCarryForwardDays() != null) entity.setMaxCarryForwardDays(request.getMaxCarryForwardDays());
        if (request.getRequiresMedicalCertificate() != null) entity.setRequiresMedicalCertificate(request.getRequiresMedicalCertificate());
        if (request.getMedicalCertThresholdDays() != null) entity.setMedicalCertThresholdDays(request.getMedicalCertThresholdDays());
        if (request.getIsPaid() != null) entity.setIsPaid(request.getIsPaid());
        if (request.getAllowEncashment() != null) entity.setAllowEncashment(request.getAllowEncashment());
        if (request.getEncashmentRate() != null) entity.setEncashmentRate(request.getEncashmentRate());
        if (request.getColorCode() != null) entity.setColorCode(request.getColorCode());
    }
}
