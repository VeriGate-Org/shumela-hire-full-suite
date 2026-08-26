package com.arthmatic.shumelahire.service.analytics;

import com.arthmatic.shumelahire.entity.CompanyDocument;
import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;
import com.arthmatic.shumelahire.entity.compliance.DsarStatus;
import com.arthmatic.shumelahire.entity.training.Certification;
import com.arthmatic.shumelahire.repository.CertificationDataRepository;
import com.arthmatic.shumelahire.repository.CompanyDocumentAcknowledgementDataRepository;
import com.arthmatic.shumelahire.repository.CompanyDocumentDataRepository;
import com.arthmatic.shumelahire.repository.ConsentRecordDataRepository;
import com.arthmatic.shumelahire.repository.DataSubjectRequestDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * Compliance analytics, measured rather than asserted.
 *
 * <p>This returned a hand-written mock: a 91.5% compliance score, six months of invented trend data,
 * per-department scores, and five named employees who do not exist. The code was honest about it —
 * the method was called {@code getComplianceMetricsMock()} and explained itself — but the page
 * rendered the result as fact, which is the only part a reader ever saw.
 *
 * <p>Every figure below is now counted from a repository. Several of the old ones are simply gone,
 * and their absence is the point:
 *
 * <ul>
 *   <li><b>The compliance score and POPIA rate.</b> A percentage nobody can define is how 91.5%
 *       came to exist. There is no formula these could be computed from, so there is no number.</li>
 *   <li><b>Monthly trends.</b> Nothing stores a historical snapshot, so a trend line could only be
 *       fabricated. Comparing today against today is not a trend.</li>
 *   <li><b>Per-department scores.</b> {@code department} is free text on employees and vacancies,
 *       not a modelled entity, and no compliance obligation attaches to one.</li>
 *   <li><b>Open disciplinary cases.</b> The feature was removed as out of scope.</li>
 *   <li><b>Overdue training.</b> {@code TrainingEnrollment} records enrolment and completion but no
 *       deadline, so "overdue" cannot be derived. Incomplete enrolments are counted instead, under a
 *       name that says what they are.</li>
 * </ul>
 *
 * <p>What remains is smaller and true. The figure worth leading on — <b>data-subject requests past
 * their statutory deadline</b> — was not in the mock at all, and is the one thing on this page
 * somebody is accountable for under POPIA.
 */
@Service
@Transactional(readOnly = true)
public class ComplianceAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(ComplianceAnalyticsService.class);

    /** How far ahead a certificate counts as "expiring". */
    private static final int EXPIRY_HORIZON_DAYS = 90;

    /** Certificates listed individually before the list is truncated. */
    private static final int LIST_LIMIT = 20;

    @Autowired
    private AuditLogService auditLogService;

    private final CertificationDataRepository certificationRepository;
    private final DataSubjectRequestDataRepository dsarRepository;
    private final ConsentRecordDataRepository consentRepository;
    private final CompanyDocumentDataRepository documentRepository;
    private final CompanyDocumentAcknowledgementDataRepository acknowledgementRepository;

    public ComplianceAnalyticsService(CertificationDataRepository certificationRepository,
                                      DataSubjectRequestDataRepository dsarRepository,
                                      ConsentRecordDataRepository consentRepository,
                                      CompanyDocumentDataRepository documentRepository,
                                      CompanyDocumentAcknowledgementDataRepository acknowledgementRepository) {
        this.certificationRepository = certificationRepository;
        this.dsarRepository = dsarRepository;
        this.consentRepository = consentRepository;
        this.documentRepository = documentRepository;
        this.acknowledgementRepository = acknowledgementRepository;
    }

    public Map<String, Object> getComplianceMetrics() {
        logger.info("Computing compliance analytics");
        auditLogService.logSystemAction("VIEW", "COMPLIANCE_ANALYTICS", "Compliance metrics requested");

        LocalDate today = LocalDate.now();
        Map<String, Object> metrics = new LinkedHashMap<>();

        List<Certification> expiring = safely(
                () -> certificationRepository.findExpiringSoon(today, today.plusDays(EXPIRY_HORIZON_DAYS)),
                "expiring certifications");
        List<Certification> expired = safely(certificationRepository::findExpired, "expired certifications");
        List<DataSubjectRequest> requests = safely(dsarRepository::findAll, "data-subject requests");

        List<DataSubjectRequest> openRequests = requests.stream()
                .filter(r -> r.getStatus() != DsarStatus.COMPLETED && r.getStatus() != DsarStatus.REJECTED)
                .toList();
        // Past its deadline and still open. A request without a recorded due date is not counted as
        // breached — the absence of a date is a data-quality problem, and reporting it as a breach
        // would make the number unusable for the thing it exists to drive.
        List<DataSubjectRequest> overdueRequests = openRequests.stream()
                .filter(r -> r.getDueDate() != null && r.getDueDate().isBefore(today))
                .toList();
        long undatedRequests = openRequests.stream().filter(r -> r.getDueDate() == null).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("expiringCertifications", expiring.size());
        summary.put("expiredCertifications", expired.size());
        summary.put("openDataSubjectRequests", openRequests.size());
        summary.put("overdueDataSubjectRequests", overdueRequests.size());
        summary.put("dataSubjectRequestsWithoutDueDate", undatedRequests);
        summary.put("consentsGranted", safely(consentRepository::countByIsGrantedTrue, "consents granted", 0L));
        summary.put("consentsWithdrawn", safely(consentRepository::countByIsGrantedFalse, "consents withdrawn", 0L));
        summary.put("expiryHorizonDays", EXPIRY_HORIZON_DAYS);
        metrics.put("summary", summary);

        metrics.put("expiringCertifications", expiring.stream()
                .sorted(Comparator.comparing(Certification::getExpiryDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(LIST_LIMIT)
                .map(c -> certificationRow(c, today))
                .toList());
        metrics.put("expiringCertificationsTruncated", expiring.size() > LIST_LIMIT);

        metrics.put("overdueDataSubjectRequests", overdueRequests.stream()
                .sorted(Comparator.comparing(DataSubjectRequest::getDueDate))
                .limit(LIST_LIMIT)
                .map(r -> dsarRow(r, today))
                .toList());

        metrics.put("acknowledgements", acknowledgementRows());

        return metrics;
    }

    private Map<String, Object> certificationRow(Certification c, LocalDate today) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("certification", c.getName());
        row.put("issuingBody", c.getIssuingBody());
        row.put("expiryDate", c.getExpiryDate());
        row.put("daysUntilExpiry", c.getExpiryDate() == null
                ? null
                : java.time.temporal.ChronoUnit.DAYS.between(today, c.getExpiryDate()));
        // The employee association is not always hydrated on the item, and a row that silently
        // omits who it concerns is worse than one that says it does not know.
        row.put("employeeName", c.getEmployee() != null ? c.getEmployee().getFullName() : null);
        return row;
    }

    private Map<String, Object> dsarRow(DataSubjectRequest r, LocalDate today) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("requesterName", r.getRequesterName());
        row.put("requestType", r.getRequestType() != null ? r.getRequestType().name() : null);
        row.put("status", r.getStatus() != null ? r.getStatus().name() : null);
        row.put("dueDate", r.getDueDate());
        row.put("daysOverdue", java.time.temporal.ChronoUnit.DAYS.between(r.getDueDate(), today));
        return row;
    }

    /**
     * Acknowledgement counts per published document that requires one.
     *
     * <p>Reports how many people have acknowledged, and deliberately not how many have <em>not</em>.
     * A "pending" figure needs a headcount to subtract from, and inventing that denominator is how
     * "22 pending of 342 employees" appeared on a tenant with no employee records at all.
     */
    private List<Map<String, Object>> acknowledgementRows() {
        List<CompanyDocument> documents = safely(documentRepository::findPublished, "published documents");
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CompanyDocument doc : documents) {
            if (!Boolean.TRUE.equals(doc.getRequiresAcknowledgement())) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("documentTitle", doc.getTitle());
            row.put("acknowledged",
                    safely(() -> acknowledgementRepository.findByDocumentId(doc.getId()), "acknowledgements").size());
            rows.add(row);
        }
        return rows;
    }

    /**
     * Runs a repository call, returning empty rather than failing the whole page.
     *
     * <p>One unavailable repository used to be impossible here, because nothing was read. Now that
     * six are, a single failure must not take the other five with it — but it is logged, so an empty
     * section is traceable to a cause instead of looking like a tenant with nothing to report.
     */
    private <T> List<T> safely(java.util.function.Supplier<List<T>> call, String what) {
        try {
            List<T> result = call.get();
            return result != null ? result : List.of();
        } catch (RuntimeException e) {
            logger.error("Compliance analytics: could not read {}: {}", what, e.getMessage());
            return List.of();
        }
    }

    private <T> T safely(java.util.function.Supplier<T> call, String what, T fallback) {
        try {
            T result = call.get();
            return result != null ? result : fallback;
        } catch (RuntimeException e) {
            logger.error("Compliance analytics: could not read {}: {}", what, e.getMessage());
            return fallback;
        }
    }
}
