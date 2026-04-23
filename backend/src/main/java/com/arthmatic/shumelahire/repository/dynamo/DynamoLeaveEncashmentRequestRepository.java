package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentStatus;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeaveEncashmentRequestDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LeaveEncashmentRequestItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DynamoLeaveEncashmentRequestRepository extends DynamoRepository<LeaveEncashmentRequestItem, LeaveEncashmentRequest>
        implements LeaveEncashmentRequestDataRepository {

    public DynamoLeaveEncashmentRequestRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, LeaveEncashmentRequestItem.class);
    }

    @Override
    protected String entityType() {
        return "LEAVE_ENCASH";
    }

    @Override
    public List<LeaveEncashmentRequest> findByEmployeeId(String employeeId) {
        String gsi1pk = "LE_EMP#" + currentTenantId() + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<LeaveEncashmentRequest> findByStatus(LeaveEncashmentStatus status) {
        return findAll().stream()
                .filter(ler -> status.equals(ler.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByEmployeeIdAndCycleYear(String employeeId, Integer cycleYear) {
        return findByEmployeeId(employeeId).stream()
                .filter(ler -> cycleYear.equals(ler.getCycleYear()))
                .count();
    }

    @Override
    protected LeaveEncashmentRequestItem toItem(LeaveEncashmentRequest entity) {
        if (entity == null) return null;

        LeaveEncashmentRequestItem item = new LeaveEncashmentRequestItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("LEAVE_ENCASH#" + entity.getId());
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());

        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            item.setEmployeeId(entity.getEmployee().getId());
            item.setGsi1pk("LE_EMP#" + entity.getTenantId() + "#" + entity.getEmployee().getId());
            item.setGsi1sk("LEAVE_ENCASH#" + entity.getId());
        }

        if (entity.getLeaveType() != null && entity.getLeaveType().getId() != null) {
            item.setLeaveTypeId(entity.getLeaveType().getId());
        }

        if (entity.getHrApprovedBy() != null && entity.getHrApprovedBy().getId() != null) {
            item.setHrApprovedById(entity.getHrApprovedBy().getId());
        }

        if (entity.getFinanceApprovedBy() != null && entity.getFinanceApprovedBy().getId() != null) {
            item.setFinanceApprovedById(entity.getFinanceApprovedBy().getId());
        }

        item.setDays(entity.getDays() != null ? entity.getDays().toPlainString() : null);
        item.setRatePerDay(entity.getRatePerDay() != null ? entity.getRatePerDay().toPlainString() : null);
        item.setTotalAmount(entity.getTotalAmount() != null ? entity.getTotalAmount().toPlainString() : null);
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setReason(entity.getReason());
        item.setRequestedAt(entity.getRequestedAt() != null ? entity.getRequestedAt().toInstant(ZoneOffset.UTC) : null);
        item.setHrApprovedAt(entity.getHrApprovedAt() != null ? entity.getHrApprovedAt().toInstant(ZoneOffset.UTC) : null);
        item.setFinanceApprovedAt(entity.getFinanceApprovedAt() != null ? entity.getFinanceApprovedAt().toInstant(ZoneOffset.UTC) : null);
        item.setDecisionComment(entity.getDecisionComment());
        item.setCycleYear(entity.getCycleYear());

        return item;
    }

    @Override
    protected LeaveEncashmentRequest toEntity(LeaveEncashmentRequestItem item) {
        if (item == null) return null;

        LeaveEncashmentRequest entity = new LeaveEncashmentRequest();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            Employee employee = new Employee();
            employee.setId(item.getEmployeeId());
            entity.setEmployee(employee);
        }

        if (item.getLeaveTypeId() != null) {
            LeaveType leaveType = new LeaveType();
            leaveType.setId(item.getLeaveTypeId());
            entity.setLeaveType(leaveType);
        }

        if (item.getHrApprovedById() != null) {
            Employee hrApprovedBy = new Employee();
            hrApprovedBy.setId(item.getHrApprovedById());
            entity.setHrApprovedBy(hrApprovedBy);
        }

        if (item.getFinanceApprovedById() != null) {
            Employee financeApprovedBy = new Employee();
            financeApprovedBy.setId(item.getFinanceApprovedById());
            entity.setFinanceApprovedBy(financeApprovedBy);
        }

        entity.setDays(item.getDays() != null ? new BigDecimal(item.getDays()) : null);
        entity.setRatePerDay(item.getRatePerDay() != null ? new BigDecimal(item.getRatePerDay()) : null);
        entity.setTotalAmount(item.getTotalAmount() != null ? new BigDecimal(item.getTotalAmount()) : null);
        entity.setStatus(item.getStatus() != null ? LeaveEncashmentStatus.valueOf(item.getStatus()) : null);
        entity.setReason(item.getReason());
        entity.setRequestedAt(item.getRequestedAt() != null ? LocalDateTime.ofInstant(item.getRequestedAt(), ZoneOffset.UTC) : null);
        entity.setHrApprovedAt(item.getHrApprovedAt() != null ? LocalDateTime.ofInstant(item.getHrApprovedAt(), ZoneOffset.UTC) : null);
        entity.setFinanceApprovedAt(item.getFinanceApprovedAt() != null ? LocalDateTime.ofInstant(item.getFinanceApprovedAt(), ZoneOffset.UTC) : null);
        entity.setDecisionComment(item.getDecisionComment());
        entity.setCycleYear(item.getCycleYear());

        return entity;
    }
}
