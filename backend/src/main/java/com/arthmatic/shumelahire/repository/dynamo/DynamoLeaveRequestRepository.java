package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.leave.HalfDayPeriod;
import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeaveRequestDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LeaveRequestItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoLeaveRequestRepository extends DynamoRepository<LeaveRequestItem, LeaveRequest>
        implements LeaveRequestDataRepository {

    public DynamoLeaveRequestRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, LeaveRequestItem.class);
    }

    @Override
    protected String entityType() {
        return "LEAVE_REQ";
    }

    @Override
    public List<LeaveRequest> findByEmployeeId(String employeeId) {
        String gsi1pk = "LR_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<LeaveRequest> findByEmployeeIdAndStatus(String employeeId, LeaveRequestStatus status) {
        return findByEmployeeId(employeeId).stream()
                .filter(lr -> status.equals(lr.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveRequest> findPendingForApprover(String approverId) {
        return findAll().stream()
                .filter(lr -> lr.getApprover() != null
                        && lr.getApprover().getId() != null
                        && approverId.equals(String.valueOf(lr.getApprover().getId()))
                        && LeaveRequestStatus.PENDING.equals(lr.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveRequest> findByStatus(LeaveRequestStatus status) {
        return findAll().stream()
                .filter(lr -> status.equals(lr.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveRequest> findOverlapping(String employeeId, LocalDate startDate, LocalDate endDate) {
        return findByEmployeeId(employeeId).stream()
                .filter(lr -> lr.getStartDate() != null && lr.getEndDate() != null
                        && !lr.getStartDate().isAfter(endDate) && !lr.getEndDate().isBefore(startDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveRequest> findOverlappingForEmployee(String employeeId, LocalDate startDate, LocalDate endDate) {
        return findOverlapping(employeeId, startDate, endDate);
    }

    @Override
    public long countApprovedByEmployeeAndTypeAndYear(String employeeId, String leaveTypeId, int year) {
        return findByEmployeeId(employeeId).stream()
                .filter(lr -> lr.getLeaveType() != null
                        && lr.getLeaveType().getId() != null
                        && leaveTypeId.equals(String.valueOf(lr.getLeaveType().getId()))
                        && LeaveRequestStatus.APPROVED.equals(lr.getStatus())
                        && lr.getStartDate() != null && lr.getStartDate().getYear() == year)
                .count();
    }

    @Override
    public List<LeaveRequest> findByDepartmentAndDateRange(String department, LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(lr -> lr.getEmployee() != null && lr.getEmployee().getDepartment() != null
                        && department.equals(lr.getEmployee().getDepartment())
                        && lr.getStartDate() != null && lr.getEndDate() != null
                        && !lr.getStartDate().isAfter(endDate) && !lr.getEndDate().isBefore(startDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveRequest> findAllOverlapping(LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(lr -> lr.getStartDate() != null && lr.getEndDate() != null
                        && !lr.getStartDate().isAfter(endDate) && !lr.getEndDate().isBefore(startDate))
                .collect(Collectors.toList());
    }

    @Override
    protected LeaveRequestItem toItem(LeaveRequest entity) {
        if (entity == null) return null;

        LeaveRequestItem item = new LeaveRequestItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("LEAVE_REQ#" + entity.getId());
        item.setId(entity.getId() != null ? String.valueOf(entity.getId()) : null);
        item.setTenantId(entity.getTenantId());

        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            item.setEmployeeId(String.valueOf(entity.getEmployee().getId()));
            item.setGsi1pk("LR_EMP#" + entity.getTenantId() + "#" + entity.getEmployee().getId());
            item.setGsi1sk("LEAVE_REQ#" + entity.getId());
        }

        if (entity.getApprover() != null && entity.getApprover().getId() != null) {
            item.setApproverId(String.valueOf(entity.getApprover().getId()));
        }

        if (entity.getLeaveType() != null && entity.getLeaveType().getId() != null) {
            item.setLeaveTypeId(String.valueOf(entity.getLeaveType().getId()));
        }

        item.setStartDate(entity.getStartDate());
        item.setEndDate(entity.getEndDate());
        item.setTotalDays(entity.getTotalDays() != null ? entity.getTotalDays().toPlainString() : null);
        item.setIsHalfDay(entity.getIsHalfDay());
        item.setHalfDayPeriod(entity.getHalfDayPeriod() != null ? entity.getHalfDayPeriod().name() : null);
        item.setReason(entity.getReason());
        item.setMedicalCertificateUrl(entity.getMedicalCertificateUrl());
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setApprovedAt(entity.getApprovedAt() != null ? entity.getApprovedAt().toInstant(ZoneOffset.UTC) : null);
        item.setRejectionReason(entity.getRejectionReason());
        item.setCancellationReason(entity.getCancellationReason());
        item.setCancelledAt(entity.getCancelledAt() != null ? entity.getCancelledAt().toInstant(ZoneOffset.UTC) : null);
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);

        return item;
    }

    @Override
    protected LeaveRequest toEntity(LeaveRequestItem item) {
        if (item == null) return null;

        LeaveRequest entity = new LeaveRequest();
        if (item.getId() != null) {
            try { entity.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ignored) {}
        }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            try { employee.setId(Long.parseLong(item.getEmployeeId())); } catch (NumberFormatException ignored) {}
            entity.setEmployee(employee);
        }

        if (item.getApproverId() != null) {
            Employee approver = new Employee();
            try { approver.setId(Long.parseLong(item.getApproverId())); } catch (NumberFormatException ignored) {}
            entity.setApprover(approver);
        }

        if (item.getLeaveTypeId() != null) {
            LeaveType leaveType = new LeaveType();
            try { leaveType.setId(Long.parseLong(item.getLeaveTypeId())); } catch (NumberFormatException ignored) {}
            entity.setLeaveType(leaveType);
        }

        entity.setStartDate(item.getStartDate());
        entity.setEndDate(item.getEndDate());
        entity.setTotalDays(item.getTotalDays() != null ? new BigDecimal(item.getTotalDays()) : null);
        entity.setIsHalfDay(item.getIsHalfDay());
        entity.setHalfDayPeriod(item.getHalfDayPeriod() != null ? HalfDayPeriod.valueOf(item.getHalfDayPeriod()) : null);
        entity.setReason(item.getReason());
        entity.setMedicalCertificateUrl(item.getMedicalCertificateUrl());
        entity.setStatus(item.getStatus() != null ? LeaveRequestStatus.valueOf(item.getStatus()) : null);
        entity.setApprovedAt(item.getApprovedAt() != null ? LocalDateTime.ofInstant(item.getApprovedAt(), ZoneOffset.UTC) : null);
        entity.setRejectionReason(item.getRejectionReason());
        entity.setCancellationReason(item.getCancellationReason());
        entity.setCancelledAt(item.getCancelledAt() != null ? LocalDateTime.ofInstant(item.getCancelledAt(), ZoneOffset.UTC) : null);
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);

        return entity;
    }
}
