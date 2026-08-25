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
 * Who may see an applicant's race, gender, disability and citizenship.
 *
 * <p>These fields were returned in the clear from endpoints authorised for RECRUITER,
 * HIRING_MANAGER, APPLICANT and EMPLOYEE, so any signed-in employee — and any signed-in candidate —
 * could page every applicant's demographics. This is the rule that stopped it, and it is worth
 * pinning exactly, because every one of these cases is a person's data.
 */
class DemographicsAccessTest {

    private ApplicantDataRepository applicantRepository;
    private DemographicsAccess access;

    @BeforeEach
    void setUp() {
        applicantRepository = mock(ApplicantDataRepository.class);
        when(applicantRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        access = new DemographicsAccess(applicantRepository);
    }

    private static Applicant applicant(String id, String email, Boolean consent) {
        Applicant applicant = new Applicant();
        applicant.setId(id);
        applicant.setEmail(email);
        applicant.setDemographicsConsent(consent);
        return applicant;
    }

    /** A principal carrying nothing but roles — enough for the role half of the rule. */
    private static Authentication as(String... roles) {
        return new UsernamePasswordAuthenticationToken("someone", "n/a",
                List.of(roles).stream().map(SimpleGrantedAuthority::new).toList());
    }

    @Test
    @DisplayName("HR and administrators may see demographics — the fields exist for their job")
    void equityRolesMayView() {
        Applicant subject = applicant("a1", "candidate@example.com", null);

        assertTrue(access.mayView(as("ROLE_HR_MANAGER"), subject));
        assertTrue(access.mayView(as("ROLE_ADMIN"), subject));
    }

    @Test
    @DisplayName("A recruiter may — they capture and correct the record these fields live on")
    void recruiterMayView() {
        // Reversed deliberately, not drifted. This test previously read "a recruiter cannot —
        // screening a candidate does not require their race", which is the stronger
        // data-minimisation position and was the right default.
        //
        // It was changed because a recruiter owns applicant capture: with the fields invisible to
        // them the applicant screen showed blanks they could not fill, and — before the guard in
        // ApplicantService — a recruiter saving that form wrote nulls over the candidate's answers.
        // The choice is between a recruiter seeing the data and a recruiter silently destroying it.
        //
        // The list stays short. Widening it further should be a decision taken as explicitly as
        // this one was.
        Applicant subject = applicant("a1", "candidate@example.com", null);

        assertTrue(access.mayView(as("ROLE_RECRUITER"), subject));
    }

    @Test
    @DisplayName("A hiring manager still cannot — selection is not what this data is for")
    void hiringManagerMayNotView() {
        // The reason the original test gave still holds for this role: employment-equity answers
        // are collected for reporting, and the person choosing between candidates has no need of
        // them. An interviewer is excluded for the same reason and by the same list.
        Applicant subject = applicant("a1", "candidate@example.com", null);

        assertFalse(access.mayView(as("ROLE_HIRING_MANAGER"), subject));
        assertFalse(access.mayView(as("ROLE_INTERVIEWER"), subject));
    }

    @Test
    @DisplayName("An ordinary employee cannot, which was the exposure")
    void employeeMayNotView() {
        // GET /api/applicants is authorised for EMPLOYEE. Every one of them could read this.
        assertFalse(access.mayView(as("ROLE_EMPLOYEE"), applicant("a1", "c@example.com", null)));
    }

    @Test
    @DisplayName("A candidate cannot read another candidate's demographics")
    void applicantMayNotViewAnother() {
        // The endpoint is authorised for APPLICANT, so this was reachable by any signed-in
        // candidate against the whole applicant table.
        Applicant viewerRecord = applicant("a1", "me@example.com", null);
        Applicant other = applicant("a2", "someone.else@example.com", null);
        when(applicantRepository.findByEmail("me@example.com")).thenReturn(Optional.of(viewerRecord));

        Authentication viewer = asApplicant("me@example.com");

        assertFalse(access.mayView(viewer, other));
    }

    @Test
    @DisplayName("An applicant may always see their own record — they entered it")
    void applicantMayViewSelf() {
        Applicant self = applicant("a1", "me@example.com", null);
        when(applicantRepository.findByEmail("me@example.com")).thenReturn(Optional.of(self));

        Authentication viewer = asApplicant("me@example.com");

        assertTrue(access.mayView(viewer, self));
    }

    @Test
    @DisplayName("A refusal of consent is honoured against HR")
    void refusedConsentIsHonoured() {
        // The flag existed and was never once consulted. Refusing and being read anyway is worse
        // than never being asked.
        Applicant refused = applicant("a1", "candidate@example.com", false);

        assertFalse(access.mayView(as("ROLE_HR_MANAGER"), refused));
        assertFalse(access.mayView(as("ROLE_ADMIN"), refused));
    }

    @Test
    @DisplayName("A refusal does not hide the record from the applicant themselves")
    void refusalDoesNotHideFromSelf() {
        Applicant self = applicant("a1", "me@example.com", false);
        when(applicantRepository.findByEmail("me@example.com")).thenReturn(Optional.of(self));

        Authentication viewer = asApplicant("me@example.com");

        assertTrue(access.mayView(viewer, self));
    }

    @Test
    @DisplayName("An unanswered consent flag is not read as a refusal")
    void nullConsentIsNotRefusal() {
        // Most existing records carry null because nothing ever set it. Reading that as refusal
        // would silently empty equity reporting for every applicant captured before the flag was
        // used — refusal has to be something the applicant actually said.
        assertTrue(access.mayView(as("ROLE_HR_MANAGER"), applicant("a1", "c@example.com", null)));
        assertTrue(access.mayView(as("ROLE_HR_MANAGER"), applicant("a2", "c2@example.com", true)));
    }

    @Test
    @DisplayName("No authentication and no applicant both fail closed")
    void missingInputsFailClosed() {
        assertFalse(access.mayView(null, applicant("a1", "c@example.com", null)));
        assertFalse(access.mayView(as("ROLE_HR_MANAGER"), null));
    }

    @Test
    @DisplayName("hasEquityRole answers the role question without a record in hand")
    void equityRoleIsCheckableAlone() {
        assertTrue(access.hasEquityRole(as("ROLE_ADMIN")));
        assertTrue(access.hasEquityRole(as("ROLE_RECRUITER")));
        assertFalse(access.hasEquityRole(as("ROLE_HIRING_MANAGER")));
        assertFalse(access.hasEquityRole(null));
    }

    /**
     * A real Jwt, because that is the principal production actually carries.
     *
     * <p>A stand-in that merely holds an email would pass while ActorEmail — which unwraps a Jwt
     * claim — returned null against the real thing.
     */
    private static Authentication asApplicant(String email) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("email", email)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        return new UsernamePasswordAuthenticationToken(jwt, "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_APPLICANT")));
    }
}
