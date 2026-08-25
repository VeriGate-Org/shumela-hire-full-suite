package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;

/**
 * Whether a caller may reach a particular applicant record.
 *
 * <p><b>Every applicant endpoint that admits {@code APPLICANT} and {@code EMPLOYEE} took an id and
 * checked nothing about it.</b> The role list on each mapping decided whether you could call the
 * endpoint at all; it could not decide whose record you were calling it about. A signed-in
 * candidate who changed the id in the URL could read another candidate's record, overwrite it,
 * list their documents, upload to their file, and delete documents from it.
 *
 * <p>{@link DemographicsAccess} looks adjacent but is not the same guard: it decides whether the
 * four equity fields are disclosed. It was doing its job — the rest of the record was never
 * protected by anything, so redaction of race and gender sat on top of an unprotected name, email,
 * phone, address, education history and document list.
 *
 * <p>Identity is the email on the token, matched against the email on the applicant record — the
 * same rule {@code DemographicsAccess.isSelf} already used, lifted here so authorisation and
 * disclosure agree about who somebody is.
 *
 * <p>Referenced from {@code @PreAuthorize} by bean name, so the rule stays legible at the endpoint
 * it protects rather than being buried in a service.
 */
@Component("applicantAccess")
public class ApplicantAccess {

    /**
     * Roles whose job is other people's applications.
     *
     * <p>Deliberately excludes {@code EMPLOYEE}: an employee applying for an internal vacancy is a
     * candidate like any other, and being on the payroll is not a reason to read the file of
     * whoever else applied.
     */
    private static final Set<String> STAFF_ROLES = Set.of(
            "ROLE_ADMIN", "ROLE_HR_MANAGER", "ROLE_RECRUITER", "ROLE_HIRING_MANAGER");

    private final ApplicantDataRepository applicantRepository;

    public ApplicantAccess(ApplicantDataRepository applicantRepository) {
        this.applicantRepository = applicantRepository;
    }

    /** The applicant record belonging to the caller, if they have one. */
    public Optional<Applicant> self(Authentication authentication) {
        String email = ActorEmail.of(authentication);
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return applicantRepository.findByEmail(email);
    }

    /** Whether this caller holds a role that handles other people's applications. */
    public boolean isStaff(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(STAFF_ROLES::contains);
    }

    /**
     * Whether this applicant id is the caller's own record.
     *
     * <p>Returns false when the caller has no applicant record, rather than throwing: a staff user
     * who has never applied is not an error, they simply are not this applicant, and the
     * {@code isStaff} half of the expression is what admits them.
     */
    public boolean isSelf(Authentication authentication, String applicantId) {
        if (applicantId == null || applicantId.isBlank()) {
            return false;
        }
        return self(authentication)
                .map(applicant -> applicantId.equals(applicant.getId()))
                .orElse(false);
    }

    /**
     * Whether the caller may reach this applicant record at all.
     *
     * <p>The expression used at every id-scoped applicant endpoint. Staff by role, everyone else
     * only for themselves.
     */
    public boolean maySee(Authentication authentication, String applicantId) {
        return isStaff(authentication) || isSelf(authentication, applicantId);
    }
}
