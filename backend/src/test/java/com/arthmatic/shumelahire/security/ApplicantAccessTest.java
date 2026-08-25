package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Whether a caller may reach a particular applicant record.
 *
 * <p>Every id-scoped applicant endpoint used to take an id and check nothing about it. A signed-in
 * candidate could change the id in the URL and read, overwrite, or delete documents from another
 * candidate's file. These cases are each a person's data, so they are pinned individually.
 */
class ApplicantAccessTest {

    private ApplicantDataRepository applicantRepository;
    private ApplicantAccess access;

    @BeforeEach
    void setUp() {
        applicantRepository = mock(ApplicantDataRepository.class);
        when(applicantRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        access = new ApplicantAccess(applicantRepository);
    }

    private static Applicant applicant(String id, String email) {
        Applicant applicant = new Applicant();
        applicant.setId(id);
        applicant.setEmail(email);
        return applicant;
    }

    /** A principal carrying only roles. */
    private static Authentication as(String... roles) {
        return new UsernamePasswordAuthenticationToken("someone", "n/a",
                List.of(roles).stream().map(SimpleGrantedAuthority::new).toList());
    }

    /**
     * A real Jwt, because that is the principal production carries — a stand-in holding an email
     * would pass here while ActorEmail returned null against the real thing.
     */
    private static Authentication asCandidate(String email, String role) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("email", email)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        return new UsernamePasswordAuthenticationToken(jwt, "n/a",
                List.of(new SimpleGrantedAuthority(role)));
    }

    @Test
    @DisplayName("A candidate may reach their own record")
    void selfMaySeeOwnRecord() {
        Applicant self = applicant("a1", "me@example.com");
        when(applicantRepository.findByEmail("me@example.com")).thenReturn(Optional.of(self));

        assertTrue(access.maySee(asCandidate("me@example.com", "ROLE_APPLICANT"), "a1"));
    }

    @Test
    @DisplayName("A candidate may not reach somebody else's record by changing the id")
    void candidateMayNotWalkIds() {
        // The whole fault, in one assertion. Roles admitted the caller to the endpoint; nothing
        // asked whether the id belonged to them.
        Applicant self = applicant("a1", "me@example.com");
        when(applicantRepository.findByEmail("me@example.com")).thenReturn(Optional.of(self));

        assertFalse(access.maySee(asCandidate("me@example.com", "ROLE_APPLICANT"), "a2"));
    }

    @Test
    @DisplayName("An employee is a candidate like any other — being on the payroll grants nothing")
    void employeeIsNotStaff() {
        // EMPLOYEE was on every one of these endpoints. An employee applying for an internal
        // vacancy has no more claim on another applicant's file than an outside candidate.
        Applicant self = applicant("a1", "staffer@example.com");
        when(applicantRepository.findByEmail("staffer@example.com")).thenReturn(Optional.of(self));

        Authentication employee = asCandidate("staffer@example.com", "ROLE_EMPLOYEE");

        assertFalse(access.isStaff(employee));
        assertTrue(access.maySee(employee, "a1"));
        assertFalse(access.maySee(employee, "a2"));
    }

    @Test
    @DisplayName("Recruiting roles reach any record — that is the job")
    void staffMaySeeAnyRecord() {
        assertTrue(access.maySee(as("ROLE_ADMIN"), "a2"));
        assertTrue(access.maySee(as("ROLE_HR_MANAGER"), "a2"));
        assertTrue(access.maySee(as("ROLE_RECRUITER"), "a2"));
        assertTrue(access.maySee(as("ROLE_HIRING_MANAGER"), "a2"));
    }

    @Test
    @DisplayName("A staff user who has never applied is still staff")
    void staffWithoutAnApplicantRecord() {
        // self() is empty for them. isStaff has to carry the decision on its own, or the guard
        // would lock recruiters out of the records they exist to read.
        assertTrue(access.maySee(as("ROLE_RECRUITER"), "a2"));
        assertFalse(access.isSelf(as("ROLE_RECRUITER"), "a2"));
    }

    @Test
    @DisplayName("An unauthenticated or unidentifiable caller is nobody")
    void noPrincipalIsNobody() {
        assertFalse(access.maySee(null, "a1"));
        assertFalse(access.isSelf(null, "a1"));
        assertFalse(access.isStaff(null));
        // A token with no email claim cannot be matched to a record, so it is not self.
        assertFalse(access.isSelf(as("ROLE_APPLICANT"), "a1"));
    }

    @Test
    @DisplayName("A blank id is not a match")
    void blankIdIsNotSelf() {
        // Guards against a mapping that passes through a missing path variable and accidentally
        // matching an applicant whose id is also null.
        Applicant self = applicant(null, "me@example.com");
        when(applicantRepository.findByEmail("me@example.com")).thenReturn(Optional.of(self));

        Authentication candidate = asCandidate("me@example.com", "ROLE_APPLICANT");

        assertFalse(access.isSelf(candidate, null));
        assertFalse(access.isSelf(candidate, ""));
    }
}
