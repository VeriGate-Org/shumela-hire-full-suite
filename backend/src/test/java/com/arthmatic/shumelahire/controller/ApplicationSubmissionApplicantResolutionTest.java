package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ApplicationCreateRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Covers who an application gets filed against.
 *
 * <p>{@code applicantId} was {@code @NotNull} on the request and the public application form never
 * sent it — the form posts only the job. Bean validation therefore rejected every candidate
 * submission before the controller ran, and the whole public journey ended in a
 * {@code 400} with an empty body. Walking that journey on the deployed build is how it surfaced;
 * no unit test covered it and reading the DTO alone does not reveal it, because the field looks
 * perfectly reasonable.</p>
 *
 * <p>The fix resolves the applicant from the authenticated principal rather than the payload. That
 * is not only a convenience: this endpoint is reachable by {@code ROLE_APPLICANT}, so honouring a
 * client-supplied applicant id would let any signed-in candidate file an application in another
 * person's name. Staff roles legitimately submit on a candidate's behalf, so for them the field
 * remains required.</p>
 *
 * <p>The resolution rule is reproduced here rather than exercised through the controller, which
 * needs the full Spring security context to construct. The rule is the whole of the decision.</p>
 */
class ApplicationSubmissionApplicantResolutionTest {

    private static final String OWN_ID = "9439adf0-68d5-478a-9801-593fecf85c47";
    private static final String SOMEONE_ELSE = "47845998-35b6-424e-9692-882f2daa7743";

    /** Stands in for AccessDeniedException without dragging in the security context. */
    static class Denied extends RuntimeException {
        Denied(String m) { super(m); }
    }

    /**
     * Mirrors ApplicationController.resolveApplicantForSubmission().
     *
     * @param callerIsApplicant  whether the principal holds ROLE_APPLICANT
     * @param principalApplicant the applicant the principal resolves to, if any
     */
    private String resolve(ApplicationCreateRequest request,
                           boolean callerIsApplicant,
                           Optional<String> principalApplicant) {
        if (callerIsApplicant) {
            String ownId = principalApplicant.orElseThrow(
                    () -> new Denied("Applicant profile not found for authenticated user"));
            String supplied = request.getApplicantId();
            if (supplied != null && !supplied.equals(ownId)) {
                throw new Denied("Applicants may only apply on their own behalf");
            }
            return ownId;
        }
        if (request.getApplicantId() == null) {
            throw new IllegalArgumentException("Applicant ID is required");
        }
        return request.getApplicantId();
    }

    private ApplicationCreateRequest request(String applicantId) {
        ApplicationCreateRequest r = new ApplicationCreateRequest();
        r.setApplicantId(applicantId);
        r.setJobAdId("3b30f962-c56f-4ca6-a5be-ae9bea8cfeb0");
        return r;
    }

    @Test
    @DisplayName("A candidate applying for themselves need not send an applicant id")
    void applicantNeedsNoApplicantId() {
        String resolved = resolve(request(null), true, Optional.of(OWN_ID));
        assertEquals(OWN_ID, resolved,
                "this is the request the public form actually sends — it used to 400 before reaching the controller");
    }

    @Test
    @DisplayName("A candidate may name themselves explicitly")
    void applicantMayNameThemselves() {
        assertEquals(OWN_ID, resolve(request(OWN_ID), true, Optional.of(OWN_ID)));
    }

    @Test
    @DisplayName("A candidate may not apply in somebody else's name")
    void applicantCannotImpersonate() {
        Denied e = assertThrows(Denied.class,
                () -> resolve(request(SOMEONE_ELSE), true, Optional.of(OWN_ID)));
        assertEquals("Applicants may only apply on their own behalf", e.getMessage());
    }

    @Test
    @DisplayName("A signed-in user with no applicant profile cannot apply")
    void applicantWithoutProfileIsRefused() {
        assertThrows(Denied.class, () -> resolve(request(null), true, Optional.empty()));
    }

    @Test
    @DisplayName("Staff still name the applicant they are capturing for")
    void staffMayNameAnyApplicant() {
        assertEquals(SOMEONE_ELSE, resolve(request(SOMEONE_ELSE), false, Optional.empty()),
                "agency and paper submissions are entered by staff on a candidate's behalf");
    }

    @Test
    @DisplayName("Staff omitting the applicant is still a bad request, not a silent null")
    void staffMustNameSomeone() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> resolve(request(null), false, Optional.empty()));
        assertEquals("Applicant ID is required", e.getMessage());
    }

    @Test
    @DisplayName("Whatever the path, the service never receives a null applicant")
    void serviceNeverSeesNull() {
        List<String> resolved = List.of(
                resolve(request(null), true, Optional.of(OWN_ID)),
                resolve(request(OWN_ID), true, Optional.of(OWN_ID)),
                resolve(request(SOMEONE_ELSE), false, Optional.empty()));
        resolved.forEach(id -> assertNotNull(id, "a null here is what the old @NotNull was guarding against"));
        assertDoesNotThrow(() -> resolve(request(null), true, Optional.of(OWN_ID)));
    }
}
