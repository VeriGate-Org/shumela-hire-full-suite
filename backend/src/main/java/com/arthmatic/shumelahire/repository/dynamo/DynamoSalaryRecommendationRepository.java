package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;
import com.arthmatic.shumelahire.repository.SalaryRecommendationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SalaryRecommendationItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the SalaryRecommendation entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     SALREC#{id}
 *   GSI1PK: SALREC_STATUS#{status}                    GSI1SK: SALREC#{createdAt}
 *   GSI2PK: SALREC_APP#{applicationId}                GSI2SK: SALREC#{createdAt}
 *   GSI4PK: SALREC_NUM#{recommendationNumber}         GSI4SK: SALREC#{id}
 *   GSI5PK: SALREC_DEPT#{department}                  GSI5SK: SALREC#{createdAt}
 * </pre>
 */
@Repository
public class DynamoSalaryRecommendationRepository
        extends DynamoRepository<SalaryRecommendationItem, SalaryRecommendation>
        implements SalaryRecommendationDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSalaryRecommendationRepository(DynamoDbClient dynamoDbClient,
                                                  DynamoDbEnhancedClient enhancedClient,
                                                  String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SalaryRecommendationItem.class);
    }

    @Override
    protected String entityType() {
        return "SALREC";
    }

    // -- SalaryRecommendationDataRepository implementation --------------------

    @Override
    public List<SalaryRecommendation> findByStatus(SalaryRecommendationStatus status) {
        return queryGsiAll("GSI1", "SALREC_STATUS#" + status.name());
    }

    @Override
    public List<SalaryRecommendation> findByRequestedBy(String requestedBy) {
        return findAll().stream()
                .filter(sr -> requestedBy.equals(sr.getRequestedBy()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<SalaryRecommendation> findByRecommendationNumber(String recommendationNumber) {
        return findByGsiUnique("GSI4", "SALREC_NUM#" + recommendationNumber);
    }

    @Override
    public List<SalaryRecommendation> findByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "SALREC_APP#" + applicationId);
    }

    @Override
    public List<SalaryRecommendation> findByOfferId(String offerId) {
        return findAll().stream()
                .filter(sr -> sr.getOfferId() != null && sr.getOfferId().toString().equals(offerId))
                .collect(Collectors.toList());
    }

    @Override
    public List<SalaryRecommendation> findByDepartmentAndDateRange(String department,
                                                                     LocalDateTime startDate,
                                                                     LocalDateTime endDate) {
        String skStart = "SALREC#" + startDate.format(ISO_FMT);
        String skEnd = "SALREC#" + endDate.format(ISO_FMT);
        return queryGsiRange("GSI5", "SALREC_DEPT#" + department, skStart, skEnd, null, 1000)
                .content();
    }

    @Override
    public List<SalaryRecommendation> findByStatusOrderByCreatedAtDesc(SalaryRecommendationStatus status) {
        return queryGsiAll("GSI1", "SALREC_STATUS#" + status.name()).stream()
                .sorted(Comparator.comparing(SalaryRecommendation::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // -- Conversion: SalaryRecommendationItem <-> SalaryRecommendation --------

    @Override
    protected SalaryRecommendation toEntity(SalaryRecommendationItem item) {
        var entity = new SalaryRecommendation();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setRecommendationNumber(item.getRecommendationNumber());
        if (item.getStatus() != null) {
            entity.setStatus(SalaryRecommendationStatus.valueOf(item.getStatus()));
        }
        entity.setPositionTitle(item.getPositionTitle());
        entity.setDepartment(item.getDepartment());
        entity.setJobGrade(item.getJobGrade());
        entity.setPositionLevel(item.getPositionLevel());
        entity.setRequestedBy(item.getRequestedBy());
        entity.setCandidateName(item.getCandidateName());
        if (item.getCandidateCurrentSalary() != null) {
            entity.setCandidateCurrentSalary(new BigDecimal(item.getCandidateCurrentSalary()));
        }
        if (item.getCandidateExpectedSalary() != null) {
            entity.setCandidateExpectedSalary(new BigDecimal(item.getCandidateExpectedSalary()));
        }
        entity.setMarketDataReference(item.getMarketDataReference());
        if (item.getProposedMinSalary() != null) {
            entity.setProposedMinSalary(new BigDecimal(item.getProposedMinSalary()));
        }
        if (item.getProposedMaxSalary() != null) {
            entity.setProposedMaxSalary(new BigDecimal(item.getProposedMaxSalary()));
        }
        if (item.getProposedTargetSalary() != null) {
            entity.setProposedTargetSalary(new BigDecimal(item.getProposedTargetSalary()));
        }
        if (item.getRecommendedSalary() != null) {
            entity.setRecommendedSalary(new BigDecimal(item.getRecommendedSalary()));
        }
        entity.setRecommendedBy(item.getRecommendedBy());
        if (item.getRecommendedAt() != null) {
            entity.setRecommendedAt(LocalDateTime.parse(item.getRecommendedAt(), ISO_FMT));
        }
        entity.setRecommendationJustification(item.getRecommendationJustification());
        entity.setBonusRecommendation(item.getBonusRecommendation());
        entity.setEquityRecommendation(item.getEquityRecommendation());
        entity.setBenefitsNotes(item.getBenefitsNotes());
        entity.setRequiresApproval(item.getRequiresApproval());
        entity.setApprovalLevelRequired(item.getApprovalLevelRequired());
        entity.setApprovedBy(item.getApprovedBy());
        if (item.getApprovedAt() != null) {
            entity.setApprovedAt(LocalDateTime.parse(item.getApprovedAt(), ISO_FMT));
        }
        entity.setApprovalNotes(item.getApprovalNotes());
        entity.setRejectedBy(item.getRejectedBy());
        entity.setRejectionReason(item.getRejectionReason());
        entity.setCurrency(item.getCurrency());
        if (item.getOfferId() != null) {
            entity.setOfferId(Long.parseLong(item.getOfferId()));
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected SalaryRecommendationItem toItem(SalaryRecommendation entity) {
        var item = new SalaryRecommendationItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("SALREC#" + id);

        // GSI1: Status index
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "DRAFT";
        item.setGsi1pk("SALREC_STATUS#" + statusStr);
        item.setGsi1sk("SALREC#" + createdAtStr);

        // GSI2: Application FK lookup
        String appId = "";
        if (entity.getApplication() != null && entity.getApplication().getId() != null) {
            appId = entity.getApplication().getId().toString();
        }
        item.setGsi2pk("SALREC_APP#" + appId);
        item.setGsi2sk("SALREC#" + createdAtStr);

        // GSI4: RecommendationNumber unique constraint
        String recNum = entity.getRecommendationNumber() != null ? entity.getRecommendationNumber() : "";
        item.setGsi4pk("SALREC_NUM#" + recNum);
        item.setGsi4sk("SALREC#" + id);

        // GSI5: Department lookup
        String dept = entity.getDepartment() != null ? entity.getDepartment() : "";
        item.setGsi5pk("SALREC_DEPT#" + dept);
        item.setGsi5sk("SALREC#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setRecommendationNumber(entity.getRecommendationNumber());
        item.setStatus(statusStr);
        item.setPositionTitle(entity.getPositionTitle());
        item.setDepartment(entity.getDepartment());
        item.setJobGrade(entity.getJobGrade());
        item.setPositionLevel(entity.getPositionLevel());
        item.setRequestedBy(entity.getRequestedBy());
        item.setCandidateName(entity.getCandidateName());
        if (entity.getCandidateCurrentSalary() != null) {
            item.setCandidateCurrentSalary(entity.getCandidateCurrentSalary().toPlainString());
        }
        if (entity.getCandidateExpectedSalary() != null) {
            item.setCandidateExpectedSalary(entity.getCandidateExpectedSalary().toPlainString());
        }
        item.setMarketDataReference(entity.getMarketDataReference());
        if (entity.getProposedMinSalary() != null) {
            item.setProposedMinSalary(entity.getProposedMinSalary().toPlainString());
        }
        if (entity.getProposedMaxSalary() != null) {
            item.setProposedMaxSalary(entity.getProposedMaxSalary().toPlainString());
        }
        if (entity.getProposedTargetSalary() != null) {
            item.setProposedTargetSalary(entity.getProposedTargetSalary().toPlainString());
        }
        if (entity.getRecommendedSalary() != null) {
            item.setRecommendedSalary(entity.getRecommendedSalary().toPlainString());
        }
        item.setRecommendedBy(entity.getRecommendedBy());
        if (entity.getRecommendedAt() != null) {
            item.setRecommendedAt(entity.getRecommendedAt().format(ISO_FMT));
        }
        item.setRecommendationJustification(entity.getRecommendationJustification());
        item.setBonusRecommendation(entity.getBonusRecommendation());
        item.setEquityRecommendation(entity.getEquityRecommendation());
        item.setBenefitsNotes(entity.getBenefitsNotes());
        item.setRequiresApproval(entity.getRequiresApproval());
        item.setApprovalLevelRequired(entity.getApprovalLevelRequired());
        item.setApprovedBy(entity.getApprovedBy());
        if (entity.getApprovedAt() != null) {
            item.setApprovedAt(entity.getApprovedAt().format(ISO_FMT));
        }
        item.setApprovalNotes(entity.getApprovalNotes());
        item.setRejectedBy(entity.getRejectedBy());
        item.setRejectionReason(entity.getRejectionReason());
        item.setCurrency(entity.getCurrency());
        item.setApplicationId(appId.isEmpty() ? null : appId);
        if (entity.getOfferId() != null) {
            item.setOfferId(entity.getOfferId().toString());
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
