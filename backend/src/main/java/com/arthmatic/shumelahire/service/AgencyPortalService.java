package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.AgencyProfileDataRepository;
import com.arthmatic.shumelahire.repository.AgencySubmissionDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    public List<AgencyProfile> getAllAgencies() {
        return agencyProfileRepository.findAll();
    }

    public AgencyProfile getAgency(Long id) {
        return agencyProfileRepository.findById(String.valueOf(id))
            .orElseThrow(() -> new RuntimeException("Agency not found: " + id));
    }

    @Transactional
    public AgencyProfile approveAgency(Long agencyId) {
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
    public AgencyProfile suspendAgency(Long agencyId) {
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
    public AgencySubmission submitCandidate(Long agencyId, AgencySubmission submission) {
        AgencyProfile agency = getAgency(agencyId);
        if (!agency.getStatus().isActive()) {
            throw new IllegalStateException("Only active agencies can submit candidates");
        }

        JobPosting jobPosting = jobPostingRepository.findById(String.valueOf(submission.getJobPosting().getId()))
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
    public AgencySubmission reviewSubmission(Long submissionId, boolean accept, Long reviewedBy) {
        AgencySubmission submission = agencySubmissionRepository.findById(String.valueOf(submissionId))
            .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        submission.setStatus(accept ? AgencySubmissionStatus.ACCEPTED : AgencySubmissionStatus.REJECTED);
        submission.setReviewedAt(LocalDateTime.now());
        submission.setReviewedBy(reviewedBy);

        AgencySubmission saved = agencySubmissionRepository.save(submission);
        logger.info("Submission {} {}", submissionId, accept ? "accepted" : "rejected");
        return saved;
    }

    public Map<String, Object> getAgencyDashboard(Long agencyId) {
        AgencyProfile agency = getAgency(agencyId);
        long totalSubmissions = agencySubmissionRepository.countByAgencyId(String.valueOf(agencyId));
        long acceptedSubmissions = agencySubmissionRepository.countByAgencyIdAndStatus(
            String.valueOf(agencyId), AgencySubmissionStatus.ACCEPTED);

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
