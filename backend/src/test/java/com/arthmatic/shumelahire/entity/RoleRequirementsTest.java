package com.arthmatic.shumelahire.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers the structured requirements a vacancy carries, and the comparisons shortlisting needs.
 *
 * <p>Until now a job posting described what it wanted only in prose — {@code requirements} and
 * {@code qualifications} are paragraphs written for candidates. Applicant skills, experience and
 * education are already stored as structured lists, so there was nothing on the role side to
 * compare them against. That is why every scoring dimension in {@code ShortlistingService} returned
 * a constant: not an oversight in the arithmetic, an absence of the other operand.</p>
 */
class RoleRequirementsTest {

    private JobPosting posting(ExperienceLevel level) {
        JobPosting p = new JobPosting();
        p.setTitle("Project Manager");
        p.setExperienceLevel(level);
        return p;
    }

    // ── Skills ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("A posting carries required and preferred skills separately")
    void skillsAreHeldSeparately() {
        JobPosting p = posting(ExperienceLevel.SENIOR);
        p.setRequiredSkills(List.of("Project management", "PFMA reporting"));
        p.setPreferredSkills(List.of("PMP", "Development finance"));

        assertEquals(List.of("Project management", "PFMA reporting"), p.getRequiredSkills());
        assertEquals(List.of("PMP", "Development finance"), p.getPreferredSkills());
    }

    @Test
    @DisplayName("Skill lists default to empty, never null")
    void skillListsDefaultEmpty() {
        JobPosting p = new JobPosting();
        assertNotNull(p.getRequiredSkills(), "scoring must not have to null-check every read");
        assertTrue(p.getRequiredSkills().isEmpty());
        assertNotNull(p.getPreferredSkills());
    }

    @Test
    @DisplayName("Setting a null skill list yields an empty one")
    void nullSkillsBecomeEmpty() {
        JobPosting p = new JobPosting();
        p.setRequiredSkills(null);
        p.setPreferredSkills(null);
        assertTrue(p.getRequiredSkills().isEmpty());
        assertTrue(p.getPreferredSkills().isEmpty());
    }

    // ── Experience ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Minimum years is derived from the experience level already on the posting")
    void minimumYearsComesFromTheExistingEnum() {
        assertEquals(6, posting(ExperienceLevel.SENIOR).getMinExperienceYears());
        assertEquals(3, posting(ExperienceLevel.MID_LEVEL).getMinExperienceYears());
        assertEquals(0, posting(ExperienceLevel.ENTRY_LEVEL).getMinExperienceYears());
    }

    @Test
    @DisplayName("A posting with no experience level asks for no experience")
    void missingLevelMeansNoRequirement() {
        JobPosting p = new JobPosting();
        p.setExperienceLevel(null);
        assertEquals(0, p.getMinExperienceYears(),
                "a posting with no level set must not silently demand seniority");
    }

    // ── Education ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("A higher qualification satisfies a lower requirement")
    void higherQualificationSatisfiesLower() {
        assertTrue(EducationLevel.HONOURS.satisfies(EducationLevel.BACHELORS));
        assertTrue(EducationLevel.DOCTORATE.satisfies(EducationLevel.MATRIC));
        assertTrue(EducationLevel.BACHELORS.satisfies(EducationLevel.BACHELORS));
    }

    @Test
    @DisplayName("A lower qualification does not satisfy a higher requirement")
    void lowerQualificationFails() {
        assertFalse(EducationLevel.DIPLOMA.satisfies(EducationLevel.BACHELORS));
        assertFalse(EducationLevel.MATRIC.satisfies(EducationLevel.HONOURS));
    }

    @Test
    @DisplayName("A role naming no qualification is satisfied by any candidate")
    void nullRequirementIsSatisfiedByAnything() {
        assertTrue(EducationLevel.NONE.satisfies(null),
                "a vacancy that does not ask for a degree must not mark down those without one");
        assertTrue(EducationLevel.MATRIC.satisfies(null));
    }

    @Test
    @DisplayName("The ladder is strictly ordered")
    void ladderIsOrdered() {
        EducationLevel[] ascending = {
                EducationLevel.NONE, EducationLevel.MATRIC, EducationLevel.CERTIFICATE,
                EducationLevel.DIPLOMA, EducationLevel.BACHELORS, EducationLevel.HONOURS,
                EducationLevel.MASTERS, EducationLevel.DOCTORATE };
        for (int i = 1; i < ascending.length; i++) {
            assertTrue(ascending[i].getRank() > ascending[i - 1].getRank(),
                    ascending[i] + " must outrank " + ascending[i - 1]);
            assertTrue(ascending[i].satisfies(ascending[i - 1]));
            assertFalse(ascending[i - 1].satisfies(ascending[i]));
        }
    }

    @Test
    @DisplayName("Qualification levels carry their NQF equivalent")
    void levelsCarryNqf() {
        assertEquals("NQF 7", EducationLevel.BACHELORS.getNqfLevel());
        assertEquals("NQF 4", EducationLevel.MATRIC.getNqfLevel());
        assertEquals(null, EducationLevel.NONE.getNqfLevel(),
                "'no requirement' is not a qualification and has no NQF level");
    }

    // ── The whole thing together ──────────────────────────────────────────────

    @Test
    @DisplayName("A fully specified vacancy exposes everything scoring needs")
    void aFullySpecifiedVacancy() {
        JobPosting p = posting(ExperienceLevel.SENIOR);
        p.setRequirements("Minimum 7 years project management experience. PMP or PRINCE2 certification.");
        p.setRequiredSkills(List.of("Project management", "PFMA reporting", "Stakeholder engagement"));
        p.setPreferredSkills(List.of("PMP", "PRINCE2"));
        p.setMinEducationLevel(EducationLevel.BACHELORS);

        assertEquals(3, p.getRequiredSkills().size());
        assertEquals(6, p.getMinExperienceYears());
        assertEquals(EducationLevel.BACHELORS, p.getMinEducationLevel());
        assertNotNull(p.getRequirements(), "the prose stays — it is what the advert shows a candidate");
    }
}
