package com.arthmatic.shumelahire.service.shortlisting;

import com.arthmatic.shumelahire.entity.EducationLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scores one candidate against one vacancy.
 *
 * <p>Deliberately free of repositories, Spring and entities so that every rule here can be tested
 * directly. The previous implementation lived inside {@code ShortlistingService}, took only an
 * {@code Application}, and returned a constant per dimension — 70 or 40 for skills depending on
 * whether an unrelated field was non-empty, and a flat 60 for keywords. Nothing could be tested
 * because nothing depended on the inputs.</p>
 *
 * <p>Every method returns 0–100. A dimension that cannot be judged returns
 * {@link Dimension#unscorable()} rather than a middling number, because a confident 50 derived from
 * absent data is worse than an honest "not assessed" — see {@link ScoreCard}.</p>
 */
public final class CandidateScoring {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private CandidateScoring() {}

    /** One dimension's outcome: a score, or an explicit statement that it could not be judged. */
    public record Dimension(double score, boolean scorable, String note) {
        public static Dimension of(double score, String note) {
            return new Dimension(Math.max(0, Math.min(100, score)), true, note);
        }
        public static Dimension unscorable(String why) {
            return new Dimension(0, false, why);
        }
    }

    // ── Skills ────────────────────────────────────────────────────────────────

    /**
     * Proportion of required skills the candidate holds, with preferred skills as a bonus.
     *
     * <p>Matching is case-insensitive and substring-based in both directions, so "Project
     * management" matches "project management experience" and vice versa. Exact-token matching
     * looked precise in testing and missed most real pairs.</p>
     */
    public static Dimension skills(List<String> candidateSkills,
                                   List<String> requiredSkills,
                                   List<String> preferredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return Dimension.unscorable("the vacancy lists no required skills");
        }
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return Dimension.of(0, "no skills recorded for this candidate");
        }

        long matched = requiredSkills.stream().filter(r -> matchesAny(r, candidateSkills)).count();
        double base = (double) matched / requiredSkills.size() * 100.0;

        long bonusHits = preferredSkills == null ? 0
                : preferredSkills.stream().filter(p -> matchesAny(p, candidateSkills)).count();
        // Preferred skills lift a candidate but must not let someone missing the essentials
        // outrank someone who has them: capped at 10 points.
        double bonus = preferredSkills == null || preferredSkills.isEmpty() ? 0
                : Math.min(10.0, (double) bonusHits / preferredSkills.size() * 10.0);

        return Dimension.of(base + bonus,
                matched + " of " + requiredSkills.size() + " required skills"
                        + (bonusHits > 0 ? ", " + bonusHits + " preferred" : ""));
    }

    private static boolean matchesAny(String needle, List<String> haystack) {
        String n = norm(needle);
        if (n.isEmpty()) return false;
        return haystack.stream().map(CandidateScoring::norm)
                .anyMatch(h -> !h.isEmpty() && (h.contains(n) || n.contains(h)));
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
    }

    // ── Experience ────────────────────────────────────────────────────────────

    /**
     * Years of experience against the vacancy's minimum.
     *
     * <p>Meeting the requirement scores 100. Below it, the score falls proportionally rather than
     * to zero: someone with four years against a six-year ask is a weaker match, not a
     * non-candidate, and a hard cut-off here would quietly discard people a recruiter would want
     * to see.</p>
     */
    public static Dimension experience(Integer candidateYears, int requiredYears) {
        if (candidateYears == null) {
            return Dimension.unscorable("no experience history recorded");
        }
        if (requiredYears <= 0) {
            return Dimension.of(100, "the vacancy sets no minimum experience");
        }
        double ratio = (double) candidateYears / requiredYears;
        return Dimension.of(Math.min(1.0, ratio) * 100.0,
                candidateYears + " years against a minimum of " + requiredYears);
    }

    // ── Education ─────────────────────────────────────────────────────────────

    /** Highest qualification against the vacancy's minimum. */
    public static Dimension education(EducationLevel candidate, EducationLevel required) {
        if (required == null) {
            return Dimension.unscorable("the vacancy sets no qualification requirement");
        }
        if (candidate == null) {
            return Dimension.of(0, "no qualification recorded for this candidate");
        }
        if (candidate.satisfies(required)) {
            // Exceeding the requirement is not better than meeting it — a Master's does not make
            // someone a stronger project manager than an Honours graduate the role asked for.
            return Dimension.of(100, candidate.getDisplayName() + " meets " + required.getDisplayName());
        }
        double ratio = (double) candidate.getRank() / required.getRank();
        return Dimension.of(ratio * 100.0,
                candidate.getDisplayName() + " is below " + required.getDisplayName());
    }

    // ── Screening ─────────────────────────────────────────────────────────────

    /** The recruiter's own rating, 1–5, as a percentage. The one human signal in the model. */
    public static Dimension screening(Integer rating) {
        if (rating == null) {
            return Dimension.unscorable("not yet rated by a recruiter");
        }
        return Dimension.of(rating * 20.0, "rated " + rating + " of 5");
    }

    // ── Keywords ──────────────────────────────────────────────────────────────

    /**
     * How much of the vacancy's prose vocabulary appears in the candidate's own text.
     *
     * <p>A blunt instrument, and weighted lowest for that reason. It exists to catch relevant
     * experience a recruiter never captured as a discrete skill.</p>
     */
    public static Dimension keywords(String candidateText, String requirementsProse) {
        Set<String> wanted = significantTerms(requirementsProse);
        if (wanted.isEmpty()) {
            return Dimension.unscorable("the vacancy has no requirements text");
        }
        if (candidateText == null || candidateText.isBlank()) {
            return Dimension.of(0, "no candidate text to match against");
        }
        String haystack = norm(candidateText);
        long hits = wanted.stream().filter(haystack::contains).count();
        return Dimension.of((double) hits / wanted.size() * 100.0,
                hits + " of " + wanted.size() + " requirement terms present");
    }

    /** Words worth matching on: 4+ characters, not structural filler. */
    static Set<String> significantTerms(String prose) {
        if (prose == null || prose.isBlank()) return Set.of();
        Set<String> stop = Set.of("with", "and", "the", "for", "must", "have", "will", "this", "that",
                "from", "your", "their", "been", "were", "which", "years", "year", "experience",
                "minimum", "required", "requirements", "including", "ability", "strong", "good");
        Set<String> terms = new LinkedHashSet<>();
        for (String w : norm(prose).split("[^a-z0-9+#.]+")) {
            if (w.length() >= 4 && !stop.contains(w)) terms.add(w);
        }
        return terms;
    }

    // ── Parsing the applicant's stored JSON ───────────────────────────────────

    /** Applicant {@code skills} is a JSON array of strings. */
    public static List<String> parseSkills(String json) {
        List<String> out = new ArrayList<>();
        JsonNode node = read(json);
        if (node != null && node.isArray()) {
            node.forEach(n -> { if (n.isTextual() && !n.asText().isBlank()) out.add(n.asText()); });
        }
        return out;
    }

    /**
     * Total years across an applicant's {@code experience} entries.
     *
     * <p>Each entry carries a {@code years} string such as {@code "2017-2019"} or
     * {@code "2019-present"}. Returns {@code null} — not zero — when nothing can be parsed, so the
     * caller can tell "no history recorded" from "no experience".</p>
     */
    public static Integer parseExperienceYears(String json) {
        JsonNode node = read(json);
        if (node == null || !node.isArray() || node.isEmpty()) return null;

        int total = 0;
        boolean parsedAny = false;
        int thisYear = Year.now().getValue();
        Pattern range = Pattern.compile("(\\d{4})\\s*[-–—]\\s*(\\d{4}|present|current|now)",
                Pattern.CASE_INSENSITIVE);

        for (JsonNode entry : node) {
            String years = entry.path("years").asText("");
            Matcher m = range.matcher(years);
            if (m.find()) {
                int from = Integer.parseInt(m.group(1));
                String toText = m.group(2).toLowerCase(Locale.ROOT);
                int to = toText.matches("\\d{4}") ? Integer.parseInt(toText) : thisYear;
                if (to >= from) { total += (to - from); parsedAny = true; }
            }
        }
        return parsedAny ? total : null;
    }

    /**
     * Highest qualification across an applicant's {@code education} entries.
     *
     * <p>Matched on the degree text, longest patterns first so "BCom Honours" is read as Honours
     * rather than stopping at the Bachelor's.</p>
     */
    public static EducationLevel parseHighestEducation(String json) {
        JsonNode node = read(json);
        if (node == null || !node.isArray() || node.isEmpty()) return null;

        EducationLevel highest = null;
        for (JsonNode entry : node) {
            EducationLevel level = classifyDegree(entry.path("degree").asText(""));
            if (level != null && (highest == null || level.getRank() > highest.getRank())) {
                highest = level;
            }
        }
        return highest;
    }

    static EducationLevel classifyDegree(String degree) {
        String d = norm(degree);
        if (d.isEmpty()) return null;
        // Order matters: "honours" must be tested before "bcom", "doctorate" before "master".
        if (containsAny(d, "phd", "doctorate", "dphil", "doctoral")) return EducationLevel.DOCTORATE;
        if (containsAny(d, "master", "msc", "mba", "mcom", "meng", "ma ", "mtech")) return EducationLevel.MASTERS;
        if (containsAny(d, "honours", "honors", "postgraduate diploma", "pgdip")) return EducationLevel.HONOURS;
        if (containsAny(d, "bachelor", "bsc", "bcom", "beng", "ba ", "btech", "llb", "degree")) return EducationLevel.BACHELORS;
        if (containsAny(d, "diploma", "advanced certificate")) return EducationLevel.DIPLOMA;
        if (containsAny(d, "certificate", "cert")) return EducationLevel.CERTIFICATE;
        if (containsAny(d, "matric", "national senior", "grade 12")) return EducationLevel.MATRIC;
        return null;
    }

    private static boolean containsAny(String haystack, String... needles) {
        return Arrays.stream(needles).anyMatch(haystack::contains);
    }

    private static JsonNode read(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readTree(json);
        } catch (Exception e) {
            return null;
        }
    }
}
