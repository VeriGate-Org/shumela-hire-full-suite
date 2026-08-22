package com.arthmatic.shumelahire.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Pins the denormalised candidate name on Application.
 *
 * <p>Searching applications by candidate name returned nothing: the repository matched against the
 * {@code applicant} association, but that is loaded as a stub holding only an id and is hydrated
 * per page <em>after</em> filtering. Every applicant seen by the search was hollow, so only job
 * titles were ever searchable. These tests guard the resolution rule that replaced it.</p>
 */
class ApplicationCandidateNameTest {

    private Applicant applicant(String name, String surname) {
        Applicant a = new Applicant();
        a.setId("applicant-1");
        a.setName(name);
        a.setSurname(surname);
        return a;
    }

    @Test
    @DisplayName("Falls back to the stored name when the applicant is an unhydrated stub")
    void fallsBackToStoredNameForStubApplicant() {
        Application app = new Application();
        app.setCandidateName("Lerato Dlamini");

        Applicant stub = new Applicant();
        stub.setId("applicant-1");          // id only — exactly what toEntity produces
        app.setApplicant(stub);

        assertEquals("Lerato Dlamini", app.resolveCandidateName(),
                "a stub applicant must not mask the stored name, or search breaks again");
    }

    @Test
    @DisplayName("Prefers the hydrated applicant once it is loaded")
    void prefersHydratedApplicant() {
        Application app = new Application();
        app.setCandidateName("Stale Name");
        app.setApplicant(applicant("Lerato", "Dlamini"));

        assertEquals("Lerato Dlamini", app.resolveCandidateName());
    }

    @Test
    @DisplayName("Works with no applicant association at all")
    void worksWithNoApplicant() {
        Application app = new Application();
        app.setCandidateName("Lerato Dlamini");

        assertEquals("Lerato Dlamini", app.resolveCandidateName());
    }

    @Test
    @DisplayName("Returns null when nothing is known, rather than throwing")
    void nullWhenNothingKnown() {
        assertNull(new Application().resolveCandidateName());
    }

    @Test
    @DisplayName("A surname alone matches the stored name — the case that was broken")
    void surnameMatchesStoredName() {
        Application app = new Application();
        app.setCandidateName("Lerato Dlamini");

        String stored = app.resolveCandidateName().toLowerCase();
        assertEquals(true, stored.contains("dlamini"), "surname search must match");
        assertEquals(true, stored.contains("lerato"), "forename search must match");
    }
}
