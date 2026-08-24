package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Who may see an applicant's race, gender, disability and citizenship.
 *
 * <p>These fields exist for employment-equity reporting, which is an HR function. They were being
 * returned in the clear from every applicant endpoint, several of which are authorised for
 * RECRUITER, HIRING_MANAGER, APPLICANT and EMPLOYEE — so any signed-in employee, and any signed-in
 * candidate, could page every applicant's demographics.
 *
 * <p>Three rules, and the order matters:
 *
 * <ol>
 *   <li>An applicant may always see their own record. They entered it.</li>
 *   <li>An explicit refusal of consent is honoured against everyone else — that is what the flag
 *       is for, and it was never once consulted.</li>
 *   <li>Otherwise only ADMIN and HR_MANAGER may see it. A recruiter screening a candidate does not
 *       need to know their race to do it, and a hiring manager needs it less.</li>
 * </ol>
 *
 * <p><b>A null consent flag is treated as unanswered, not as refusal.</b> Most existing records
 * carry null because nothing ever set it; reading that as a refusal would silently empty
 * equity reporting for every applicant captured before the flag was used. Refusal has to be
 * something the applicant actually said.
 */
@Component
public class DemographicsAccess {

    /** Roles for whom these fields are part of the job. */
    private static final Set<String> EQUITY_ROLES = Set.of("ROLE_ADMIN", "ROLE_HR_MANAGER");

    private final ApplicantDataRepository applicantRepository;

    public DemographicsAccess(ApplicantDataRepository applicantRepository) {
        this.applicantRepository = applicantRepository;
    }

    /** Whether this viewer may see the demographic fields on this applicant. */
    public boolean mayView(Authentication authentication, Applicant applicant) {
        if (applicant == null) {
            return false;
        }
        if (isSelf(authentication, applicant)) {
            return true;
        }
        if (Boolean.FALSE.equals(applicant.getDemographicsConsent())) {
            return false;
        }
        return hasEquityRole(authentication);
    }

    /**
     * Whether this viewer holds a role the fields belong to.
     *
     * <p>Used where the record is not in hand — a list being built, say — so that a caller can
     * avoid resolving consent per row when the viewer could not see any of it regardless.
     */
    public boolean hasEquityRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(EQUITY_ROLES::contains);
    }

    /** Is the viewer this applicant? Matched on email, which is the applicant's identity here. */
    private boolean isSelf(Authentication authentication, Applicant applicant) {
        if (authentication == null || applicant.getEmail() == null) {
            return false;
        }
        String email = ActorEmail.of(authentication);
        if (email == null) {
            return false;
        }
        return applicantRepository.findByEmail(email)
                .map(self -> self.getId() != null && self.getId().equals(applicant.getId()))
                .orElse(false);
    }
}
