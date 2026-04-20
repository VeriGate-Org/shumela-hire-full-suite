package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ApplicantItem;
import com.arthmatic.shumelahire.service.DataEncryptionService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Applicant entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     APPLICANT#{id}
 *   GSI1PK: APPLICANT_CREATED#{tenantId}     GSI1SK: APPLICANT#{createdAt}
 *   GSI2PK: APPLICANT_USER#{userId}          GSI2SK: APPLICANT#{id}
 *   GSI4PK: APPLICANT_EMAIL#{tenantId}#{email}  GSI4SK: APPLICANT#{id}
 * </pre>
 */
@Repository
public class DynamoApplicantRepository extends DynamoRepository<ApplicantItem, Applicant>
        implements ApplicantDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final DataEncryptionService encryptionService;

    public DynamoApplicantRepository(DynamoDbClient dynamoDbClient,
                                      DynamoDbEnhancedClient enhancedClient,
                                      String dynamoDbTableName,
                                      DataEncryptionService encryptionService) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ApplicantItem.class);
        this.encryptionService = encryptionService;
    }

    @Override
    protected String entityType() {
        return "APPLICANT";
    }

    // ── ApplicantDataRepository implementation ──────────────────────────────

    @Override
    public Optional<Applicant> findByEmail(String email) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "APPLICANT_EMAIL#" + tenantId + "#" + email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public CursorPage<Applicant> findBySearchTerm(String searchTerm, String cursor, int pageSize) {
        // DynamoDB doesn't support LIKE queries natively; fetch all and filter
        String lowerSearch = searchTerm.toLowerCase();
        List<Applicant> filtered = findAll().stream()
                .filter(a -> (a.getName() != null && a.getName().toLowerCase().contains(lowerSearch)) ||
                             (a.getSurname() != null && a.getSurname().toLowerCase().contains(lowerSearch)) ||
                             (a.getEmail() != null && a.getEmail().toLowerCase().contains(lowerSearch)))
                .collect(Collectors.toList());

        return paginateInMemory(filtered, cursor, pageSize);
    }

    @Override
    public Optional<Applicant> findByIdPassportNumber(String idPassportNumber) {
        return findAll().stream()
                .filter(a -> idPassportNumber.equals(a.getIdPassportNumber()))
                .findFirst();
    }

    @Override
    public Page<Applicant> findAll(Pageable pageable) {
        List<Applicant> all = findAll();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<Applicant> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    @Override
    public Page<Applicant> findBySearchTerm(String searchTerm, Pageable pageable) {
        String lowerSearch = searchTerm.toLowerCase();
        List<Applicant> filtered = findAll().stream()
                .filter(a -> (a.getName() != null && a.getName().toLowerCase().contains(lowerSearch)) ||
                             (a.getSurname() != null && a.getSurname().toLowerCase().contains(lowerSearch)) ||
                             (a.getEmail() != null && a.getEmail().toLowerCase().contains(lowerSearch)))
                .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Applicant> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    @Override
    public CursorPage<Applicant> findRecent(String cursor, int pageSize) {
        // Use GSI1 for date-sorted queries; reverse the SK for DESC order
        return queryGsi("GSI1", "APPLICANT_CREATED#" + currentTenantId(),
                "APPLICANT#", cursor, pageSize);
    }

    // ── Conversion: ApplicantItem <-> Applicant ─────────────────────────────

    @Override
    protected Applicant toEntity(ApplicantItem item) {
        var applicant = new Applicant();
        if (item.getId() != null) {
            applicant.setId(safeParseLong(item.getId()));
        }
        applicant.setTenantId(item.getTenantId());
        applicant.setName(item.getName());
        applicant.setSurname(item.getSurname());
        applicant.setEmail(item.getEmail());
        applicant.setPhone(encryptionService.decryptPII(item.getPhone()));
        applicant.setIdPassportNumber(encryptionService.decryptPII(item.getIdPassportNumber()));
        applicant.setAddress(encryptionService.decryptPII(item.getAddress()));
        applicant.setLocation(item.getLocation());
        applicant.setEducation(item.getEducation());
        applicant.setExperience(item.getExperience());
        applicant.setSkills(item.getSkills());
        applicant.setLinkedinUrl(item.getLinkedinUrl());
        applicant.setPortfolioUrl(item.getPortfolioUrl());
        applicant.setResumeUrl(item.getResumeUrl());
        applicant.setCoverLetter(item.getCoverLetter());
        applicant.setSource(item.getSource());
        if (item.getUserId() != null) {
            applicant.setUserId(safeParseLong(item.getUserId()));
        }
        applicant.setGender(item.getGender());
        applicant.setRace(item.getRace());
        applicant.setDisabilityStatus(item.getDisabilityStatus());
        applicant.setCitizenshipStatus(item.getCitizenshipStatus());
        applicant.setDemographicsConsent(item.getDemographicsConsent());
        if (item.getDemographicsConsentDate() != null) {
            applicant.setDemographicsConsentDate(LocalDateTime.parse(item.getDemographicsConsentDate(), ISO_FMT));
        }
        if (item.getCreatedAt() != null) {
            applicant.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            applicant.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return applicant;
    }

    @Override
    protected ApplicantItem toItem(Applicant entity) {
        var item = new ApplicantItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("APPLICANT#" + id);

        // GSI1: Created date index
        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT)
                : LocalDateTime.now().format(ISO_FMT);
        item.setGsi1pk("APPLICANT_CREATED#" + tenantId);
        item.setGsi1sk("APPLICANT#" + createdAtStr);

        // GSI2: FK lookup by userId
        if (entity.getUserId() != null) {
            item.setGsi2pk("APPLICANT_USER#" + entity.getUserId());
            item.setGsi2sk("APPLICANT#" + id);
        }

        // GSI4: Unique constraint on email per tenant
        if (entity.getEmail() != null) {
            item.setGsi4pk("APPLICANT_EMAIL#" + tenantId + "#" + entity.getEmail());
            item.setGsi4sk("APPLICANT#" + id);
        }

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setSurname(entity.getSurname());
        item.setEmail(entity.getEmail());
        item.setPhone(encryptionService.encryptPII(entity.getPhone()));
        item.setIdPassportNumber(encryptionService.encryptPII(entity.getIdPassportNumber()));
        item.setAddress(encryptionService.encryptPII(entity.getAddress()));
        item.setLocation(entity.getLocation());
        item.setEducation(entity.getEducation());
        item.setExperience(entity.getExperience());
        item.setSkills(entity.getSkills());
        item.setLinkedinUrl(entity.getLinkedinUrl());
        item.setPortfolioUrl(entity.getPortfolioUrl());
        item.setResumeUrl(entity.getResumeUrl());
        item.setCoverLetter(entity.getCoverLetter());
        item.setSource(entity.getSource());
        if (entity.getUserId() != null) {
            item.setUserId(entity.getUserId().toString());
        }
        item.setGender(entity.getGender());
        item.setRace(entity.getRace());
        item.setDisabilityStatus(entity.getDisabilityStatus());
        item.setCitizenshipStatus(entity.getCitizenshipStatus());
        item.setDemographicsConsent(entity.getDemographicsConsent());
        if (entity.getDemographicsConsentDate() != null) {
            item.setDemographicsConsentDate(entity.getDemographicsConsentDate().format(ISO_FMT));
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    private CursorPage<Applicant> paginateInMemory(List<Applicant> all, String cursor, int pageSize) {
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try {
                offset = Integer.parseInt(cursor);
            } catch (NumberFormatException e) {
                offset = 0;
            }
        }
        List<Applicant> page = all.stream()
                .skip(offset)
                .limit(pageSize)
                .collect(Collectors.toList());
        boolean hasMore = offset + pageSize < all.size();
        String nextCursor = hasMore ? String.valueOf(offset + pageSize) : null;
        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) all.size());
    }
}
