package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.entity.PipelineStage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What one pipeline card needs beyond the application itself.
 *
 * <p>These pin the two things the board got wrong: an offer badge that must only fire for an offer
 * actually with the candidate, and a move list that comes from the server rather than from the
 * front end walking its own stage array.
 */
class BoardCardResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 25, 12, 0);

    private static Offer offer(OfferStatus status, LocalDateTime expiry, LocalDateTime createdAt) {
        Offer offer = new Offer();
        offer.setStatus(status);
        offer.setOfferExpiryDate(expiry);
        offer.setCreatedAt(createdAt);
        return offer;
    }

    private static Interview interview(InterviewStatus status, LocalDateTime scheduledAt) {
        Interview interview = new Interview();
        interview.setStatus(status);
        interview.setScheduledAt(scheduledAt);
        return interview;
    }

    @Test
    @DisplayName("The move list comes from the server, empty included")
    void movesComeFromTheServer() {
        // The board walked STAGE_GROUPS by index to decide this, so it owned a workflow rule the
        // backend enforces. An empty list is a real answer: a terminal application cannot move.
        var card = BoardCardResponse.from(
                List.of(PipelineStage.FIRST_INTERVIEW, PipelineStage.REJECTED), null, null, NOW);

        assertEquals(2, card.getAvailableTransitions().size());

        var terminal = BoardCardResponse.from(List.of(), null, null, NOW);
        assertEquals(List.of(), terminal.getAvailableTransitions());
    }

    @Test
    @DisplayName("An expiry warning fires only for an offer actually with the candidate")
    void draftOffersDoNotWarn() {
        // A draft offer is not with anybody. Warning that it expires in two days would send a
        // recruiter chasing a candidate who has never seen it.
        var draft = BoardCardResponse.from(null,
                List.of(offer(OfferStatus.DRAFT, NOW.plusDays(2), NOW.minusDays(1))), null, NOW);

        assertNull(draft.getOfferStatus());
        assertNull(draft.getOfferExpiringSoon());

        var sent = BoardCardResponse.from(null,
                List.of(offer(OfferStatus.SENT, NOW.plusDays(2), NOW.minusDays(1))), null, NOW);

        assertEquals(OfferStatus.SENT.name(), sent.getOfferStatus());
        assertTrue(sent.getOfferExpiringSoon());
        assertEquals(2L, sent.getOfferExpiresInDays());
    }

    @Test
    @DisplayName("An offer with no expiry date says so rather than reading as safe")
    void missingExpiryIsUnknown() {
        // offerExpiryDate is nullable. "Not expiring soon" and "we do not know when this expires"
        // are different answers, and only one of them means stop worrying.
        var card = BoardCardResponse.from(null,
                List.of(offer(OfferStatus.SENT, null, NOW.minusDays(1))), null, NOW);

        assertEquals(OfferStatus.SENT.name(), card.getOfferStatus());
        assertNull(card.getOfferExpiresInDays());
        assertNull(card.getOfferExpiringSoon());
    }

    @Test
    @DisplayName("An already-expired offer reports negative days rather than hiding")
    void expiredOffersAreVisible() {
        var card = BoardCardResponse.from(null,
                List.of(offer(OfferStatus.AWAITING_SIGNATURE, NOW.minusDays(3), NOW.minusDays(20))),
                null, NOW);

        assertTrue(card.getOfferExpiresInDays() < 0);
        assertTrue(card.getOfferExpiringSoon());
    }

    @Test
    @DisplayName("The newest live offer wins when a candidate has been re-offered")
    void newestLiveOfferWins() {
        var card = BoardCardResponse.from(null, List.of(
                offer(OfferStatus.UNDER_NEGOTIATION, NOW.plusDays(20), NOW.minusDays(30)),
                offer(OfferStatus.SENT, NOW.plusDays(3), NOW.minusDays(2))), null, NOW);

        assertEquals(OfferStatus.SENT.name(), card.getOfferStatus());
        assertEquals(3L, card.getOfferExpiresInDays());
    }

    @Test
    @DisplayName("A declined offer is not live, so it produces no badge")
    void declinedOffersAreNotLive() {
        // Uses OfferSummaryResponse.WITH_CANDIDATE rather than restating the set, so this card and
        // the offers queue cannot disagree about what "live" means.
        var card = BoardCardResponse.from(null,
                List.of(offer(OfferStatus.DECLINED, NOW.plusDays(2), NOW.minusDays(1))), null, NOW);

        assertNull(card.getOfferStatus());
    }

    @Test
    @DisplayName("Interviews awaiting write-up are counted per application")
    void feedbackOverdueIsCounted() {
        // Interview.requiresFeedback() answered this per interview and nothing counted it per card.
        var card = BoardCardResponse.from(null, null, List.of(
                interview(InterviewStatus.COMPLETED, NOW.minusDays(10)),
                interview(InterviewStatus.COMPLETED, NOW.minusDays(3)),
                interview(InterviewStatus.SCHEDULED, NOW.plusDays(1))), NOW);

        assertEquals(2, card.getInterviewsAwaitingFeedback());
        // The scheduled one is still the most recent thing on the calendar.
        assertEquals(NOW.plusDays(1), card.getLastInterviewAt());
    }

    @Test
    @DisplayName("A card with nothing attached reports nothing rather than zeroes with meaning")
    void emptyCard() {
        var card = BoardCardResponse.from(null, List.of(), List.of(), NOW);

        assertEquals(List.of(), card.getAvailableTransitions());
        assertNull(card.getOfferStatus());
        assertNull(card.getOfferExpiresInDays());
        assertNull(card.getLastInterviewAt());
        assertEquals(0, card.getInterviewsAwaitingFeedback());
    }
}
