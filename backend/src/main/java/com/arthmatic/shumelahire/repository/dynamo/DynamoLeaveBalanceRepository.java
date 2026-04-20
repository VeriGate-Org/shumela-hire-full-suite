package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.leave.LeaveBalance;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeaveBalanceDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LeaveBalanceItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoLeaveBalanceRepository extends DynamoRepository<LeaveBalanceItem, LeaveBalance>
        implements LeaveBalanceDataRepository {

    public DynamoLeaveBalanceRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, LeaveBalanceItem.class);
    }

    @Override
    protected String entityType() {
        return "LEAVE_BAL";
    }

    @Override
    public List<LeaveBalance> findByEmployeeIdAndCycleYear(String employeeId, Integer cycleYear) {
        String tenantId = currentTenantId();
        String gsi1pk = "LB_EMP#" + tenantId + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk).stream()
                .filter(lb -> cycleYear.equals(lb.getCycleYear()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndCycleYear(String employeeId, String leaveTypeId, Integer cycleYear) {
        String tenantId = currentTenantId();
        String gsi1pk = "LB_EMP#" + tenantId + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk).stream()
                .filter(lb -> lb.getLeaveType() != null &&
                        leaveTypeId.equals(String.valueOf(lb.getLeaveType().getId())) &&
                        cycleYear.equals(lb.getCycleYear()))
                .findFirst();
    }

    @Override
    public List<LeaveBalance> findBalancesForEmployee(String employeeId) {
        String tenantId = currentTenantId();
        String gsi1pk = "LB_EMP#" + tenantId + "#" + employeeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<LeaveBalance> findByCycleYear(Integer cycleYear) {
        return findAll().stream()
                .filter(lb -> cycleYear.equals(lb.getCycleYear()))
                .collect(Collectors.toList());
    }

    @Override
    protected LeaveBalanceItem toItem(LeaveBalance entity) {
        LeaveBalanceItem item = new LeaveBalanceItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("LEAVE_BAL#" + id);

        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? String.valueOf(entity.getEmployee().getId()) : "";
        String leaveTypeId = entity.getLeaveType() != null && entity.getLeaveType().getId() != null
                ? String.valueOf(entity.getLeaveType().getId()) : "";

        item.setGsi1pk("LB_EMP#" + tenantId + "#" + employeeId);
        String gsi1sk = "LEAVE_BAL#";
        if (entity.getCycleYear() != null) {
            gsi1sk += entity.getCycleYear() + "#" + leaveTypeId;
        }
        item.setGsi1sk(gsi1sk);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        item.setLeaveTypeId(leaveTypeId);
        item.setCycleYear(entity.getCycleYear());
        if (entity.getEntitledDays() != null) item.setEntitledDays(entity.getEntitledDays().toPlainString());
        if (entity.getTakenDays() != null) item.setTakenDays(entity.getTakenDays().toPlainString());
        if (entity.getPendingDays() != null) item.setPendingDays(entity.getPendingDays().toPlainString());
        if (entity.getCarriedForwardDays() != null) item.setCarriedForwardDays(entity.getCarriedForwardDays().toPlainString());
        if (entity.getAdjustmentDays() != null) item.setAdjustmentDays(entity.getAdjustmentDays().toPlainString());
        if (entity.getEncashedDays() != null) item.setEncashedDays(entity.getEncashedDays().toPlainString());
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().toInstant(ZoneOffset.UTC));
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().toInstant(ZoneOffset.UTC));
        return item;
    }

    @Override
    protected LeaveBalance toEntity(LeaveBalanceItem item) {
        LeaveBalance entity = new LeaveBalance();
        if (item.getId() != null && !item.getId().isEmpty()) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null && !item.getEmployeeId().isEmpty()) {
            Employee employee = new Employee();
            employee.setId(safeParseLong(item.getEmployeeId()));
            entity.setEmployee(employee);
        }

        if (item.getLeaveTypeId() != null && !item.getLeaveTypeId().isEmpty()) {
            LeaveType leaveType = new LeaveType();
            leaveType.setId(safeParseLong(item.getLeaveTypeId()));
            entity.setLeaveType(leaveType);
        }

        entity.setCycleYear(item.getCycleYear());
        if (item.getEntitledDays() != null) entity.setEntitledDays(new BigDecimal(item.getEntitledDays()));
        if (item.getTakenDays() != null) entity.setTakenDays(new BigDecimal(item.getTakenDays()));
        if (item.getPendingDays() != null) entity.setPendingDays(new BigDecimal(item.getPendingDays()));
        if (item.getCarriedForwardDays() != null) entity.setCarriedForwardDays(new BigDecimal(item.getCarriedForwardDays()));
        if (item.getAdjustmentDays() != null) entity.setAdjustmentDays(new BigDecimal(item.getAdjustmentDays()));
        if (item.getEncashedDays() != null) entity.setEncashedDays(new BigDecimal(item.getEncashedDays()));
        if (item.getCreatedAt() != null) entity.setCreatedAt(LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC));
        if (item.getUpdatedAt() != null) entity.setUpdatedAt(LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC));
        return entity;
    }
}
