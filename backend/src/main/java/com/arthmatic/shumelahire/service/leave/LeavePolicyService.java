package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.LeavePolicyRequest;
import com.arthmatic.shumelahire.dto.leave.LeavePolicyResponse;
import com.arthmatic.shumelahire.entity.leave.AccrualMethod;
import com.arthmatic.shumelahire.entity.leave.LeavePolicy;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeavePolicyDataRepository;
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
public class LeavePolicyService {

    private static final Logger logger = LoggerFactory.getLogger(LeavePolicyService.class);

    @Autowired
    private LeavePolicyDataRepository leavePolicyRepository;

    @Autowired
    private LeaveTypeDataRepository leaveTypeRepository;

    @Autowired
    private AuditLogService auditLogService;

    public LeavePolicyResponse create(LeavePolicyRequest request, String userId) {
        LeaveType leaveType = leaveTypeRepository.findById(String.valueOf(request.getLeaveTypeId()))
                .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + request.getLeaveTypeId()));

        LeavePolicy policy = new LeavePolicy();
        policy.setLeaveType(leaveType);
        mapRequestToEntity(request, policy);
        policy = leavePolicyRepository.save(policy);

        auditLogService.saveLog(userId, "CREATE", "LEAVE_POLICY",
                policy.getId().toString(), "Created leave policy: " + policy.getName());

        logger.info("Leave policy created: {}", policy.getName());
        return LeavePolicyResponse.fromEntity(policy);
    }

    public LeavePolicyResponse update(Long id, LeavePolicyRequest request, String userId) {
        LeavePolicy policy = leavePolicyRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Leave policy not found: " + id));

        if (!policy.getLeaveType().getId().equals(request.getLeaveTypeId())) {
            LeaveType leaveType = leaveTypeRepository.findById(String.valueOf(request.getLeaveTypeId()))
                    .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + request.getLeaveTypeId()));
            policy.setLeaveType(leaveType);
        }

        mapRequestToEntity(request, policy);
        policy = leavePolicyRepository.save(policy);

        auditLogService.saveLog(userId, "UPDATE", "LEAVE_POLICY",
                id.toString(), "Updated leave policy: " + policy.getName());

        return LeavePolicyResponse.fromEntity(policy);
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyResponse> getAll() {
        return leavePolicyRepository.findAll().stream()
                .map(LeavePolicyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyResponse> getActive() {
        return leavePolicyRepository.findByIsActiveTrue().stream()
                .map(LeavePolicyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyResponse> getByLeaveType(Long leaveTypeId) {
        return leavePolicyRepository.findByLeaveTypeId(String.valueOf(leaveTypeId)).stream()
                .map(LeavePolicyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void mapRequestToEntity(LeavePolicyRequest request, LeavePolicy entity) {
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setAccrualMethod(AccrualMethod.valueOf(request.getAccrualMethod()));
        entity.setDaysPerCycle(request.getDaysPerCycle());
        if (request.getCycleStartMonth() != null) entity.setCycleStartMonth(request.getCycleStartMonth());
        if (request.getMinServiceMonths() != null) entity.setMinServiceMonths(request.getMinServiceMonths());
        entity.setApplicableEmploymentTypes(request.getApplicableEmploymentTypes());
        entity.setApplicableDepartments(request.getApplicableDepartments());
        if (request.getAllowNegativeBalance() != null) entity.setAllowNegativeBalance(request.getAllowNegativeBalance());
        entity.setMaxConsecutiveDays(request.getMaxConsecutiveDays());
        if (request.getMinNoticeDays() != null) entity.setMinNoticeDays(request.getMinNoticeDays());
    }
}
