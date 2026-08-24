package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What a candidate-facing letter is addressed to when the applicant association was never
 * hydrated.
 *
 * <p><strong>Why this is a test and not a comment.</strong> On the DynamoDB backend
 * {@code DynamoApplicationRepository.toEntity} rebuilds {@code getApplicant()} as a stub carrying
 * the id and nothing else, and {@code PipelineService} passes that entity straight to
 * {@code NotificationService}. Nine notification bodies interpolated
 * {@code getApplicant().getFullName()} directly rather than through the service's own
 * {@code candidateNameOf} helper — the helper that exists precisely because this association is
 * routinely a stub.</p>
 *
 * <p>The severity is worth stating exactly, because it has been overstated once already:
 * {@code getFullName()} was hardened in #230 and returns <b>empty</b> for a stub, not the literal
 * {@code "null null"}. So the letter reads <b>"Dear ,"</b> — wrong, and visibly so to a candidate,
 * but not the garish failure the earlier note claimed. This test pins the real behaviour so the
 * next person does not have to re-derive it.</p>
 */
@DisplayName("Candidate letters — the name when nothing was hydrated")
class CandidateLetterNameTest {

    private static Application withApplicant(Applicant a) {
        Application app = new Application();
        app.setId("app-1");
        app.setJobTitle("Project Manager");
        app.setApplicant(a);
        return app;
    }

    /** Exactly what DynamoApplicationRepository.toEntity produces. */
    private static Applicant stub() {
        Applicant a = new Applicant();
        a.setId("applicant-1");
        return a;
    }

    private static Applicant full() {
        Applicant a = new Applicant();
        a.setId("applicant-1");
        a.setName("Lerato");
        a.setSurname("Dlamini");
        return a;
    }

    @Test
    @DisplayName("getFullName is empty for a stub — it does NOT say 'null null' (fixed in #230)")
    void stubYieldsEmptyNotNullNull() {
        assertEquals("", stub().getFullName(),
                "a stub must not stringify its missing halves");
        assertFalse(stub().getFullName().contains("null"),
                "the literal 'null' must never reach a candidate-facing string");
    }

    @Test
    @DisplayName("A half-populated applicant keeps the half that exists")
    void halfPopulatedIsReadable() {
        Applicant a = new Applicant();
        a.setName("Lerato");
        assertEquals("Lerato", a.getFullName(), "a missing surname must not add a trailing 'null'");
    }

    @Test
    @DisplayName("A hydrated applicant reads normally")
    void hydratedReadsNormally() {
        assertEquals("Lerato Dlamini", full().getFullName());
    }

    /**
     * The regression this change is about: interpolating the raw association into "Dear %s,".
     * With a stub that renders "Dear ," — which is what a rejected candidate would have received.
     */
    @Test
    @DisplayName("Interpolating the raw association gives 'Dear ,' — the defect")
    void rawAssociationGivesEmptyGreeting() {
        String greeting = String.format("Dear %s,", withApplicant(stub()).getApplicant().getFullName());
        assertEquals("Dear ,", greeting,
                "this is the string the nine un-routed notification bodies produced");
    }

    /**
     * NotificationService.candidateNameOf is private, so this asserts the contract it implements
     * rather than calling it: a stub must fall back to a neutral noun, never to empty.
     */
    @Test
    @DisplayName("The helper's contract: a stub falls back to a neutral noun")
    void helperContractFallsBackToNeutralNoun() {
        Applicant a = withApplicant(stub()).getApplicant();
        String first = a.getName() == null ? "" : a.getName().trim();
        String last = a.getSurname() == null ? "" : a.getSurname().trim();
        String full = (first + " " + last).trim();
        String resolved = full.isEmpty() ? "the candidate" : full;

        assertEquals("the candidate", resolved);
        assertTrue(String.format("Dear %s,", resolved).length() > "Dear ,".length(),
                "the fallback must actually address someone");
    }
}
