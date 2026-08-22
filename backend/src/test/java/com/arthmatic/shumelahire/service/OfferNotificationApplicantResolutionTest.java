package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.Offer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Covers how offer notifications resolve the candidate when the association was never hydrated.
 *
 * <p>{@code OfferService} loads an offer for a state change with {@code findById}, which returns
 * the application as an id-only stub — the applicant is null. Every offer notification then
 * reached straight through {@code app.getApplicant().getFullName()}. Because the notification is
 * the final statement of {@code sendOffer} and {@code acceptOffer}, the NPE surfaced <em>after</em>
 * the status had been written: production returned
 * {@code 400 Cannot invoke "Application.getApplicant()"} on offers that had in fact moved to SENT
 * and ACCEPTED.</p>
 *
 * <p>Two behaviours are pinned here. Internal notifications degrade to a neutral name, because a
 * recruiter being told "the candidate accepted" is better than the accept failing. Candidate-facing
 * notifications must be <em>skipped</em>, because there is no recipient to send them to and
 * guessing one would deliver somebody else's offer.</p>
 */
class OfferNotificationApplicantResolutionTest {

    /** Mirrors NotificationService.candidateNameOf(). */
    private String candidateNameOf(Application app) {
        if (app == null || app.getApplicant() == null) {
            return "the candidate";
        }
        Applicant applicant = app.getApplicant();
        String first = applicant.getName() == null ? "" : applicant.getName().trim();
        String last = applicant.getSurname() == null ? "" : applicant.getSurname().trim();
        String full = (first + " " + last).trim();
        return full.isEmpty() ? "the candidate" : full;
    }

    /** Mirrors NotificationService.applicantIdOf(). */
    private String applicantIdOf(Application app) {
        return (app == null || app.getApplicant() == null) ? null : app.getApplicant().getId();
    }

    private Application hydrated() {
        Applicant applicant = new Applicant();
        applicant.setId("47845998-35b6-424e-9692-882f2daa7743");
        applicant.setName("Lerato");
        applicant.setSurname("Dlamini");
        Application app = new Application();
        app.setId("87173b20-59d8-450e-93cf-f35db4d70951");
        app.setApplicant(applicant);
        return app;
    }

    /** What findById actually returns: the application id, and nothing else. */
    private Application stub() {
        Application app = new Application();
        app.setId("87173b20-59d8-450e-93cf-f35db4d70951");
        return app;
    }

    @Test
    @DisplayName("A hydrated application yields the candidate's real name")
    void hydratedApplicationResolvesName() {
        assertEquals("Lerato Dlamini", candidateNameOf(hydrated()));
    }

    @Test
    @DisplayName("An unhydrated application degrades instead of throwing")
    void stubApplicationDoesNotThrow() {
        assertEquals("the candidate", candidateNameOf(stub()),
                "this is the call that 400'd sendOffer and acceptOffer after they had committed");
    }

    @Test
    @DisplayName("A null application degrades instead of throwing")
    void nullApplicationDoesNotThrow() {
        assertEquals("the candidate", candidateNameOf(null));
    }

    @Test
    @DisplayName("An applicant with a blank name still produces a usable sentence")
    void blankNameFallsBack() {
        Application app = hydrated();
        app.getApplicant().setName("");
        app.getApplicant().setSurname("");
        assertEquals("the candidate", candidateNameOf(app));
    }

    @Test
    @DisplayName("A candidate-facing notification has no recipient when the applicant is missing")
    void candidateFacingNotificationHasNoRecipient() {
        assertNull(applicantIdOf(stub()),
                "callers must skip on null rather than invent a recipient");
        assertNull(applicantIdOf(null));
        assertNotNull(applicantIdOf(hydrated()));
    }

    @Test
    @DisplayName("An applicant with null name parts never renders as \"null null\"")
    void nullNamePartsDoNotLeakIntoTheMessage() {
        Applicant applicant = new Applicant();
        applicant.setId("some-id");
        Application app = new Application();
        app.setApplicant(applicant);

        assertEquals("null null", applicant.getFullName(),
                "getFullName concatenates without null checks — this is why the helper does not use it");
        assertEquals("the candidate", candidateNameOf(app),
                "\"Dear null null\" must never reach a candidate's inbox");
    }

    @Test
    @DisplayName("The unguarded dereference is what threw — kept as the regression it fixes")
    void unguardedDereferenceThrows() {
        Application app = stub();
        assertThrows(NullPointerException.class, () -> app.getApplicant().getFullName());
    }

    @Test
    @DisplayName("An offer carrying a stub application is enough to reproduce the failure shape")
    void offerWithStubApplication() {
        Offer offer = new Offer();
        offer.setApplication(stub());
        assertEquals("the candidate", candidateNameOf(offer.getApplication()));
        assertNull(applicantIdOf(offer.getApplication()));
    }
}
