package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The recruitment overview.
 *
 * <p>What these pin is the distinction the old dashboard could not make: a real number, a base too
 * thin to quote, and a figure that could not be read at all are three different answers leading to
 * three different actions. The page rendered all three as {@code 0}.
 */
class RecruiterDashboardResponseTest {

    private static List<Offer> offers(int accepted, int declined, int unsettled) {
        List<Offer> all = new ArrayList<>();
        for (int i = 0; i < accepted; i++) all.add(offer(OfferStatus.ACCEPTED));
        for (int i = 0; i < declined; i++) all.add(offer(OfferStatus.DECLINED));
        for (int i = 0; i < unsettled; i++) all.add(offer(OfferStatus.SENT));
        return all;
    }

    private static Offer offer(OfferStatus status) {
        Offer offer = new Offer();
        offer.setStatus(status);
        return offer;
    }

    @Test
    @DisplayName("An acceptance rate is withheld until enough offers have settled")
    void thinBaseIsWithheld() {
        // Four settled offers: one outcome moves the figure by twenty-five points. That is noise
        // presented as a metric.
        var thin = RecruiterDashboardResponse.from(null, null, null, null, offers(3, 1, 5), null, 0);

        assertEquals(4, thin.getOffersSettled());
        assertNull(thin.getOfferAcceptanceRate());
    }

    @Test
    @DisplayName("At the threshold the rate is shown")
    void thresholdIsInclusive() {
        var enough = RecruiterDashboardResponse.from(null, null, null, null,
                offers(7, 3, 2), null, 0);

        assertEquals(RecruiterDashboardResponse.MIN_SETTLED_OFFERS_FOR_RATE, enough.getOffersSettled());
        assertEquals(70.0, enough.getOfferAcceptanceRate());
    }

    @Test
    @DisplayName("Only offers that reached an outcome count as settled")
    void unsettledOffersAreExcluded() {
        // An offer still with the candidate has not been answered. Counting it as a non-acceptance
        // would report a rate that improves purely by waiting.
        var response = RecruiterDashboardResponse.from(null, null, null, null,
                offers(10, 0, 40), null, 0);

        assertEquals(10, response.getOffersSettled());
        assertEquals(100.0, response.getOfferAcceptanceRate());
    }

    @Test
    @DisplayName("An expired offer says nothing about acceptance")
    void expiredOffersAreNotSettled() {
        // The candidate never answered. Treating expiry as a decline would blame them for a
        // deadline we set.
        List<Offer> withExpired = new ArrayList<>(offers(6, 4, 0));
        withExpired.add(offer(OfferStatus.EXPIRED));
        withExpired.add(offer(OfferStatus.WITHDRAWN));

        var response = RecruiterDashboardResponse.from(null, null, null, null, withExpired, null, 0);

        assertEquals(10, response.getOffersSettled());
        assertEquals(60.0, response.getOfferAcceptanceRate());
    }

    @Test
    @DisplayName("No offers at all reports no rate rather than nought percent")
    void noOffersNoRate() {
        var response = RecruiterDashboardResponse.from(null, null, null, null, List.of(), null, 0);

        assertEquals(0, response.getOffersSettled());
        assertNull(response.getOfferAcceptanceRate());
    }

    @Test
    @DisplayName("Pipeline analytics failing does not zero the rest of the page")
    void pipelineFailureIsIsolated() {
        // The old page read four endpoints inside if (ok) with no else, so one failure left every
        // figure at its initial zero.
        var postings = new JobPostingSummaryResponse();
        postings.setOpenToApplicants(8);
        postings.setPastDeadline(3);

        var response = RecruiterDashboardResponse.from(postings, null, null, null,
                offers(7, 3, 0), null, 34);

        assertFalse(response.isPipelineAvailable());
        assertNull(response.getPipeline());
        // Everything that did not depend on the pipeline is still true.
        assertEquals(8, response.getOpenAdverts());
        assertEquals(3, response.getAdvertsPastDeadline());
        assertEquals(34, response.getApplicationsLast7Days());
        assertEquals(70.0, response.getOfferAcceptanceRate());
    }

    @Test
    @DisplayName("Pipeline present is reported as available")
    void pipelinePresent() {
        var response = RecruiterDashboardResponse.from(null, null, null, null, List.of(),
                new PipelineAnalyticsResponse(), 0);

        assertTrue(response.isPipelineAvailable());
    }

    @Test
    @DisplayName("The exception counts come from the pages that already own them")
    void exceptionCountsAreComposed() {
        // Composed rather than recomputed, so the dashboard cannot quote a different number from
        // the screen it links to.
        var postings = new JobPostingSummaryResponse();
        postings.setPastDeadline(3);
        var interviews = new InterviewSummaryResponse();
        interviews.setAwaitingWriteUp(5);
        var offerSummary = new OfferSummaryResponse();
        offerSummary.setExpiringSoon(3);
        offerSummary.setLapsed(2);

        var response = RecruiterDashboardResponse.from(postings, null, interviews, offerSummary,
                List.of(), null, 0);

        assertEquals(3, response.getAdvertsPastDeadline());
        assertEquals(5, response.getInterviewsAwaitingFeedback());
        assertEquals(3, response.getOffersExpiringSoon());
        // Lapsed is separate from expiring: one is a chase, the other has already gone.
        assertEquals(2, response.getOffersLapsed());
    }

    @Test
    @DisplayName("Everything absent reports zeroes without throwing")
    void allAbsent() {
        var response = RecruiterDashboardResponse.from(null, null, null, null, null, null, 0);

        assertEquals(0, response.getApplications());
        assertEquals(0, response.getOpenAdverts());
        assertNull(response.getOfferAcceptanceRate());
        assertFalse(response.isPipelineAvailable());
    }
}
