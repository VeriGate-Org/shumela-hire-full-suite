package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.LeaveTypeDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LeaveTypeItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoLeaveTypeRepository extends DynamoRepository<LeaveTypeItem, LeaveType>
        implements LeaveTypeDataRepository {

    public DynamoLeaveTypeRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, LeaveTypeItem.class);
    }

    @Override
    protected String entityType() {
        return "LEAVE_TYPE";
    }

    @Override
    public List<LeaveType> findByIsActiveTrue() {
        return findAll().stream()
                .filter(lt -> Boolean.TRUE.equals(lt.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<LeaveType> findByCode(String code) {
        return findAll().stream()
                .filter(lt -> code.equals(lt.getCode()))
                .findFirst();
    }

    @Override
    public boolean existsByCode(String code) {
        return findByCode(code).isPresent();
    }

    @Override
    protected LeaveTypeItem toItem(LeaveType entity) {
        if (entity == null) return null;

        LeaveTypeItem item = new LeaveTypeItem();
        item.setPk("TENANT#" + entity.getTenantId());
        item.setSk("LEAVE_TYPE#" + entity.getId());
        item.setGsi1pk("LT_CODE#" + entity.getTenantId());
        item.setGsi1sk(entity.getCode());
        item.setId(entity.getId() != null ? entity.getId() : null);
        item.setTenantId(entity.getTenantId());
        item.setName(entity.getName());
        item.setCode(entity.getCode());
        item.setDescription(entity.getDescription());
        item.setDefaultDaysPerYear(entity.getDefaultDaysPerYear() != null ? entity.getDefaultDaysPerYear().toPlainString() : null);
        item.setMaxCarryForwardDays(entity.getMaxCarryForwardDays() != null ? entity.getMaxCarryForwardDays().toPlainString() : null);
        item.setRequiresMedicalCertificate(entity.getRequiresMedicalCertificate());
        item.setMedicalCertThresholdDays(entity.getMedicalCertThresholdDays());
        item.setIsPaid(entity.getIsPaid());
        item.setAllowEncashment(entity.getAllowEncashment());
        item.setEncashmentRate(entity.getEncashmentRate() != null ? entity.getEncashmentRate().toPlainString() : null);
        item.setIsActive(entity.getIsActive());
        item.setColorCode(entity.getColorCode());
        item.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant(ZoneOffset.UTC) : null);
        item.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant(ZoneOffset.UTC) : null);

        return item;
    }

    @Override
    protected LeaveType toEntity(LeaveTypeItem item) {
        if (item == null) return null;

        LeaveType entity = new LeaveType();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setCode(item.getCode());
        entity.setDescription(item.getDescription());
        entity.setDefaultDaysPerYear(item.getDefaultDaysPerYear() != null ? new BigDecimal(item.getDefaultDaysPerYear()) : null);
        entity.setMaxCarryForwardDays(item.getMaxCarryForwardDays() != null ? new BigDecimal(item.getMaxCarryForwardDays()) : null);
        entity.setRequiresMedicalCertificate(item.getRequiresMedicalCertificate());
        entity.setMedicalCertThresholdDays(item.getMedicalCertThresholdDays());
        entity.setIsPaid(item.getIsPaid());
        entity.setAllowEncashment(item.getAllowEncashment());
        entity.setEncashmentRate(item.getEncashmentRate() != null ? new BigDecimal(item.getEncashmentRate()) : null);
        entity.setIsActive(item.getIsActive());
        entity.setColorCode(item.getColorCode());
        entity.setCreatedAt(item.getCreatedAt() != null ? LocalDateTime.ofInstant(item.getCreatedAt(), ZoneOffset.UTC) : null);
        entity.setUpdatedAt(item.getUpdatedAt() != null ? LocalDateTime.ofInstant(item.getUpdatedAt(), ZoneOffset.UTC) : null);

        return entity;
    }
}
