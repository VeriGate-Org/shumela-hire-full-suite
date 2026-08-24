package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.PipelineTransition;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * What the hiring pipeline is actually doing, computed from the transition records.
 *
 * <p><b>This exists because the analytics it replaces never ran.</b> Nine analytics endpoints are
 * routed and documented on {@code PipelineController}, and every one of them reaches a repository
 * method whose only implementation throws
 * {@code UnsupportedOperationException("Analytics queries will be migrated to Athena")}. The
 * interface javadoc names a {@code JpaPipelineTransitionDataRepository} as the other
 * implementation; there is no such class, and no {@code Jpa*Repository*} file anywhere in the
 * backend. So the board's client-side arithmetic was not a worse version of what the server
 * returned — it was the only version, which is why nobody noticed the endpoints were dead.
 *
 * <p><b>Stage duration is a median, not a mean.</b> One candidate stuck sixteen days on a credit
 * check is exactly the outlier a median exists to resist, and it is the case the pipeline board is
 * built to surface. The convention is the lower of the two central values on an even count — the
 * same as {@code RequisitionSummaryResponse.medianDaysToApproval},
 * {@code TalentPoolResponse.medianEntryAgeDays} and {@code AgencyResponse.medianReviewDays}, so no
 * two medians in this codebase mean different things.
 *
 * <p><b>Hours are converted to days once, here, in floating point.</b>
 * {@code PipelineTransition.getDurationInDays()} does {@code durationInPreviousStageHours / 24} on a
 * {@code Long}, so twenty-three hours in a stage reports as zero days. Nothing on these pages uses
 * that method.
 */
public class PipelineAnalyticsResponse {

    /**
     * How many distinct applications ever reached each stage.
     *
     * <p><b>Reached, not sitting in.</b> Counted from the {@code toStage} of transitions, so a
     * candidate who passed through screening on the way to an offer is counted at screening. The
     * board previously computed the share of candidates <i>currently in</i> a stage and labelled it
     * a conversion rate; those are different measures and only one of them is a funnel.
     */
    private Map<String, Long> reachedByStage = new LinkedHashMap<>();

    /** Median hours spent in each stage before leaving it. Absent when nothing has left the stage. */
    private Map<String, Double> medianStageHours = new LinkedHashMap<>();

    /** How many measured departures each median rests on, so a median of one is visible as such. */
    private Map<String, Long> stageSampleSize = new LinkedHashMap<>();

    /** Counts of every from-stage → to-stage move actually made. */
    private Map<String, Map<String, Long>> conversions = new LinkedHashMap<>();

    /** Moves to an earlier stage. A second interview requested after checks, and the like. */
    private List<Regression> regressions = new ArrayList<>();

    /** Transitions counted. The denominator for everything above. */
    private long transitions;

    /** Transitions carrying no duration, and so excluded from the medians. */
    private long transitionsWithoutDuration;

    /**
     * The stage with the highest median, and its median in days — the bottleneck.
     *
     * <p>Null when no stage has a measured departure. Terminal stages are excluded: time spent
     * "in" Rejected is not a bottleneck, it is the end of the process.
     */
    private String slowestStage;
    private Double slowestStageDays;

    public static PipelineAnalyticsResponse from(List<PipelineTransition> allTransitions) {
        PipelineAnalyticsResponse response = new PipelineAnalyticsResponse();
        if (allTransitions == null || allTransitions.isEmpty()) {
            return response;
        }

        // Distinct applications per stage reached, so one candidate bouncing between two stages is
        // not counted twice in the funnel.
        Map<PipelineStage, Set<String>> reached = new LinkedHashMap<>();
        Map<PipelineStage, List<Long>> durations = new LinkedHashMap<>();

        for (PipelineTransition transition : allTransitions) {
            response.transitions++;

            PipelineStage to = transition.getToStage();
            PipelineStage from = transition.getFromStage();

            String applicationId = transition.getApplication() == null
                    ? null
                    : transition.getApplication().getId();

            if (to != null && applicationId != null) {
                reached.computeIfAbsent(to, stage -> new HashSet<>()).add(applicationId);
            }

            if (from != null && to != null) {
                response.conversions
                        .computeIfAbsent(from.name(), key -> new LinkedHashMap<>())
                        .merge(to.name(), 1L, Long::sum);

                if (isRegression(from, to)) {
                    response.regressions.add(new Regression(transition, from, to));
                }
            }

            // The duration is time spent in the stage being LEFT, so it is attributed to fromStage.
            Long hours = transition.getDurationInPreviousStageHours();
            if (hours == null) {
                response.transitionsWithoutDuration++;
            } else if (from != null) {
                durations.computeIfAbsent(from, stage -> new ArrayList<>()).add(Math.max(0, hours));
            }
        }

        reached.forEach((stage, applicationIds) ->
                response.reachedByStage.put(stage.name(), (long) applicationIds.size()));

        durations.forEach((stage, hours) -> {
            List<Long> sorted = hours.stream().sorted().toList();
            // Lower of the two central values on an even count — see the class comment.
            double median = sorted.get((sorted.size() - 1) / 2);
            response.medianStageHours.put(stage.name(), median);
            response.stageSampleSize.put(stage.name(), (long) sorted.size());

            // Terminal stages are excluded from "slowest": time spent in Rejected is not a
            // bottleneck, it is the end of the process.
            if (!stage.isTerminal()
                    && (response.slowestStageDays == null || median / 24.0 > response.slowestStageDays)) {
                response.slowestStageDays = median / 24.0;
                response.slowestStage = stage.name();
            }
        });

        return response;
    }

    /**
     * Is this move backwards?
     *
     * <p>{@link PipelineStage} carries a real {@code order}: 1–16 for the working stages and 90–94
     * for the terminal ones. Moving to a terminal stage is therefore never a regression by order,
     * which is correct — rejecting somebody is not sending them backwards. Moving <i>out</i> of a
     * terminal stage is.
     */
    static boolean isRegression(PipelineStage from, PipelineStage to) {
        if (from == to) return false;
        // A move out of a terminal stage back into the working pipeline: reopening a rejection.
        if (from.isTerminal() && !to.isTerminal()) return true;
        if (to.isTerminal()) return false;
        return to.getOrder() < from.getOrder();
    }

    /** One backwards move, with enough on it to say who and when without a second lookup. */
    public static class Regression {
        private String applicationId;
        private String fromStage;
        private String toStage;
        private String reason;
        private java.time.LocalDateTime occurredAt;

        public Regression() {
        }

        Regression(PipelineTransition transition, PipelineStage from, PipelineStage to) {
            this.applicationId = transition.getApplication() == null
                    ? null
                    : transition.getApplication().getId();
            this.fromStage = from.name();
            this.toStage = to.name();
            this.reason = transition.getReason();
            this.occurredAt = transition.getCreatedAt();
        }

        public String getApplicationId() { return applicationId; }
        public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

        public String getFromStage() { return fromStage; }
        public void setFromStage(String fromStage) { this.fromStage = fromStage; }

        public String getToStage() { return toStage; }
        public void setToStage(String toStage) { this.toStage = toStage; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public java.time.LocalDateTime getOccurredAt() { return occurredAt; }
        public void setOccurredAt(java.time.LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
    }

    /**
     * The largest fall-off between two consecutive stages, or null when nothing can be compared.
     *
     * <p>Computed from {@link #reachedByStage} in working-stage order. This is the figure the
     * dashboard calls "largest loss" and it is the one place worth reading rejection reasons.
     */
    public Drop biggestDropOff() {
        List<PipelineStage> ordered = java.util.Arrays.stream(PipelineStage.values())
                .filter(stage -> !stage.isTerminal())
                .filter(stage -> reachedByStage.containsKey(stage.name()))
                .sorted(java.util.Comparator.comparingInt(PipelineStage::getOrder))
                .toList();

        Drop worst = null;
        for (int i = 0; i + 1 < ordered.size(); i++) {
            long before = reachedByStage.get(ordered.get(i).name());
            long after = reachedByStage.get(ordered.get(i + 1).name());
            if (before <= 0) continue;
            double lost = (before - after) / (double) before * 100;
            if (worst == null || lost > worst.lostPercent) {
                worst = new Drop(ordered.get(i).name(), ordered.get(i + 1).name(), lost, before - after);
            }
        }
        return worst;
    }

    /** A fall-off between two consecutive stages. */
    public static class Drop {
        private final String fromStage;
        private final String toStage;
        private final double lostPercent;
        private final long lostCount;

        Drop(String fromStage, String toStage, double lostPercent, long lostCount) {
            this.fromStage = fromStage;
            this.toStage = toStage;
            this.lostPercent = lostPercent;
            this.lostCount = lostCount;
        }

        public String getFromStage() { return fromStage; }
        public String getToStage() { return toStage; }
        public double getLostPercent() { return lostPercent; }
        public long getLostCount() { return lostCount; }
    }

    public Map<String, Long> getReachedByStage() { return reachedByStage; }
    public void setReachedByStage(Map<String, Long> reachedByStage) { this.reachedByStage = reachedByStage; }

    public Map<String, Double> getMedianStageHours() { return medianStageHours; }
    public void setMedianStageHours(Map<String, Double> medianStageHours) { this.medianStageHours = medianStageHours; }

    public Map<String, Long> getStageSampleSize() { return stageSampleSize; }
    public void setStageSampleSize(Map<String, Long> stageSampleSize) { this.stageSampleSize = stageSampleSize; }

    public Map<String, Map<String, Long>> getConversions() { return conversions; }
    public void setConversions(Map<String, Map<String, Long>> conversions) { this.conversions = conversions; }

    public List<Regression> getRegressions() { return regressions; }
    public void setRegressions(List<Regression> regressions) { this.regressions = regressions; }

    public long getTransitions() { return transitions; }
    public void setTransitions(long transitions) { this.transitions = transitions; }

    public long getTransitionsWithoutDuration() { return transitionsWithoutDuration; }
    public void setTransitionsWithoutDuration(long transitionsWithoutDuration) {
        this.transitionsWithoutDuration = transitionsWithoutDuration;
    }

    public String getSlowestStage() { return slowestStage; }
    public void setSlowestStage(String slowestStage) { this.slowestStage = slowestStage; }

    public Double getSlowestStageDays() { return slowestStageDays; }
    public void setSlowestStageDays(Double slowestStageDays) { this.slowestStageDays = slowestStageDays; }
}
