package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.NegotiationStatus;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.entity.OfferType;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.OfferItem;
import com.arthmatic.shumelahire.service.DataEncryptionService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Offer entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     OFFER#{id}
 *   GSI1PK: OFFER_STATUS#{status}              GSI1SK: OFFER#{createdAt}
 *   GSI2PK: OFFER_APP#{applicationId}           GSI2SK: OFFER#{createdAt}
 *   GSI4PK: OFFER_NUMBER#{tenantId}#{offerNumber} GSI4SK: OFFER#{id}
 *   GSI6PK: OFFER_DATE#{tenantId}               GSI6SK: #{offerSentAt}
 * </pre>
 */
@Repository
public class DynamoOfferRepository extends DynamoRepository<OfferItem, Offer>
        implements OfferDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final DataEncryptionService encryptionService;

    public DynamoOfferRepository(DynamoDbClient dynamoDbClient,
                                  DynamoDbEnhancedClient enhancedClient,
                                  String dynamoDbTableName,
                                  DataEncryptionService encryptionService) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, OfferItem.class);
        this.encryptionService = encryptionService;
    }

    @Override
    protected String entityType() {
        return "OFFER";
    }

    // ── Domain-specific queries ──────────────────────────────────────────────

    @Override
    public Optional<Offer> findByIdWithDetails(String id) {
        // DynamoDB does not support JPA fetch joins; just load the offer.
        return findById(id);
    }

    @Override
    public List<Offer> findByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "OFFER_APP#" + applicationId);
    }

    @Override
    public Optional<Offer> findByOfferNumber(String offerNumber) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "OFFER_NUMBER#" + tenantId + "#" + offerNumber);
    }

    @Override
    public List<Offer> findByStatus(OfferStatus status) {
        return queryGsiAll("GSI1", "OFFER_STATUS#" + status.name());
    }

    @Override
    public List<Offer> findByStatusIn(List<OfferStatus> statuses) {
        return statuses.stream()
                .flatMap(s -> findByStatus(s).stream())
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findByOfferType(OfferType offerType) {
        return findAll().stream()
                .filter(o -> offerType.equals(o.getOfferType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findByNegotiationStatus(NegotiationStatus negotiationStatus) {
        return findAll().stream()
                .filter(o -> negotiationStatus.equals(o.getNegotiationStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findOffersRequiringApproval(int userApprovalLevel) {
        return findByStatus(OfferStatus.PENDING_APPROVAL).stream()
                .filter(o -> o.getApprovalLevelRequired() != null && o.getApprovalLevelRequired() <= userApprovalLevel)
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findExpiredOffers(LocalDateTime expiryTime) {
        return findAll().stream()
                .filter(o -> o.getOfferExpiryDate() != null && !o.getOfferExpiryDate().isAfter(expiryTime))
                .filter(o -> o.getStatus() == OfferStatus.SENT || o.getStatus() == OfferStatus.UNDER_NEGOTIATION)
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findOffersExpiringBetween(LocalDateTime startTime, LocalDateTime endTime) {
        return findAll().stream()
                .filter(o -> o.getOfferExpiryDate() != null
                        && !o.getOfferExpiryDate().isBefore(startTime)
                        && !o.getOfferExpiryDate().isAfter(endTime))
                .filter(o -> o.getStatus() == OfferStatus.SENT || o.getStatus() == OfferStatus.UNDER_NEGOTIATION)
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findActiveOffersByApplication(String applicationId) {
        return findByApplicationId(applicationId).stream()
                .filter(o -> o.getSupersededByOfferId() == null)
                .sorted(Comparator.comparing(Offer::getVersion, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Offer> findActiveOffersByApplicantId(String applicantId) {
        // DynamoDB: filter all offers where application.applicant.id matches
        // Since we don't have nested joins, filter in memory
        return findAll().stream()
                .filter(o -> o.getApplication() != null
                        && o.getApplication().getApplicant() != null
                        && applicantId.equals(String.valueOf(o.getApplication().getApplicant().getId())))
                .filter(o -> o.getSupersededByOfferId() == null)
                .sorted(Comparator.comparing(Offer::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatusAndDateRange(OfferStatus status, LocalDateTime startDate, LocalDateTime endDate) {
        return findByStatus(status).stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate))
                .count();
    }

    @Override
    public long countPendingApproval() {
        return findByStatus(OfferStatus.PENDING_APPROVAL).size();
    }

    @Override
    public long countNearExpiry(LocalDateTime nearExpiryTime) {
        return findByStatus(OfferStatus.SENT).stream()
                .filter(o -> o.getOfferExpiryDate() != null && !o.getOfferExpiryDate().isAfter(nearExpiryTime))
                .count();
    }

    @Override
    public long countByOfferSentAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(o -> o.getOfferSentAt() != null
                        && !o.getOfferSentAt().isBefore(startDate)
                        && !o.getOfferSentAt().isAfter(endDate))
                .count();
    }

    // ── Search & analytics ───────────────────────────────────────────────────

    @Override
    public Page<Offer> searchOffers(OfferStatus status, OfferType offerType,
                                     NegotiationStatus negotiationStatus,
                                     String department, String jobTitle,
                                     BigDecimal minSalary, BigDecimal maxSalary,
                                     LocalDateTime startDate, LocalDateTime endDate,
                                     Pageable pageable) {
        String lowerDept = department != null ? department.toLowerCase() : null;
        String lowerTitle = jobTitle != null ? jobTitle.toLowerCase() : null;

        List<Offer> filtered = findAll().stream()
                .filter(o -> status == null || status.equals(o.getStatus()))
                .filter(o -> offerType == null || offerType.equals(o.getOfferType()))
                .filter(o -> negotiationStatus == null || negotiationStatus.equals(o.getNegotiationStatus()))
                .filter(o -> lowerDept == null || (o.getDepartment() != null && o.getDepartment().toLowerCase().contains(lowerDept)))
                .filter(o -> lowerTitle == null || (o.getJobTitle() != null && o.getJobTitle().toLowerCase().contains(lowerTitle)))
                .filter(o -> minSalary == null || (o.getBaseSalary() != null && o.getBaseSalary().compareTo(minSalary) >= 0))
                .filter(o -> maxSalary == null || (o.getBaseSalary() != null && o.getBaseSalary().compareTo(maxSalary) <= 0))
                .filter(o -> startDate == null || (o.getCreatedAt() != null && !o.getCreatedAt().isBefore(startDate)))
                .filter(o -> endDate == null || (o.getCreatedAt() != null && !o.getCreatedAt().isAfter(endDate)))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Offer> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    @Override
    public List<Object[]> getOfferStatusDistribution(LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate))
                .collect(Collectors.groupingBy(Offer::getStatus, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getOfferTypeDistribution(LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate))
                .collect(Collectors.groupingBy(Offer::getOfferType, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public Object[] getAcceptanceRateData(LocalDateTime startDate, LocalDateTime endDate) {
        List<Offer> inRange = findAll().stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate))
                .collect(Collectors.toList());

        long accepted = inRange.stream().filter(o -> o.getStatus() == OfferStatus.ACCEPTED).count();
        long total = inRange.stream().filter(o -> o.getStatus() == OfferStatus.ACCEPTED || o.getStatus() == OfferStatus.DECLINED).count();
        return new Object[]{accepted, total};
    }

    @Override
    public Double getAverageTimeToAcceptanceHours(LocalDateTime startDate, LocalDateTime endDate) {
        OptionalDouble avg = findAll().stream()
                .filter(o -> o.getStatus() == OfferStatus.ACCEPTED
                        && o.getOfferSentAt() != null && o.getAcceptedAt() != null
                        && o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate))
                .mapToDouble(o -> java.time.Duration.between(o.getOfferSentAt(), o.getAcceptedAt()).toHours())
                .average();
        return avg.isPresent() ? avg.getAsDouble() : null;
    }

    @Override
    public Double getAverageTimeToDecisionHours(LocalDateTime startDate, LocalDateTime endDate) {
        OptionalDouble avg = findAll().stream()
                .filter(o -> (o.getStatus() == OfferStatus.ACCEPTED || o.getStatus() == OfferStatus.DECLINED)
                        && o.getOfferSentAt() != null
                        && o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate))
                .mapToDouble(o -> {
                    LocalDateTime decision = o.getAcceptedAt() != null ? o.getAcceptedAt() : o.getDeclinedAt();
                    return decision != null ? java.time.Duration.between(o.getOfferSentAt(), decision).toHours() : 0;
                })
                .average();
        return avg.isPresent() ? avg.getAsDouble() : null;
    }

    @Override
    public List<Object[]> getAverageSalaryByDepartment(LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(o -> o.getStatus() == OfferStatus.ACCEPTED
                        && o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startDate)
                        && !o.getCreatedAt().isAfter(endDate)
                        && o.getDepartment() != null
                        && o.getBaseSalary() != null)
                .collect(Collectors.groupingBy(Offer::getDepartment))
                .entrySet().stream()
                .map(e -> {
                    BigDecimal avg = e.getValue().stream()
                            .map(Offer::getBaseSalary)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(e.getValue().size()), 2, java.math.RoundingMode.HALF_UP);
                    return new Object[]{e.getKey(), avg};
                })
                .collect(Collectors.toList());
    }

    @Override
    public long countActiveNegotiations() {
        return findAll().stream()
                .filter(o -> o.getNegotiationStatus() == NegotiationStatus.CANDIDATE_RESPONSE_PENDING
                        || o.getNegotiationStatus() == NegotiationStatus.COMPANY_RESPONSE_PENDING
                        || o.getNegotiationStatus() == NegotiationStatus.STALLED)
                .count();
    }

    @Override
    public long countRecentAcceptances(LocalDateTime since) {
        return findAll().stream()
                .filter(o -> o.getStatus() == OfferStatus.ACCEPTED
                        && o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(since))
                .count();
    }

    // ── Conversion: OfferItem <-> Offer ─────────────────────────────────────

    @Override
    protected Offer toEntity(OfferItem item) {
        var offer = new Offer();
        if (item.getId() != null) {
            offer.setId(safeParseLong(item.getId()));
        }
        offer.setTenantId(item.getTenantId());
        offer.setOfferNumber(item.getOfferNumber());
        offer.setVersion(item.getVersion());
        if (item.getStatus() != null) {
            offer.setStatus(OfferStatus.valueOf(item.getStatus()));
        }
        if (item.getOfferType() != null) {
            offer.setOfferType(OfferType.valueOf(item.getOfferType()));
        }
        if (item.getNegotiationStatus() != null) {
            offer.setNegotiationStatus(NegotiationStatus.valueOf(item.getNegotiationStatus()));
        }
        offer.setJobTitle(item.getJobTitle());
        offer.setDepartment(item.getDepartment());
        offer.setReportingManager(item.getReportingManager());
        offer.setWorkLocation(item.getWorkLocation());
        offer.setRemoteWorkAllowed(item.getRemoteWorkAllowed());
        if (item.getBaseSalary() != null) {
            String decryptedSalary = encryptionService.decryptPII(item.getBaseSalary());
            if (decryptedSalary != null) {
                offer.setBaseSalary(new BigDecimal(decryptedSalary));
            }
        }
        offer.setCurrency(item.getCurrency());
        offer.setSalaryFrequency(item.getSalaryFrequency());
        offer.setBonusEligible(item.getBonusEligible());
        if (item.getBonusTargetPercentage() != null) {
            offer.setBonusTargetPercentage(new BigDecimal(item.getBonusTargetPercentage()));
        }
        if (item.getBonusMaximumPercentage() != null) {
            offer.setBonusMaximumPercentage(new BigDecimal(item.getBonusMaximumPercentage()));
        }
        offer.setCommissionEligible(item.getCommissionEligible());
        offer.setCommissionStructure(item.getCommissionStructure());
        offer.setEquityEligible(item.getEquityEligible());
        offer.setEquityDetails(item.getEquityDetails());
        if (item.getSigningBonus() != null) {
            offer.setSigningBonus(new BigDecimal(item.getSigningBonus()));
        }
        if (item.getRelocationAllowance() != null) {
            offer.setRelocationAllowance(new BigDecimal(item.getRelocationAllowance()));
        }
        offer.setBenefitsPackage(encryptionService.decryptPII(item.getBenefitsPackage()));
        offer.setVacationDaysAnnual(item.getVacationDaysAnnual());
        offer.setSickDaysAnnual(item.getSickDaysAnnual());
        offer.setHealthInsurance(item.getHealthInsurance());
        offer.setRetirementPlan(item.getRetirementPlan());
        if (item.getRetirementContributionPercentage() != null) {
            offer.setRetirementContributionPercentage(new BigDecimal(item.getRetirementContributionPercentage()));
        }
        offer.setOtherBenefits(item.getOtherBenefits());
        offer.setEmploymentType(item.getEmploymentType());
        offer.setContractDurationMonths(item.getContractDurationMonths());
        if (item.getContractEndDate() != null) {
            offer.setContractEndDate(LocalDate.parse(item.getContractEndDate()));
        }
        offer.setProbationaryPeriodDays(item.getProbationaryPeriodDays());
        offer.setNoticePeriodDays(item.getNoticePeriodDays());
        if (item.getStartDate() != null) {
            offer.setStartDate(LocalDate.parse(item.getStartDate()));
        }
        offer.setStartDateFlexible(item.getStartDateFlexible());
        if (item.getEarliestStartDate() != null) {
            offer.setEarliestStartDate(LocalDate.parse(item.getEarliestStartDate()));
        }
        if (item.getLatestStartDate() != null) {
            offer.setLatestStartDate(LocalDate.parse(item.getLatestStartDate()));
        }
        if (item.getOfferExpiryDate() != null) {
            offer.setOfferExpiryDate(LocalDateTime.parse(item.getOfferExpiryDate(), ISO_FMT));
        }
        if (item.getOfferSentAt() != null) {
            offer.setOfferSentAt(LocalDateTime.parse(item.getOfferSentAt(), ISO_FMT));
        }
        if (item.getCandidateViewedAt() != null) {
            offer.setCandidateViewedAt(LocalDateTime.parse(item.getCandidateViewedAt(), ISO_FMT));
        }
        if (item.getCandidateResponseAt() != null) {
            offer.setCandidateResponseAt(LocalDateTime.parse(item.getCandidateResponseAt(), ISO_FMT));
        }
        if (item.getAcceptedAt() != null) {
            offer.setAcceptedAt(LocalDateTime.parse(item.getAcceptedAt(), ISO_FMT));
        }
        if (item.getDeclinedAt() != null) {
            offer.setDeclinedAt(LocalDateTime.parse(item.getDeclinedAt(), ISO_FMT));
        }
        if (item.getWithdrawnAt() != null) {
            offer.setWithdrawnAt(LocalDateTime.parse(item.getWithdrawnAt(), ISO_FMT));
        }
        offer.setRequiresApproval(item.getRequiresApproval());
        offer.setApprovalLevelRequired(item.getApprovalLevelRequired());
        if (item.getApprovedBy() != null) {
            offer.setApprovedBy(safeParseLong(item.getApprovedBy()));
        }
        if (item.getApprovedAt() != null) {
            offer.setApprovedAt(LocalDateTime.parse(item.getApprovedAt(), ISO_FMT));
        }
        offer.setApprovalNotes(item.getApprovalNotes());
        if (item.getRejectedBy() != null) {
            offer.setRejectedBy(safeParseLong(item.getRejectedBy()));
        }
        if (item.getRejectedAt() != null) {
            offer.setRejectedAt(LocalDateTime.parse(item.getRejectedAt(), ISO_FMT));
        }
        offer.setRejectionReason(item.getRejectionReason());
        offer.setNegotiationRounds(item.getNegotiationRounds());
        if (item.getLastNegotiationAt() != null) {
            offer.setLastNegotiationAt(LocalDateTime.parse(item.getLastNegotiationAt(), ISO_FMT));
        }
        offer.setNegotiationNotes(item.getNegotiationNotes());
        offer.setCandidateCounterOffer(item.getCandidateCounterOffer());
        offer.setCompanyResponse(item.getCompanyResponse());
        offer.setSpecialConditions(item.getSpecialConditions());
        offer.setConfidentialityAgreement(item.getConfidentialityAgreement());
        offer.setNonCompeteAgreement(item.getNonCompeteAgreement());
        offer.setNonCompeteDurationMonths(item.getNonCompeteDurationMonths());
        offer.setIntellectualPropertyAgreement(item.getIntellectualPropertyAgreement());
        if (item.getOfferLetterTemplateId() != null) {
            offer.setOfferLetterTemplateId(safeParseLong(item.getOfferLetterTemplateId()));
        }
        if (item.getContractTemplateId() != null) {
            offer.setContractTemplateId(safeParseLong(item.getContractTemplateId()));
        }
        offer.setOfferDocumentPath(item.getOfferDocumentPath());
        offer.setSignedDocumentPath(item.getSignedDocumentPath());
        offer.setESignatureEnvelopeId(item.getESignatureEnvelopeId());
        offer.setESignatureStatus(item.getESignatureStatus());
        if (item.getESignatureSentAt() != null) {
            offer.setESignatureSentAt(LocalDateTime.parse(item.getESignatureSentAt(), ISO_FMT));
        }
        if (item.getESignatureCompletedAt() != null) {
            offer.setESignatureCompletedAt(LocalDateTime.parse(item.getESignatureCompletedAt(), ISO_FMT));
        }
        offer.setESignatureProvider(item.getESignatureProvider());
        offer.setESignatureSignerEmail(item.getESignatureSignerEmail());
        if (item.getCreatedBy() != null) {
            offer.setCreatedBy(safeParseLong(item.getCreatedBy()));
        }
        if (item.getCreatedAt() != null) {
            offer.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedBy() != null) {
            offer.setUpdatedBy(safeParseLong(item.getUpdatedBy()));
        }
        if (item.getUpdatedAt() != null) {
            offer.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getSupersededByOfferId() != null) {
            offer.setSupersededByOfferId(safeParseLong(item.getSupersededByOfferId()));
        }
        if (item.getSupersedesOfferId() != null) {
            offer.setSupersedesOfferId(safeParseLong(item.getSupersedesOfferId()));
        }
        return offer;
    }

    @Override
    protected OfferItem toItem(Offer entity) {
        var item = new OfferItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT)
                : LocalDateTime.now().format(ISO_FMT);

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("OFFER#" + id);

        // GSI1: Status index
        item.setGsi1pk("OFFER_STATUS#" + (entity.getStatus() != null ? entity.getStatus().name() : "DRAFT"));
        item.setGsi1sk("OFFER#" + createdAtStr);

        // GSI2: Application index
        if (entity.getApplication() != null && entity.getApplication().getId() != null) {
            item.setGsi2pk("OFFER_APP#" + entity.getApplication().getId());
            item.setGsi2sk("OFFER#" + createdAtStr);
            item.setApplicationId(entity.getApplication().getId().toString());
        }

        // GSI4: Unique offer number
        if (entity.getOfferNumber() != null) {
            item.setGsi4pk("OFFER_NUMBER#" + tenantId + "#" + entity.getOfferNumber());
            item.setGsi4sk("OFFER#" + id);
        }

        // GSI6: Date range — sentAt
        item.setGsi6pk("OFFER_DATE#" + tenantId);
        if (entity.getOfferSentAt() != null) {
            item.setGsi6sk(entity.getOfferSentAt().format(ISO_FMT));
        } else {
            item.setGsi6sk(createdAtStr);
        }

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setOfferNumber(entity.getOfferNumber());
        item.setVersion(entity.getVersion());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        if (entity.getOfferType() != null) {
            item.setOfferType(entity.getOfferType().name());
        }
        if (entity.getNegotiationStatus() != null) {
            item.setNegotiationStatus(entity.getNegotiationStatus().name());
        }
        item.setJobTitle(entity.getJobTitle());
        item.setDepartment(entity.getDepartment());
        item.setReportingManager(entity.getReportingManager());
        item.setWorkLocation(entity.getWorkLocation());
        item.setRemoteWorkAllowed(entity.getRemoteWorkAllowed());
        if (entity.getBaseSalary() != null) {
            item.setBaseSalary(encryptionService.encryptPII(entity.getBaseSalary().toPlainString()));
        }
        item.setCurrency(entity.getCurrency());
        item.setSalaryFrequency(entity.getSalaryFrequency());
        item.setBonusEligible(entity.getBonusEligible());
        if (entity.getBonusTargetPercentage() != null) {
            item.setBonusTargetPercentage(entity.getBonusTargetPercentage().toPlainString());
        }
        if (entity.getBonusMaximumPercentage() != null) {
            item.setBonusMaximumPercentage(entity.getBonusMaximumPercentage().toPlainString());
        }
        item.setCommissionEligible(entity.getCommissionEligible());
        item.setCommissionStructure(entity.getCommissionStructure());
        item.setEquityEligible(entity.getEquityEligible());
        item.setEquityDetails(entity.getEquityDetails());
        if (entity.getSigningBonus() != null) {
            item.setSigningBonus(entity.getSigningBonus().toPlainString());
        }
        if (entity.getRelocationAllowance() != null) {
            item.setRelocationAllowance(entity.getRelocationAllowance().toPlainString());
        }
        item.setBenefitsPackage(encryptionService.encryptPII(entity.getBenefitsPackage()));
        item.setVacationDaysAnnual(entity.getVacationDaysAnnual());
        item.setSickDaysAnnual(entity.getSickDaysAnnual());
        item.setHealthInsurance(entity.getHealthInsurance());
        item.setRetirementPlan(entity.getRetirementPlan());
        if (entity.getRetirementContributionPercentage() != null) {
            item.setRetirementContributionPercentage(entity.getRetirementContributionPercentage().toPlainString());
        }
        item.setOtherBenefits(entity.getOtherBenefits());
        item.setEmploymentType(entity.getEmploymentType());
        item.setContractDurationMonths(entity.getContractDurationMonths());
        if (entity.getContractEndDate() != null) {
            item.setContractEndDate(entity.getContractEndDate().toString());
        }
        item.setProbationaryPeriodDays(entity.getProbationaryPeriodDays());
        item.setNoticePeriodDays(entity.getNoticePeriodDays());
        if (entity.getStartDate() != null) {
            item.setStartDate(entity.getStartDate().toString());
        }
        item.setStartDateFlexible(entity.getStartDateFlexible());
        if (entity.getEarliestStartDate() != null) {
            item.setEarliestStartDate(entity.getEarliestStartDate().toString());
        }
        if (entity.getLatestStartDate() != null) {
            item.setLatestStartDate(entity.getLatestStartDate().toString());
        }
        if (entity.getOfferExpiryDate() != null) {
            item.setOfferExpiryDate(entity.getOfferExpiryDate().format(ISO_FMT));
        }
        if (entity.getOfferSentAt() != null) {
            item.setOfferSentAt(entity.getOfferSentAt().format(ISO_FMT));
        }
        if (entity.getCandidateViewedAt() != null) {
            item.setCandidateViewedAt(entity.getCandidateViewedAt().format(ISO_FMT));
        }
        if (entity.getCandidateResponseAt() != null) {
            item.setCandidateResponseAt(entity.getCandidateResponseAt().format(ISO_FMT));
        }
        if (entity.getAcceptedAt() != null) {
            item.setAcceptedAt(entity.getAcceptedAt().format(ISO_FMT));
        }
        if (entity.getDeclinedAt() != null) {
            item.setDeclinedAt(entity.getDeclinedAt().format(ISO_FMT));
        }
        if (entity.getWithdrawnAt() != null) {
            item.setWithdrawnAt(entity.getWithdrawnAt().format(ISO_FMT));
        }
        item.setRequiresApproval(entity.getRequiresApproval());
        item.setApprovalLevelRequired(entity.getApprovalLevelRequired());
        if (entity.getApprovedBy() != null) {
            item.setApprovedBy(entity.getApprovedBy().toString());
        }
        if (entity.getApprovedAt() != null) {
            item.setApprovedAt(entity.getApprovedAt().format(ISO_FMT));
        }
        item.setApprovalNotes(entity.getApprovalNotes());
        if (entity.getRejectedBy() != null) {
            item.setRejectedBy(entity.getRejectedBy().toString());
        }
        if (entity.getRejectedAt() != null) {
            item.setRejectedAt(entity.getRejectedAt().format(ISO_FMT));
        }
        item.setRejectionReason(entity.getRejectionReason());
        item.setNegotiationRounds(entity.getNegotiationRounds());
        if (entity.getLastNegotiationAt() != null) {
            item.setLastNegotiationAt(entity.getLastNegotiationAt().format(ISO_FMT));
        }
        item.setNegotiationNotes(entity.getNegotiationNotes());
        item.setCandidateCounterOffer(entity.getCandidateCounterOffer());
        item.setCompanyResponse(entity.getCompanyResponse());
        item.setSpecialConditions(entity.getSpecialConditions());
        item.setConfidentialityAgreement(entity.getConfidentialityAgreement());
        item.setNonCompeteAgreement(entity.getNonCompeteAgreement());
        item.setNonCompeteDurationMonths(entity.getNonCompeteDurationMonths());
        item.setIntellectualPropertyAgreement(entity.getIntellectualPropertyAgreement());
        if (entity.getOfferLetterTemplateId() != null) {
            item.setOfferLetterTemplateId(entity.getOfferLetterTemplateId().toString());
        }
        if (entity.getContractTemplateId() != null) {
            item.setContractTemplateId(entity.getContractTemplateId().toString());
        }
        item.setOfferDocumentPath(entity.getOfferDocumentPath());
        item.setSignedDocumentPath(entity.getSignedDocumentPath());
        item.setESignatureEnvelopeId(entity.getESignatureEnvelopeId());
        item.setESignatureStatus(entity.getESignatureStatus());
        if (entity.getESignatureSentAt() != null) {
            item.setESignatureSentAt(entity.getESignatureSentAt().format(ISO_FMT));
        }
        if (entity.getESignatureCompletedAt() != null) {
            item.setESignatureCompletedAt(entity.getESignatureCompletedAt().format(ISO_FMT));
        }
        item.setESignatureProvider(entity.getESignatureProvider());
        item.setESignatureSignerEmail(entity.getESignatureSignerEmail());
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy().toString());
        }
        item.setCreatedAt(createdAtStr);
        if (entity.getUpdatedBy() != null) {
            item.setUpdatedBy(entity.getUpdatedBy().toString());
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getSupersededByOfferId() != null) {
            item.setSupersededByOfferId(entity.getSupersededByOfferId().toString());
        }
        if (entity.getSupersedesOfferId() != null) {
            item.setSupersedesOfferId(entity.getSupersedesOfferId().toString());
        }

        return item;
    }
}
