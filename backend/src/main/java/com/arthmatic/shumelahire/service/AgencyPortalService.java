package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.AgencyProfileDataRepository;
import com.arthmatic.shumelahire.repository.AgencySubmissionDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.dto.AgencyResponse;
import com.arthmatic.shumelahire.dto.AgencySummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AgencyPortalService {

    private static final Logger logger = LoggerFactory.getLogger(AgencyPortalService.class);

    @Autowired
    private AgencyProfileDataRepository agencyProfileRepository;

    @Autowired
    private AgencySubmissionDataRepository agencySubmissionRepository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    @Autowired
    private UserDataRepository userRepository;

    @Autowired(required = false)
    private CognitoAdminService cognitoAdminService;

    public AgencyProfile registerAgency(AgencyProfile agency) {
        agency.setStatus(AgencyStatus.PENDING_APPROVAL);
        agency.setCreatedAt(LocalDateTime.now());
        AgencyProfile saved = agencyProfileRepository.save(agency);
        logger.info("Agency registered: {}", saved.getAgencyName());
        return saved;
    }

    /**
     * Every agency, with contract state computed against today and its placement rate on the row.
     *
     * <p>Replaces having to call {@code getAgencyDashboard} once per agency to see a placement rate,
     * and adds the figure nothing anywhere computed: whether the contract has actually ended.
     *
     * <p>One read of every submission, grouped by agency, rather than two counts per agency.
     */
    public List<AgencyResponse> getAllAgenciesDetailed() {
        LocalDate today = LocalDate.now();

        Map<String, List<AgencySubmission>> byAgency = agencySubmissionRepository.findAll().stream()
                .filter(submission -> submission.getAgency() != null
                        && submission.getAgency().getId() != null)
                .collect(Collectors.groupingBy(submission -> submission.getAgency().getId()));

        return agencyProfileRepository.findAll().stream()
                .map(agency -> AgencyResponse.from(
                        agency, byAgency.getOrDefault(agency.getId(), List.of()), today))
                .toList();
    }

    /**
     * Counts across the whole panel.
     *
     * <p>Derived from the same {@link #getAllAgenciesDetailed()} objects the list is built from, so
     * the strip and the rows beneath it cannot disagree about what "lapsed" means.
     */
    public AgencySummaryResponse summary() {
        return AgencySummaryResponse.from(getAllAgenciesDetailed());
    }

    public List<AgencyProfile> getAllAgencies() {
        return agencyProfileRepository.findAll();
    }

    public AgencyProfile getAgency(String id) {
        return agencyProfileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Agency not found: " + id));
    }

    /**
     * Update an existing agency in place.
     * <p>
     * Until this existed the UI's "Edit Agency" form had nowhere to send its changes, so it
     * posted to {@code /register} instead and every edit minted a duplicate under a new id while
     * leaving the original untouched. Four agencies on the IDC tenant were three attempts to
     * rename one of them.
     * <p>
     * <strong>Status is deliberately not updatable here.</strong> It is owned by
     * {@link #approveAgency} and {@link #suspendAgency}, which enforce
     * {@link AgencyStatus#canTransitionTo}. Accepting it on this path would let an edit approve an
     * agency silently, bypassing that check — the identity, not the standing, is what this edits.
     * {@code id}, {@code status} and {@code createdAt} are all preserved from the stored record
     * regardless of what the request body carries.
     */
    @Transactional
    public AgencyProfile updateAgency(String id, AgencyProfile updates) {
        AgencyProfile existing = getAgency(id);

        existing.setAgencyName(updates.getAgencyName());
        existing.setRegistrationNumber(updates.getRegistrationNumber());
        existing.setContactPerson(updates.getContactPerson());
        existing.setContactEmail(updates.getContactEmail());
        existing.setContactPhone(updates.getContactPhone());
        existing.setSpecializations(updates.getSpecializations());
        existing.setFeePercentage(updates.getFeePercentage());
        existing.setContractStartDate(updates.getContractStartDate());
        existing.setContractEndDate(updates.getContractEndDate());
        existing.setBeeLevel(updates.getBeeLevel());
        existing.setUpdatedAt(LocalDateTime.now());

        AgencyProfile saved = agencyProfileRepository.save(existing);
        logger.info("Agency updated: {} ({})", saved.getAgencyName(), id);
        return saved;
    }

    /**
     * Remove an agency profile.
     * <p>
     * The repository's {@code deleteById} partitions on the current tenant, so this cannot reach
     * another tenant's record.
     */
    @Transactional
    public void deleteAgency(String id) {
        AgencyProfile agency = getAgency(id);
        agencyProfileRepository.deleteById(id);
        logger.info("Agency deleted: {} ({})", agency.getAgencyName(), id);
    }

    @Transactional
    public AgencyProfile approveAgency(String agencyId) {
        AgencyProfile agency = getAgency(agencyId);
        if (!agency.getStatus().canTransitionTo(AgencyStatus.APPROVED)) {
            throw new IllegalStateException("Cannot approve agency in status: " + agency.getStatus());
        }
        agency.setStatus(AgencyStatus.APPROVED);
        AgencyProfile saved = agencyProfileRepository.save(agency);

        // Activate the agency contact's user account
        activateAgencyUser(agency.getContactEmail());

        return saved;
    }

    private void activateAgencyUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        userOpt.ifPresent(user -> {
            user.setEnabled(true);
            userRepository.save(user);
            logger.info("Enabled user account for agency contact: {}", email);
        });

        if (cognitoAdminService != null) {
            try {
                cognitoAdminService.enableUser(email);
            } catch (Exception e) {
                logger.warn("Failed to enable Cognito user for {}: {}", email, e.getMessage());
            }
        }
    }

    @Transactional
    public AgencyProfile suspendAgency(String agencyId) {
        AgencyProfile agency = getAgency(agencyId);
        if (!agency.getStatus().canTransitionTo(AgencyStatus.SUSPENDED)) {
            throw new IllegalStateException("Cannot suspend agency in status: " + agency.getStatus());
        }
        agency.setStatus(AgencyStatus.SUSPENDED);
        AgencyProfile saved = agencyProfileRepository.save(agency);

        // Disable the agency contact's user account
        deactivateAgencyUser(agency.getContactEmail());

        return saved;
    }

    /**
     * Suspend approved agencies whose contract end date has passed.
     *
     * <p>Nothing acted on {@code contractEndDate}. An agency could be suspended by hand, and
     * {@code AgencyResponse} computed a {@code LAPSED} contract state for display, but a lapsed
     * agency kept its portal login and could keep submitting candidates indefinitely — the expiry
     * was a label on a screen, not a change in what the agency could do. Job ads have had a nightly
     * expiry job all along; agencies did not.
     *
     * <p>Three rules worth stating, because each is a way this could go wrong:
     *
     * <ol>
     *   <li><b>A null end date is never expired.</b> Most profiles carry no contract end date at
     *       all, and reading "not recorded" as "ended" would suspend the entire agency base on the
     *       first run. Whether the field should be mandatory is a separate question and not one a
     *       nightly job should answer by force.</li>
     *   <li><b>The end date is inclusive.</b> A contract ending today is still running today; it
     *       lapses tomorrow. Matches {@code findAdsToExpire}, which is the same decision already
     *       made for job ads.</li>
     *   <li><b>Suspension goes through the same path a person uses.</b> That disables the contact's
     *       user account and their Cognito login. Setting the status alone would produce an agency
     *       marked suspended that could still sign in — a worse state than the one being fixed,
     *       because it looks handled.</li>
     * </ol>
     *
     * <p>Idempotent: a suspended agency is no longer {@code APPROVED}, so a second run finds
     * nothing. Agencies still awaiting approval are left alone — {@code PENDING_APPROVAL} cannot
     * transition to {@code SUSPENDED}, and an expiry date on an unapproved agency is a data problem
     * for a person to look at, not something to resolve silently.
     *
     * @return how many agencies were suspended
     */
    @Transactional
    public int suspendExpiredContracts(LocalDate today) {
        List<AgencyProfile> expired = agencyProfileRepository.findByStatus(AgencyStatus.APPROVED).stream()
                .filter(agency -> agency.getContractEndDate() != null)
                .filter(agency -> agency.getContractEndDate().isBefore(today))
                .toList();

        int suspended = 0;
        for (AgencyProfile agency : expired) {
            try {
                suspendAgency(agency.getId());
                logger.info("Suspended agency {} — contract ended {}",
                        agency.getAgencyName(), agency.getContractEndDate());
                suspended++;
            } catch (Exception e) {
                // One agency with a bad record must not stop the rest being suspended. A contract
                // that has lapsed stays lapsed, and the next run will try again.
                logger.error("Could not suspend agency {} whose contract ended {}: {}",
                        agency.getId(), agency.getContractEndDate(), e.getMessage());
            }
        }
        return suspended;
    }

    private void deactivateAgencyUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        userOpt.ifPresent(user -> {
            user.setEnabled(false);
            userRepository.save(user);
            logger.info("Disabled user account for agency contact: {}", email);
        });

        if (cognitoAdminService != null) {
            try {
                cognitoAdminService.disableUser(email);
            } catch (Exception e) {
                logger.warn("Failed to disable Cognito user for {}: {}", email, e.getMessage());
            }
        }
    }

    @Transactional
    public AgencySubmission submitCandidate(String agencyId, AgencySubmission submission) {
        AgencyProfile agency = getAgency(agencyId);
        if (!agency.getStatus().isActive()) {
            throw new IllegalStateException("Only active agencies can submit candidates");
        }

        JobPosting jobPosting = jobPostingRepository.findById(submission.getJobPosting().getId())
            .orElseThrow(() -> new RuntimeException("Job posting not found"));

        submission.setAgency(agency);
        submission.setJobPosting(jobPosting);
        submission.setStatus(AgencySubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());

        AgencySubmission saved = agencySubmissionRepository.save(submission);
        logger.info("Agency {} submitted candidate {} for job posting {}",
            agency.getAgencyName(), submission.getCandidateName(), jobPosting.getId());
        return saved;
    }

    @Transactional
    public AgencySubmission reviewSubmission(String submissionId, boolean accept, String reviewedBy) {
        AgencySubmission submission = agencySubmissionRepository.findById(submissionId)
            .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        submission.setStatus(accept ? AgencySubmissionStatus.ACCEPTED : AgencySubmissionStatus.REJECTED);
        submission.setReviewedAt(LocalDateTime.now());
        submission.setReviewedBy(reviewedBy);

        AgencySubmission saved = agencySubmissionRepository.save(submission);
        logger.info("Submission {} {}", submissionId, accept ? "accepted" : "rejected");
        return saved;
    }

    public Map<String, Object> getAgencyDashboard(String agencyId) {
        AgencyProfile agency = getAgency(agencyId);
        long totalSubmissions = agencySubmissionRepository.countByAgencyId(agencyId);
        long acceptedSubmissions = agencySubmissionRepository.countByAgencyIdAndStatus(
            agencyId, AgencySubmissionStatus.ACCEPTED);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("agencyName", agency.getAgencyName());
        dashboard.put("status", agency.getStatus());
        dashboard.put("totalSubmissions", totalSubmissions);
        dashboard.put("acceptedSubmissions", acceptedSubmissions);
        dashboard.put("placementRate", totalSubmissions > 0
            ? (double) acceptedSubmissions / totalSubmissions * 100 : 0);
        return dashboard;
    }
}
