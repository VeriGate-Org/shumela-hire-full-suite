package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;

import java.util.List;

/**
 * The recruitment overview, in one response.
 *
 * <p><b>Every headline figure on this dashboard was structurally zero.</b> The page read
 * {@code data.totalApplications}, {@code data.activeJobPostings}, {@code data.newApplicants} and
 * {@code data.interviewRate} from {@code GET /api/analytics/dashboard}. That endpoint returns
 * {@code kpis}, {@code trends} and {@code alerts} — <b>none of those four keys has ever been on
 * it</b>. Each read then passed through {@code || 0}, so the page rendered noughts on a fully
 * successful request and nothing anywhere said so.
 *
 * <p>The front end tried two names for two of them —
 * {@code data.activeJobPostings || data.openPositions} and
 * {@code data.interviewRate || data.conversionRates?.interviewRate} — which is what guessing at an
 * unpinned contract looks like. This DTO is the contract.
 *
 * <p><b>Composed from the existing summaries rather than recomputed.</b> The counts come from
 * {@link JobPostingSummaryResponse}, {@link ApplicationSummaryResponse},
 * {@link InterviewSummaryResponse}, {@link OfferSummaryResponse} and
 * {@link PipelineAnalyticsResponse}, so this page cannot disagree with the pages it links to. A
 * dashboard quoting different numbers from the screens beneath it is worse than one quoting none.
 */
public class RecruiterDashboardResponse {

    /**
     * How many settled offers are needed before an acceptance rate is worth showing.
     *
     * <p>Ten. Below that a single outcome moves the figure by more than ten percentage points, and
     * a rate that swings that hard is noise presented as a metric. Chosen deliberately rather than
     * inherited — the design picked four and said it was arbitrary.
     */
    public static final int MIN_SETTLED_OFFERS_FOR_RATE = 10;

    /** Adverts open to applicants right now. */
    private long openAdverts;

    /**
     * Published, deadline passed, still listed.
     *
     * <p>One of the three exception counts this page leads with. Nothing closes an advert when its
     * closing date passes, so these sit at {@code PUBLISHED} indefinitely.
     */
    private long advertsPastDeadline;

    /** Applications received, ever. */
    private long applications;

    /** Applications received in the last seven days. */
    private long applicationsLast7Days;

    /** Applications nobody has screened. */
    private long unscreened;

    /** Interviews completed with no write-up recorded. The second exception count. */
    private long interviewsAwaitingFeedback;

    /** Offers with the candidate and close to expiry. The third. */
    private long offersExpiringSoon;

    /**
     * Offers already past their expiry date and still listed as live.
     *
     * <p>Worse than "expiring soon" and reported separately, because the action differs: one is a
     * chase, the other is a contract that has already lapsed.
     */
    private long offersLapsed;

    /** Offers that reached an outcome — accepted or declined. */
    private long offersSettled;

    /** Offers accepted. */
    private long offersAccepted;

    /**
     * Acceptance rate, or <b>null when too few offers have settled to mean anything</b>.
     *
     * <p>Three answers, not one. A number means a number; null with {@link #offersSettled} below
     * the threshold means the base is too thin; a failed request means the client shows
     * "unavailable". The page previously rendered all three as {@code 0}, and they lead to three
     * different actions.
     */
    private Double offerAcceptanceRate;

    /** Candidates who reached each stage — a funnel, not a snapshot of who sits where. */
    private PipelineAnalyticsResponse pipeline;

    /** Whether the pipeline analytics could be read at all. */
    private boolean pipelineAvailable;

    public static RecruiterDashboardResponse from(JobPostingSummaryResponse postings,
                                                  ApplicationSummaryResponse applications,
                                                  InterviewSummaryResponse interviews,
                                                  OfferSummaryResponse offerSummary,
                                                  List<Offer> allOffers,
                                                  PipelineAnalyticsResponse pipeline,
                                                  long applicationsLast7Days) {
        RecruiterDashboardResponse dashboard = new RecruiterDashboardResponse();

        if (postings != null) {
            dashboard.openAdverts = postings.getOpenToApplicants();
            dashboard.advertsPastDeadline = postings.getPastDeadline();
        }

        if (applications != null) {
            dashboard.applications = applications.getTotal();
            dashboard.unscreened = applications.getUnscreened();
        }
        dashboard.applicationsLast7Days = applicationsLast7Days;

        if (interviews != null) {
            dashboard.interviewsAwaitingFeedback = interviews.getAwaitingWriteUp();
        }

        if (offerSummary != null) {
            dashboard.offersExpiringSoon = offerSummary.getExpiringSoon();
            dashboard.offersLapsed = offerSummary.getLapsed();
        }

        if (allOffers != null) {
            for (Offer offer : allOffers) {
                OfferStatus status = offer.getStatus();
                if (status == OfferStatus.ACCEPTED) {
                    dashboard.offersAccepted++;
                    dashboard.offersSettled++;
                } else if (status == OfferStatus.DECLINED) {
                    // Settled means an outcome was reached. An expired or withdrawn offer never
                    // got an answer from the candidate, so it says nothing about acceptance.
                    dashboard.offersSettled++;
                }
            }
        }

        if (dashboard.offersSettled >= MIN_SETTLED_OFFERS_FOR_RATE) {
            dashboard.offerAcceptanceRate =
                    (double) dashboard.offersAccepted / dashboard.offersSettled * 100;
        }

        dashboard.pipeline = pipeline;
        dashboard.pipelineAvailable = pipeline != null;

        return dashboard;
    }

    public long getOpenAdverts() { return openAdverts; }
    public void setOpenAdverts(long openAdverts) { this.openAdverts = openAdverts; }

    public long getAdvertsPastDeadline() { return advertsPastDeadline; }
    public void setAdvertsPastDeadline(long advertsPastDeadline) { this.advertsPastDeadline = advertsPastDeadline; }

    public long getApplications() { return applications; }
    public void setApplications(long applications) { this.applications = applications; }

    public long getApplicationsLast7Days() { return applicationsLast7Days; }
    public void setApplicationsLast7Days(long applicationsLast7Days) { this.applicationsLast7Days = applicationsLast7Days; }

    public long getUnscreened() { return unscreened; }
    public void setUnscreened(long unscreened) { this.unscreened = unscreened; }

    public long getInterviewsAwaitingFeedback() { return interviewsAwaitingFeedback; }
    public void setInterviewsAwaitingFeedback(long interviewsAwaitingFeedback) {
        this.interviewsAwaitingFeedback = interviewsAwaitingFeedback;
    }

    public long getOffersExpiringSoon() { return offersExpiringSoon; }
    public void setOffersExpiringSoon(long offersExpiringSoon) { this.offersExpiringSoon = offersExpiringSoon; }

    public long getOffersLapsed() { return offersLapsed; }
    public void setOffersLapsed(long offersLapsed) { this.offersLapsed = offersLapsed; }

    public long getOffersSettled() { return offersSettled; }
    public void setOffersSettled(long offersSettled) { this.offersSettled = offersSettled; }

    public long getOffersAccepted() { return offersAccepted; }
    public void setOffersAccepted(long offersAccepted) { this.offersAccepted = offersAccepted; }

    public Double getOfferAcceptanceRate() { return offerAcceptanceRate; }
    public void setOfferAcceptanceRate(Double offerAcceptanceRate) { this.offerAcceptanceRate = offerAcceptanceRate; }

    public PipelineAnalyticsResponse getPipeline() { return pipeline; }
    public void setPipeline(PipelineAnalyticsResponse pipeline) { this.pipeline = pipeline; }

    public boolean isPipelineAvailable() { return pipelineAvailable; }
    public void setPipelineAvailable(boolean pipelineAvailable) { this.pipelineAvailable = pipelineAvailable; }
}
