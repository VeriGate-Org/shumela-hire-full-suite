package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring;
import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring.Dimension;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards the defect that made shortlisting shortlist nobody.
 *
 * <p>{@code DynamoApplicationRepository.toEntity} rebuilds {@code application.getApplicant()} as a
 * stub carrying the id and nothing else. Read directly, its skills, experience and education are
 * all null — and null reads as "this candidate listed nothing", not as "not loaded". Three of the
 * five dimensions, 75% of the weight, silently scored zero for every candidate on the tenant.</p>
 *
 * <p>Nothing caught it. The service compiled, the scoring unit tests passed (they are handed real
 * values, not stubs), the endpoint returned 200, and the summary looked plausible — an average and
 * a range, just very low ones. It was only visible by scoring a vacancy whose candidates obviously
 * matched and noticing the top score was 3.7 out of 100.</p>
 *
 * <p>This is the third appearance of the same shape: {@code DynamoOfferRepository.toEntity}
 * produced "Unknown Candidate" the same way and, worse, wrote the stub back and destroyed the
 * association. An association loaded from Dynamo is an id until something hydrates it.</p>
 */
class ShortlistingHydrationTest {

    private static final Path SERVICE =
            Path.of("src/main/java/com/arthmatic/shumelahire/service/ShortlistingService.java");
    private static final Path APPLICATION_REPO =
            Path.of("src/main/java/com/arthmatic/shumelahire/repository/dynamo/DynamoApplicationRepository.java");

    @Test
    @DisplayName("The applicant is hydrated before scoring, never read off the association")
    void hydratesBeforeScoring() throws IOException {
        String s = Files.readString(SERVICE);

        assertTrue(s.contains("hydrate(application.getApplicant())"),
                "scoring must load the full applicant — the association from Dynamo is an id only");

        // The raw association must not be handed to score() directly. If someone reinstates
        // `Applicant applicant = application.getApplicant();` on the scoring path, three dimensions
        // go quietly back to zero and no test but this one notices.
        assertFalse(s.contains("Applicant applicant = application.getApplicant();\n        ScoreCard"),
                "the unhydrated association must not flow into ScoreCard assembly");
    }

    @Test
    @DisplayName("The repository really does return a stub — the premise of this guard")
    void repositoryReturnsAStub() throws IOException {
        // If this ever stops being true the guard above is merely redundant, not wrong. Asserting
        // it here means the test explains *why* hydration is needed rather than just demanding it.
        String repo = Files.readString(APPLICATION_REPO);
        assertTrue(repo.contains("applicant.setId(item.getApplicantId())"),
                "premise changed: the application repository no longer stubs the applicant");
    }

    @Test
    @DisplayName("A stubbed applicant scores zero on skills — the symptom, stated plainly")
    void stubbedApplicantScoresZero() {
        List<String> required = List.of("Investment analysis", "Financial modelling", "Corporate finance");

        // What a stub yields: getSkills() is null, so parseSkills returns empty.
        Dimension stubbed = CandidateScoring.skills(CandidateScoring.parseSkills(null), required, List.of());
        assertEquals(0.0, stubbed.score(),
                "a stub must not be mistaken for a candidate who listed nothing of value");

        // What the same candidate yields once hydrated — this is the score the recruiter should
        // have been seeing all along.
        String realSkills = "[\"Investment analysis\",\"Equity research\",\"Financial modelling\"]";
        Dimension hydrated = CandidateScoring.skills(
                CandidateScoring.parseSkills(realSkills), required, List.of());
        assertTrue(hydrated.score() > 60.0,
                "two of three required skills matched should score well above zero, was " + hydrated.score());
    }
}
