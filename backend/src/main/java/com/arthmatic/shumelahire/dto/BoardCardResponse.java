package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.entity.PipelineStage;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Everything one pipeline card needs that is not already on the application.
 *
 * <p><b>This exists to collapse a fan-out.</b> The board issued one HTTP request per card, twice —
 * {@code offerApps.forEach(a =&gt; apiFetch('/api/offers/applications/' + a.id))} and the same loop
 * for interviews. On a busy board that is hundreds of requests on load. Twelve lines above it, the
 * same file already does it correctly with
 * {@code /api/background-checks/summary?applicationIds=}.
 *
 * <p>It also carries {@link #availableTransitions}, so the card's move list comes from the server.
 * The board computed the next stage in the browser by walking its own {@code STAGE_GROUPS} array by
 * index — <b>the front end owning a workflow rule the backend already enforces</b>, with no
 * mechanism to notice when the two disagree. {@code /available-transitions} has existed the whole
 * time and was never called.
 */
public class BoardCardResponse {

    /** How close to expiry an offer must be before the card says so. */
    public static final int OFFER_EXPIRY_WARNING_DAYS = 7;

    /**
     * The stages this application may actually move to, from the server.
     *
     * <p>Empty is a real answer — a terminal application has nowhere to go — and is different from
     * the card simply not knowing, which is what an absent entry in the batch means.
     */
    private List<PipelineStage> availableTransitions = new ArrayList<>();

    /** The live offer's status, or null when there is no offer with the candidate. */
    private String offerStatus;

    /**
     * Days until the live offer expires, negative if it already has, null when there is no offer
     * or the offer carries no expiry date.
     *
     * <p>Null rather than a large number: {@code offerExpiryDate} is nullable, and an offer with no
     * expiry never appears in any expiry check — the same gap the agency panel has with
     * {@code contractEndDate}.
     */
    private Long offerExpiresInDays;

    /** True when the live offer is inside the warning window. Null when there is no live offer. */
    private Boolean offerExpiringSoon;

    /**
     * Interviews completed with no feedback recorded.
     *
     * <p>{@code Interview.requiresFeedback()} already answers this per interview and is exposed on
     * the JSON; nothing counted it per application.
     */
    private long interviewsAwaitingFeedback;

    /** When the most recent interview was held, or null if none has been. */
    private LocalDateTime lastInterviewAt;

    /**
     * The next interview still on the calendar, if any.
     *
     * <p>Carried here so the card preview the board already showed survives the move to one batch
     * call. It was previously fetched per card, which is what made the board issue a request per
     * candidate.
     */
    private LocalDateTime nextInterviewAt;
    private String nextInterviewType;
    private String nextInterviewStatus;

    /** The most recent completed interview's recommendation, or null if none has been given. */
    private String latestRecommendation;

    public static BoardCardResponse from(List<PipelineStage> availableTransitions,
                                         List<Offer> offers,
                                         List<Interview> interviews,
                                         LocalDateTime now) {
        BoardCardResponse card = new BoardCardResponse();

        if (availableTransitions != null) {
            card.availableTransitions = availableTransitions;
        }

        Offer live = liveOffer(offers);
        if (live != null) {
            card.offerStatus = live.getStatus() == null ? null : live.getStatus().name();
            LocalDateTime expiry = live.getOfferExpiryDate();
            if (expiry != null) {
                long days = Duration.between(now, expiry).toDays();
                card.offerExpiresInDays = days;
                card.offerExpiringSoon = days <= OFFER_EXPIRY_WARNING_DAYS;
            } else {
                // No expiry date is not "expires never soon" — it is unknown, and saying so is the
                // only honest option.
                card.offerExpiringSoon = null;
            }
        }

        if (interviews != null) {
            Interview nextUp = null;
            Interview lastCompleted = null;

            for (Interview interview : interviews) {
                if (interview.requiresFeedback()) {
                    card.interviewsAwaitingFeedback++;
                }

                LocalDateTime scheduled = interview.getScheduledAt();
                if (scheduled != null
                        && (card.lastInterviewAt == null || scheduled.isAfter(card.lastInterviewAt))) {
                    card.lastInterviewAt = scheduled;
                }

                InterviewStatus status = interview.getStatus();
                if (status == InterviewStatus.SCHEDULED || status == InterviewStatus.RESCHEDULED) {
                    // The soonest upcoming one, not merely the first in the list.
                    if (scheduled != null && (nextUp == null || scheduled.isBefore(nextUp.getScheduledAt()))) {
                        nextUp = interview;
                    }
                } else if (status == InterviewStatus.COMPLETED) {
                    if (lastCompleted == null || isLater(interview, lastCompleted)) {
                        lastCompleted = interview;
                    }
                }
            }

            if (nextUp != null) {
                card.nextInterviewAt = nextUp.getScheduledAt();
                card.nextInterviewType = nextUp.getType() == null ? null : nextUp.getType().name();
                card.nextInterviewStatus = nextUp.getStatus().name();
            }
            if (lastCompleted != null && lastCompleted.getRecommendation() != null) {
                card.latestRecommendation = lastCompleted.getRecommendation().toString();
            }
        }

        return card;
    }

    /**
     * The offer that is actually with the candidate, if any.
     *
     * <p>Uses {@link OfferSummaryResponse#WITH_CANDIDATE} rather than restating the set, so the
     * card and the offers queue cannot disagree about what "live" means. A draft offer is not with
     * anybody and must not produce an expiry warning.
     */
    private static Offer liveOffer(List<Offer> offers) {
        if (offers == null) return null;
        Offer newest = null;
        for (Offer offer : offers) {
            OfferStatus status = offer.getStatus();
            if (status == null || !OfferSummaryResponse.WITH_CANDIDATE.contains(status)) {
                continue;
            }
            if (newest == null || isNewer(offer, newest)) {
                newest = offer;
            }
        }
        return newest;
    }

    private static boolean isLater(Interview candidate, Interview incumbent) {
        LocalDateTime a = candidate.getScheduledAt();
        LocalDateTime b = incumbent.getScheduledAt();
        if (a == null) return false;
        if (b == null) return true;
        return a.isAfter(b);
    }

    private static boolean isNewer(Offer candidate, Offer incumbent) {
        LocalDateTime a = candidate.getCreatedAt();
        LocalDateTime b = incumbent.getCreatedAt();
        if (a == null) return false;
        if (b == null) return true;
        return a.isAfter(b);
    }

    public List<PipelineStage> getAvailableTransitions() { return availableTransitions; }
    public void setAvailableTransitions(List<PipelineStage> availableTransitions) {
        this.availableTransitions = availableTransitions;
    }

    public String getOfferStatus() { return offerStatus; }
    public void setOfferStatus(String offerStatus) { this.offerStatus = offerStatus; }

    public Long getOfferExpiresInDays() { return offerExpiresInDays; }
    public void setOfferExpiresInDays(Long offerExpiresInDays) { this.offerExpiresInDays = offerExpiresInDays; }

    public Boolean getOfferExpiringSoon() { return offerExpiringSoon; }
    public void setOfferExpiringSoon(Boolean offerExpiringSoon) { this.offerExpiringSoon = offerExpiringSoon; }

    public long getInterviewsAwaitingFeedback() { return interviewsAwaitingFeedback; }
    public void setInterviewsAwaitingFeedback(long interviewsAwaitingFeedback) {
        this.interviewsAwaitingFeedback = interviewsAwaitingFeedback;
    }

    public LocalDateTime getLastInterviewAt() { return lastInterviewAt; }
    public void setLastInterviewAt(LocalDateTime lastInterviewAt) { this.lastInterviewAt = lastInterviewAt; }

    public LocalDateTime getNextInterviewAt() { return nextInterviewAt; }
    public void setNextInterviewAt(LocalDateTime nextInterviewAt) { this.nextInterviewAt = nextInterviewAt; }

    public String getNextInterviewType() { return nextInterviewType; }
    public void setNextInterviewType(String nextInterviewType) { this.nextInterviewType = nextInterviewType; }

    public String getNextInterviewStatus() { return nextInterviewStatus; }
    public void setNextInterviewStatus(String nextInterviewStatus) { this.nextInterviewStatus = nextInterviewStatus; }

    public String getLatestRecommendation() { return latestRecommendation; }
    public void setLatestRecommendation(String latestRecommendation) { this.latestRecommendation = latestRecommendation; }
}
