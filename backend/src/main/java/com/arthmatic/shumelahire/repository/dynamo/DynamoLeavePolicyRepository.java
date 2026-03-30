package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.leave.AccrualMethod;
import com.arthmatic.shumelahire.entity.leave.LeavePolicy;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeavePolicyDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LeavePolicyItem;
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
public class DynamoLeavePolicyRepository extends DynamoRepository<LeavePolicyItem, LeavePolicy>
        implements LeavePolicyDataRepository {

    public DynamoLeavePolicyRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, LeavePolicyItem.class);
    }

    @Override
    protected String entityType() {
        return "LEAVE_POLICY";
    }

    @Override
    public List<LeavePolicy> findByLeaveTypeId(String leaveTypeId) {
        String gsi1pk = "LP_TYPE#" + currentTenantId() + "#" + leaveTypeId;
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<LeavePolicy> findByIsActiveTrue() {
        return findAll().stream()
                .filter(lp -> Boolean.TRUE.equals(lp.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public List<LeavePolicy> findByLeaveTypeIdAndIsActiveTrue(String leaveTypeId) {
        return findByLeaveTypeId(leaveTypeId).stream()
                .filter(lp -> Boolean.TRUE.equals(lp.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    protected LeavePolicyItem toItem(LeavePolicy entity) {
        if (entity == null) return null;

        LeavePolicyItem item = new LeavePolicyItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("LEAVE_POLICY#" + entity.getId());
        item.setId(entity.getId() != null ? String.valueOf(entity.getId()) : null);
        item.setTenantId(entity.getTenantId());

        if (entity.getLeaveType() != null && entity.getLeaveType().getId() != null) {
            item.setLeaveTypeId(String.valueOf(entity.getLeaveType().getId()));
            item.setGsi1pk("LP_TYPE#" + entity.getTenantId() + "#" + entity.getLeaveType().getId());
            item.setGsi1sk("LEAVE_POLICY#" + entity.getId());
        }

        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setAccrualMethod(entity.getAccrualMethod() != null ? entity.getAccrualMethod().name() : null);
        item.setDaysPerCycle(entity.getDaysPerCycle() != null ? entity.getDaysPerCycle().toPlainString() : null);
        item.setCycleStartMonth(entity.getCycleStartMonth());
        item.setMinServiceMonths(entity.getMinServiceMonths());
        item.setApplicableEmploymentTypes(entity.getApplicableEmploymentTypes());
        item.setApplicableDepartments(entity.getApplicableDepartments());
        item.setAllowNegativeBalance(entity.getAllowNegativeBalance());
        item.setMaxConsecutiveDays(entity.getMaxConsecutiveDays());
        item.setMinNoticeDays(entity.getMinNoticeDays());
        item.setIsActive(entity.getIsActive());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);

        return item;
    }

    @Override
    protected LeavePolicy toEntity(LeavePolicyItem item) {
        if (item == null) return null;

        LeavePolicy entity = new LeavePolicy();
        if (item.getId() != null) {
            try { entity.setId(Long.parseLong(item.getId())); } catch (NumberFormatException ignored) {}
        }
        entity.setTenantId(item.getTenantId());

        if (item.getLeaveTypeId() != null) {
            LeaveType leaveType = new LeaveType();
            try { leaveType.setId(Long.parseLong(item.getLeaveTypeId())); } catch (NumberFormatException ignored) {}
            entity.setLeaveType(leaveType);
        }

        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setAccrualMethod(item.getAccrualMethod() != null ? AccrualMethod.valueOf(item.getAccrualMethod()) : null);
        entity.setDaysPerCycle(item.getDaysPerCycle() != null ? new BigDecimal(item.getDaysPerCycle()) : null);
        entity.setCycleStartMonth(item.getCycleStartMonth());
        entity.setMinServiceMonths(item.getMinServiceMonths());
        entity.setApplicableEmploymentTypes(item.getApplicableEmploymentTypes());
        entity.setApplicableDepartments(item.getApplicableDepartments());
        entity.setAllowNegativeBalance(item.getAllowNegativeBalance());
        entity.setMaxConsecutiveDays(item.getMaxConsecutiveDays());
        entity.setMinNoticeDays(item.getMinNoticeDays());
        entity.setIsActive(item.getIsActive());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);

        return entity;
    }
}
