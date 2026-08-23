package com.arthmatic.shumelahire.service.shortlisting;

import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring.Dimension;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Combines the five dimensions into one score, and says how much of it could actually be judged.
 *
 * <p>The weights are unchanged — skills 30, experience 25, education 20, screening 15, keywords 10.
 * What changes is what happens when a dimension cannot be assessed, which on this tenant is common:
 * 37 of 56 applicants carry no structured skills, experience or education at all.</p>
 *
 * <p>The old implementation returned a default for those and folded it into the total, so a
 * candidate about whom nothing was known scored 58 and sat mid-table looking assessed. Here an
 * unscorable dimension is <em>excluded</em> and its weight redistributed across the rest, with
 * {@link #completeness()} recording how much of the model actually ran. A recruiter can then tell a
 * genuine 58 from a 58 assembled out of nothing — which matters when the output is a shortlist
 * someone has to defend.</p>
 */
public record ScoreCard(Map<String, Dimension> dimensions,
                        Map<String, Double> weights,
                        double total,
                        double completeness) {

    public static final Map<String, Double> DEFAULT_WEIGHTS = Map.of(
            "skills", 0.30,
            "experience", 0.25,
            "education", 0.20,
            "screening", 0.15,
            "keywords", 0.10);

    public static ScoreCard of(Dimension skills, Dimension experience, Dimension education,
                               Dimension screening, Dimension keywords) {
        Map<String, Dimension> dims = new LinkedHashMap<>();
        dims.put("skills", skills);
        dims.put("experience", experience);
        dims.put("education", education);
        dims.put("screening", screening);
        dims.put("keywords", keywords);

        double liveWeight = dims.entrySet().stream()
                .filter(e -> e.getValue().scorable())
                .mapToDouble(e -> DEFAULT_WEIGHTS.get(e.getKey()))
                .sum();

        // Nothing could be judged. Report zero with zero confidence rather than inventing a middle.
        if (liveWeight == 0) {
            return new ScoreCard(dims, DEFAULT_WEIGHTS, 0.0, 0.0);
        }

        double weighted = dims.entrySet().stream()
                .filter(e -> e.getValue().scorable())
                .mapToDouble(e -> e.getValue().score() * DEFAULT_WEIGHTS.get(e.getKey()))
                .sum();

        double total = weighted / liveWeight;   // redistribute across the dimensions that ran
        return new ScoreCard(dims, DEFAULT_WEIGHTS,
                Math.round(total * 100.0) / 100.0,
                Math.round(liveWeight * 100.0) / 100.0);
    }

    /** Dimension names that could not be judged, in weight order. */
    public List<String> unscorable() {
        return dimensions.entrySet().stream()
                .filter(e -> !e.getValue().scorable())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public int scoredDimensions() {
        return (int) dimensions.values().stream().filter(Dimension::scorable).count();
    }

    /**
     * A sentence a recruiter can read, e.g. "scored on 3 of 5 dimensions (60% of the model)".
     *
     * <p>This is the point of the whole class: the number alone does not tell you whether to trust
     * it.</p>
     */
    public String confidenceNote() {
        int scored = scoredDimensions();
        if (scored == dimensions.size()) return "scored on all 5 dimensions";
        if (scored == 0) return "not assessed — no candidate data available";
        return "scored on " + scored + " of " + dimensions.size() + " dimensions ("
                + Math.round(completeness * 100) + "% of the model) — missing: "
                + String.join(", ", unscorable());
    }

    /** Serialisable form for {@code ShortlistScore.scoreBreakdown}. */
    public Map<String, Object> toBreakdown() {
        Map<String, Object> out = new LinkedHashMap<>();
        dimensions.forEach((name, d) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("score", d.score());
            entry.put("weight", DEFAULT_WEIGHTS.get(name));
            entry.put("scorable", d.scorable());
            entry.put("note", d.note());
            out.put(name, entry);
        });
        out.put("total", total);
        out.put("completeness", completeness);
        out.put("confidence", confidenceNote());
        return out;
    }
}
