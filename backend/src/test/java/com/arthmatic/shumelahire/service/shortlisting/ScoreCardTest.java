package com.arthmatic.shumelahire.service.shortlisting;

import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring.Dimension;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers what happens when a candidate cannot be fully assessed — which on the IDC tenant is the
 * common case, not the edge case: 37 of 56 applicants carry no structured skills, experience or
 * education at all.
 *
 * <p>The old behaviour was to substitute a default for each missing dimension and fold it into the
 * total, so a candidate about whom nothing was known scored 58 and sat mid-table looking assessed.
 * A recruiter had no way to tell that number from one earned by a real match. These tests pin the
 * replacement: unscorable dimensions are excluded, their weight is redistributed, and the shortfall
 * is reported.</p>
 */
class ScoreCardTest {

    private Dimension scored(double v) { return Dimension.of(v, "test"); }
    private Dimension missing() { return Dimension.unscorable("no data"); }

    @Test
    @DisplayName("With every dimension scored, the weights apply as written")
    void fullyScored() {
        ScoreCard c = ScoreCard.of(scored(100), scored(100), scored(100), scored(100), scored(100));
        assertEquals(100.0, c.total());
        assertEquals(1.0, c.completeness());
        assertEquals(5, c.scoredDimensions());
        assertEquals("scored on all 5 dimensions", c.confidenceNote());
    }

    @Test
    @DisplayName("The weighted average is honoured")
    void weightedAverage() {
        // skills .30 * 100 = 30, everything else zero
        ScoreCard c = ScoreCard.of(scored(100), scored(0), scored(0), scored(0), scored(0));
        assertEquals(30.0, c.total());
    }

    @Test
    @DisplayName("An unscorable dimension is excluded, not defaulted")
    void unscorableExcluded() {
        // Only screening can be judged, and it is perfect. The candidate scores 100 on what was
        // knowable — with completeness saying only 15% of the model ran.
        ScoreCard c = ScoreCard.of(missing(), missing(), missing(), scored(100), missing());
        assertEquals(100.0, c.total());
        assertEquals(0.15, c.completeness());
        assertEquals(1, c.scoredDimensions());
    }

    @Test
    @DisplayName("Redistributed weight does not inflate a poor candidate")
    void redistributionIsProportional() {
        ScoreCard c = ScoreCard.of(missing(), missing(), missing(), scored(40), missing());
        assertEquals(40.0, c.total(), "40 on the one dimension that ran is still 40");
    }

    @Test
    @DisplayName("A candidate with no data at all scores zero with zero confidence")
    void nothingKnown() {
        ScoreCard c = ScoreCard.of(missing(), missing(), missing(), missing(), missing());
        assertEquals(0.0, c.total());
        assertEquals(0.0, c.completeness());
        assertEquals(0, c.scoredDimensions());
        assertTrue(c.confidenceNote().contains("not assessed"),
                "the old code gave this candidate a plausible mid-table number");
    }

    @Test
    @DisplayName("The confidence note names what was missing")
    void noteNamesTheGaps() {
        ScoreCard c = ScoreCard.of(scored(80), missing(), missing(), scored(60), scored(50));
        String note = c.confidenceNote();
        assertTrue(note.contains("3 of 5"), note);
        assertTrue(note.contains("experience"), note);
        assertTrue(note.contains("education"), note);
        assertFalse(note.contains("skills"), "skills was scored and should not be listed as missing");
    }

    @Test
    @DisplayName("Unscorable dimensions are listed")
    void unscorableListed() {
        ScoreCard c = ScoreCard.of(scored(80), missing(), missing(), scored(60), scored(50));
        assertEquals(java.util.List.of("experience", "education"), c.unscorable());
    }

    @Test
    @DisplayName("Two candidates with equal scores but different completeness are distinguishable")
    void completenessSeparatesEqualScores() {
        ScoreCard thorough = ScoreCard.of(scored(70), scored(70), scored(70), scored(70), scored(70));
        ScoreCard thin = ScoreCard.of(missing(), missing(), missing(), scored(70), missing());

        assertEquals(thorough.total(), thin.total(), "the headline number is the same…");
        assertTrue(thorough.completeness() > thin.completeness(), "…but the confidence is not");
    }

    @Test
    @DisplayName("The breakdown carries score, weight, scorability and a human note per dimension")
    void breakdownIsSelfExplanatory() {
        ScoreCard c = ScoreCard.of(
                Dimension.of(75, "3 of 4 required skills"),
                missing(), scored(100), scored(80), scored(50));
        Map<String, Object> b = c.toBreakdown();

        @SuppressWarnings("unchecked")
        Map<String, Object> skills = (Map<String, Object>) b.get("skills");
        assertEquals(75.0, skills.get("score"));
        assertEquals(0.30, skills.get("weight"));
        assertEquals(true, skills.get("scorable"));
        assertEquals("3 of 4 required skills", skills.get("note"));

        @SuppressWarnings("unchecked")
        Map<String, Object> experience = (Map<String, Object>) b.get("experience");
        assertEquals(false, experience.get("scorable"));

        assertTrue(b.containsKey("completeness"));
        assertTrue(b.containsKey("confidence"));
    }

    @Test
    @DisplayName("Scores are clamped to 0-100")
    void clamped() {
        assertEquals(100.0, Dimension.of(150, "over").score());
        assertEquals(0.0, Dimension.of(-20, "under").score());
    }
}
