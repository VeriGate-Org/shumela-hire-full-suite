package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencySubmission;
import com.arthmatic.shumelahire.entity.AgencySubmissionStatus;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.AgencySubmissionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.AgencySubmissionItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the AgencySubmission entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     AGENCY_SUBMISSION#{id}
 *   GSI1PK: AGSUBM_STATUS#{tenantId}#{status}         GSI1SK: AGENCY_SUBMISSION#{submittedAt}
 *   GSI2PK: AGSUBM_AGENCY#{tenantId}#{agencyId}       GSI2SK: AGENCY_SUBMISSION#{submittedAt}
 *   GSI6PK: AGSUBM_JOB#{tenantId}#{jobPostingId}      GSI6SK: AGENCY_SUBMISSION#{submittedAt}
 * </pre>
 */
@Repository
public class DynamoAgencySubmissionRepository extends DynamoRepository<AgencySubmissionItem, AgencySubmission>
        implements AgencySubmissionDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoAgencySubmissionRepository(DynamoDbClient dynamoDbClient,
                                             DynamoDbEnhancedClient enhancedClient,
                                             String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, AgencySubmissionItem.class);
    }

    @Override
    protected String entityType() {
        return "AGENCY_SUBMISSION";
    }

    // ── AgencySubmissionDataRepository implementation ─────────────────────────

    @Override
    public List<AgencySubmission> findByAgencyId(String agencyId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI2", "AGSUBM_AGENCY#" + tenantId + "#" + agencyId);
    }

    @Override
    public List<AgencySubmission> findByJobPostingId(String jobPostingId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI6", "AGSUBM_JOB#" + tenantId + "#" + jobPostingId);
    }

    @Override
    public List<AgencySubmission> findByStatus(AgencySubmissionStatus status) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "AGSUBM_STATUS#" + tenantId + "#" + status.name());
    }

    @Override
    public List<AgencySubmission> findByAgencyIdAndStatus(String agencyId, AgencySubmissionStatus status) {
        return findByAgencyId(agencyId).stream()
                .filter(s -> status.equals(s.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByAgencyId(String agencyId) {
        return findByAgencyId(agencyId).size();
    }

    @Override
    public long countByAgencyIdAndStatus(String agencyId, AgencySubmissionStatus status) {
        return findByAgencyIdAndStatus(agencyId, status).size();
    }

    // ── Conversion: AgencySubmissionItem <-> AgencySubmission ────────────────

    @Override
    protected AgencySubmission toEntity(AgencySubmissionItem item) {
        var entity = new AgencySubmission();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());

        // Set agency reference (lazy — just the ID)
        if (item.getAgencyId() != null) {
            var agency = new AgencyProfile();
            agency.setId(safeParseLong(item.getAgencyId()));
            entity.setAgency(agency);
        }

        // Set job posting reference (lazy — just the ID)
        if (item.getJobPostingId() != null) {
            var jobPosting = new JobPosting();
            jobPosting.setId(safeParseLong(item.getJobPostingId()));
            entity.setJobPosting(jobPosting);
        }

        entity.setCandidateName(item.getCandidateName());
        entity.setCandidateEmail(item.getCandidateEmail());
        entity.setCandidatePhone(item.getCandidatePhone());
        entity.setCvFileKey(item.getCvFileKey());
        entity.setCoverNote(item.getCoverNote());
        if (item.getStatus() != null) {
            entity.setStatus(AgencySubmissionStatus.valueOf(item.getStatus()));
        }

        // Set linked application reference (lazy — just the ID)
        if (item.getLinkedApplicationId() != null) {
            var app = new Application();
            app.setId(safeParseLong(item.getLinkedApplicationId()));
            entity.setLinkedApplication(app);
        }

        if (item.getSubmittedAt() != null) {
            entity.setSubmittedAt(LocalDateTime.parse(item.getSubmittedAt(), ISO_FMT));
        }
        if (item.getReviewedAt() != null) {
            entity.setReviewedAt(LocalDateTime.parse(item.getReviewedAt(), ISO_FMT));
        }
        if (item.getReviewedBy() != null) {
            entity.setReviewedBy(safeParseLong(item.getReviewedBy()));
        }
        return entity;
    }

    @Override
    protected AgencySubmissionItem toItem(AgencySubmission entity) {
        var item = new AgencySubmissionItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String agencyId = entity.getAgency() != null && entity.getAgency().getId() != null
                ? entity.getAgency().getId().toString() : "UNKNOWN";
        String jobPostingId = entity.getJobPosting() != null && entity.getJobPosting().getId() != null
                ? entity.getJobPosting().getId().toString() : "UNKNOWN";
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "SUBMITTED";
        String submittedAtStr = entity.getSubmittedAt() != null ? entity.getSubmittedAt().format(ISO_FMT) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("AGENCY_SUBMISSION#" + id);

        // GSI1: Status index, sorted by submittedAt
        item.setGsi1pk("AGSUBM_STATUS#" + tenantId + "#" + statusStr);
        item.setGsi1sk("AGENCY_SUBMISSION#" + submittedAtStr);

        // GSI2: FK lookup — agency, sorted by submittedAt
        item.setGsi2pk("AGSUBM_AGENCY#" + tenantId + "#" + agencyId);
        item.setGsi2sk("AGENCY_SUBMISSION#" + submittedAtStr);

        // GSI6: FK lookup — job posting, sorted by submittedAt
        item.setGsi6pk("AGSUBM_JOB#" + tenantId + "#" + jobPostingId);
        item.setGsi6sk("AGENCY_SUBMISSION#" + submittedAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setAgencyId(agencyId);
        item.setJobPostingId(jobPostingId);
        item.setCandidateName(entity.getCandidateName());
        item.setCandidateEmail(entity.getCandidateEmail());
        item.setCandidatePhone(entity.getCandidatePhone());
        item.setCvFileKey(entity.getCvFileKey());
        item.setCoverNote(entity.getCoverNote());
        item.setStatus(statusStr);
        if (entity.getLinkedApplication() != null && entity.getLinkedApplication().getId() != null) {
            item.setLinkedApplicationId(entity.getLinkedApplication().getId().toString());
        }
        if (entity.getSubmittedAt() != null) {
            item.setSubmittedAt(entity.getSubmittedAt().format(ISO_FMT));
        }
        if (entity.getReviewedAt() != null) {
            item.setReviewedAt(entity.getReviewedAt().format(ISO_FMT));
        }
        if (entity.getReviewedBy() != null) {
            item.setReviewedBy(entity.getReviewedBy().toString());
        }

        return item;
    }
}
