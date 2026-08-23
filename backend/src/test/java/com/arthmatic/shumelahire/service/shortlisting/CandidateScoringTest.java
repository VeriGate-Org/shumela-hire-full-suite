package com.arthmatic.shumelahire.service.shortlisting;

import com.arthmatic.shumelahire.entity.EducationLevel;
import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring.Dimension;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Year;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers the scoring rules, using the exact JSON shapes stored on the IDC tenant.
 *
 * <p>What this replaces is worth stating: every dimension previously returned a constant. Skills
 * was 70 or 40 depending on whether the unrelated <em>experience</em> field was non-empty, keywords
 * was a flat 60, and the job posting was never loaded at all. Two candidates for two different
 * vacancies scored identically, and no test could have caught it because nothing depended on the
 * inputs.</p>
 */
class CandidateScoringTest {

    // Shapes taken verbatim from the idc tenant.
    private static final String SKILLS_JSON =
            "[\"Investment analysis\",\"Equity research\",\"Financial modelling\",\"Bloomberg\"]";
    private static final String EXPERIENCE_JSON =
            "[{\"company\":\"RMB\",\"role\":\"Graduate Analyst\",\"years\":\"2017-2019\"},"
          + "{\"company\":\"Ashburton\",\"role\":\"Investment Analyst\",\"years\":\"2019-2023\"}]";
    private static final String EDUCATION_JSON =
            "[{\"institution\":\"UKZN\",\"degree\":\"BCom Honours Economics\",\"year\":\"2017\"},"
          + "{\"institution\":\"CFA Institute\",\"degree\":\"CFA Level II\",\"year\":\"2020\"}]";

    @Nested
    @DisplayName("Skills")
    class Skills {
        @Test
        @DisplayName("Scores the proportion of required skills held")
        void proportionOfRequired() {
            Dimension d = CandidateScoring.skills(
                    List.of("Java", "AWS", "Terraform"), List.of("Java", "AWS"), null);
            assertEquals(100.0, d.score());
            assertTrue(d.scorable());
        }

        @Test
        @DisplayName("Half the required skills scores half")
        void halfIsHalf() {
            assertEquals(50.0, CandidateScoring.skills(
                    List.of("Java"), List.of("Java", "AWS"), null).score());
        }

        @Test
        @DisplayName("Matching is case-insensitive and works on partial phrases")
        void looseMatching() {
            Dimension d = CandidateScoring.skills(
                    List.of("project management experience"), List.of("Project Management"), null);
            assertEquals(100.0, d.score(), "a recruiter's phrasing will never match a candidate's exactly");
        }

        @Test
        @DisplayName("Preferred skills add a capped bonus")
        void preferredAddsBonus() {
            Dimension all = CandidateScoring.skills(
                    List.of("Java", "AWS", "Kafka"), List.of("Java", "AWS"), List.of("Kafka"));
            assertEquals(100.0, all.score(), "already at 100, the bonus cannot push it past the ceiling");

            Dimension partial = CandidateScoring.skills(
                    List.of("Java", "Kafka"), List.of("Java", "AWS"), List.of("Kafka"));
            assertEquals(60.0, partial.score(), "50 base + 10 bonus");
        }

        @Test
        @DisplayName("A candidate missing essentials cannot outrank one who has them")
        void preferredCannotOverturnRequired() {
            Dimension hasEssentials = CandidateScoring.skills(
                    List.of("Java", "AWS"), List.of("Java", "AWS"), List.of("Kafka", "Go"));
            Dimension onlyPreferred = CandidateScoring.skills(
                    List.of("Kafka", "Go"), List.of("Java", "AWS"), List.of("Kafka", "Go"));
            assertTrue(hasEssentials.score() > onlyPreferred.score());
        }

        @Test
        @DisplayName("A vacancy listing no required skills cannot be scored on skills")
        void noRequirementsIsUnscorable() {
            assertFalse(CandidateScoring.skills(List.of("Java"), List.of(), null).scorable());
            assertFalse(CandidateScoring.skills(List.of("Java"), null, null).scorable());
        }

        @Test
        @DisplayName("A candidate with no recorded skills scores zero, not 'unscorable'")
        void noCandidateSkillsScoresZero() {
            Dimension d = CandidateScoring.skills(List.of(), List.of("Java"), null);
            assertTrue(d.scorable(), "the vacancy asked — we can judge that the answer is nothing");
            assertEquals(0.0, d.score());
        }
    }

    @Nested
    @DisplayName("Experience")
    class Experience {
        @Test
        @DisplayName("Meeting or exceeding the minimum scores full marks")
        void meetingTheBar() {
            assertEquals(100.0, CandidateScoring.experience(6, 6).score());
            assertEquals(100.0, CandidateScoring.experience(20, 6).score(),
                    "more than asked for is not better than enough");
        }

        @Test
        @DisplayName("Falling short scores proportionally, not zero")
        void shortfallDegradesGracefully() {
            assertEquals(50.0, CandidateScoring.experience(3, 6).score());
            assertTrue(CandidateScoring.experience(5, 6).score() > 80,
                    "one year short of six is a strong candidate, not a rejection");
        }

        @Test
        @DisplayName("A vacancy with no minimum is satisfied by anyone")
        void noMinimum() {
            assertEquals(100.0, CandidateScoring.experience(0, 0).score());
        }

        @Test
        @DisplayName("No recorded history is unscorable, distinct from zero years")
        void noHistoryIsUnscorable() {
            assertFalse(CandidateScoring.experience(null, 6).scorable());
            assertTrue(CandidateScoring.experience(0, 6).scorable());
        }
    }

    @Nested
    @DisplayName("Education")
    class Education {
        @Test
        @DisplayName("Meeting the requirement scores full marks")
        void meetsRequirement() {
            assertEquals(100.0, CandidateScoring.education(
                    EducationLevel.HONOURS, EducationLevel.BACHELORS).score());
        }

        @Test
        @DisplayName("Falling short scores by rank ratio")
        void belowRequirement() {
            Dimension d = CandidateScoring.education(EducationLevel.DIPLOMA, EducationLevel.BACHELORS);
            assertTrue(d.score() > 0 && d.score() < 100);
        }

        @Test
        @DisplayName("A vacancy naming no qualification cannot be scored on it")
        void noRequirementIsUnscorable() {
            assertFalse(CandidateScoring.education(EducationLevel.MASTERS, null).scorable(),
                    "scoring a dimension the vacancy never asked about would be invented signal");
        }
    }

    @Nested
    @DisplayName("Screening and keywords")
    class ScreeningAndKeywords {
        @Test
        @DisplayName("The recruiter rating maps 1-5 onto 20-100")
        void ratingMaps() {
            assertEquals(100.0, CandidateScoring.screening(5).score());
            assertEquals(80.0, CandidateScoring.screening(4).score());
        }

        @Test
        @DisplayName("An unrated application is unscorable, not average")
        void unratedIsUnscorable() {
            assertFalse(CandidateScoring.screening(null).scorable());
        }

        @Test
        @DisplayName("Keywords measure overlap with the requirements prose")
        void keywordOverlap() {
            String prose = "Minimum 7 years project management experience. PMP or PRINCE2 certification.";
            Dimension strong = CandidateScoring.keywords(
                    "Seasoned project management professional, PMP certified, PRINCE2 practitioner", prose);
            Dimension weak = CandidateScoring.keywords("Chef, hospitality background", prose);
            assertTrue(strong.score() > weak.score());
        }

        @Test
        @DisplayName("Filler words are not matched on")
        void stopWordsIgnored() {
            assertFalse(CandidateScoring.significantTerms("must have the experience with years")
                    .contains("experience"));
            assertFalse(CandidateScoring.significantTerms("must have and the").contains("must"));
        }
    }

    @Nested
    @DisplayName("Parsing the applicant's stored JSON")
    class Parsing {
        @Test
        @DisplayName("Skills parse from the stored array")
        void skillsParse() {
            List<String> skills = CandidateScoring.parseSkills(SKILLS_JSON);
            assertEquals(4, skills.size());
            assertTrue(skills.contains("Bloomberg"));
        }

        @Test
        @DisplayName("Experience years sum across roles")
        void experienceSums() {
            assertEquals(6, CandidateScoring.parseExperienceYears(EXPERIENCE_JSON),
                    "2017-2019 is two years, 2019-2023 is four");
        }

        @Test
        @DisplayName("An open-ended role counts up to the current year")
        void presentCountsToNow() {
            int thisYear = Year.now().getValue();
            Integer years = CandidateScoring.parseExperienceYears(
                    "[{\"company\":\"X\",\"role\":\"Y\",\"years\":\"" + (thisYear - 3) + "-present\"}]");
            assertEquals(3, years);
        }

        @Test
        @DisplayName("Unparseable or absent history returns null, not zero")
        void unparseableIsNull() {
            assertNull(CandidateScoring.parseExperienceYears(null));
            assertNull(CandidateScoring.parseExperienceYears("[]"));
            assertNull(CandidateScoring.parseExperienceYears("not json"),
                    "null lets the caller say 'unknown'; zero would assert 'no experience'");
        }

        @Test
        @DisplayName("The highest qualification wins, and Honours is not read as a Bachelor's")
        void highestQualification() {
            assertEquals(EducationLevel.HONOURS, CandidateScoring.parseHighestEducation(EDUCATION_JSON));
        }

        @Test
        @DisplayName("Degree text is classified across common South African forms")
        void degreeClassification() {
            assertEquals(EducationLevel.DOCTORATE, CandidateScoring.classifyDegree("PhD in Economics"));
            assertEquals(EducationLevel.MASTERS, CandidateScoring.classifyDegree("MBA"));
            assertEquals(EducationLevel.HONOURS, CandidateScoring.classifyDegree("BCom Honours Economics"));
            assertEquals(EducationLevel.BACHELORS, CandidateScoring.classifyDegree("BSc Engineering"));
            assertEquals(EducationLevel.DIPLOMA, CandidateScoring.classifyDegree("National Diploma"));
            assertEquals(EducationLevel.MATRIC, CandidateScoring.classifyDegree("Matric"));
            assertNull(CandidateScoring.classifyDegree("CFA Level II"),
                    "a professional certification is not a formal qualification level");
        }

        @Test
        @DisplayName("Malformed JSON degrades quietly rather than throwing")
        void malformedJson() {
            assertNotNull(CandidateScoring.parseSkills("{oops"));
            assertTrue(CandidateScoring.parseSkills("{oops").isEmpty());
            assertNull(CandidateScoring.parseHighestEducation("{oops"));
        }
    }

    @Nested
    @DisplayName("A real candidate against a real vacancy")
    class EndToEnd {
        @Test
        @DisplayName("A strong match outscores a weak one on the same vacancy")
        void strongBeatsWeak() {
            List<String> required = List.of("Project management", "PFMA reporting");
            String prose = "Minimum 7 years project management experience. PMP certification. PFMA reporting.";

            ScoreCard strong = ScoreCard.of(
                    CandidateScoring.skills(List.of("Project management", "PFMA reporting"), required, List.of("PMP")),
                    CandidateScoring.experience(9, 6),
                    CandidateScoring.education(EducationLevel.HONOURS, EducationLevel.BACHELORS),
                    CandidateScoring.screening(5),
                    CandidateScoring.keywords("project management PFMA reporting certification", prose));

            ScoreCard weak = ScoreCard.of(
                    CandidateScoring.skills(List.of("Catering"), required, List.of("PMP")),
                    CandidateScoring.experience(1, 6),
                    CandidateScoring.education(EducationLevel.MATRIC, EducationLevel.BACHELORS),
                    CandidateScoring.screening(2),
                    CandidateScoring.keywords("hospitality", prose));

            assertTrue(strong.total() > weak.total(),
                    "strong " + strong.total() + " should beat weak " + weak.total());
            assertTrue(strong.total() > 90, "a near-perfect match should look like one");
            assertEquals(5, strong.scoredDimensions());
        }

        @Test
        @DisplayName("The same candidate scores differently against different vacancies")
        void roleAwareness() {
            List<String> candidateSkills = List.of("Java", "Spring", "AWS");

            double asDeveloper = CandidateScoring.skills(
                    candidateSkills, List.of("Java", "Spring"), null).score();
            double asAccountant = CandidateScoring.skills(
                    candidateSkills, List.of("IFRS", "Tax"), null).score();

            assertEquals(100.0, asDeveloper);
            assertEquals(0.0, asAccountant);
            assertTrue(asDeveloper > asAccountant,
                    "this is the whole point — the old implementation scored both identically");
        }
    }
}
