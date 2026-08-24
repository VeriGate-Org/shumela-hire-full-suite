package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Whole-set counts for the offers queue.
 *
 * <p>An offer is the only record with a hard clock on it, so what these pin is that the clock is
 * read across every state where it is actually running — and that a committed-value total is not
 * assembled out of measures that disagree about what a unit is.
 */
class OfferSummaryResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 24, 12, 0);

    private static Offer offer(String id, OfferStatus status, LocalDateTime expiry) {
        Offer offer = new Offer();
        offer.setId(id);
        offer.setStatus(status);
        offer.setOfferExpiryDate(expiry);
        return offer;
    }

    private static Offer paid(String id, OfferStatus status, String base, String frequency) {
        Offer offer = offer(id, status, NOW.plusDays(10));
        offer.setBaseSalary(new BigDecimal(base));
        offer.setSalaryFrequency(frequency);
        return offer;
    }

    @Test
    @DisplayName("Every state where the clock is running counts as with the candidate")
    void withCandidateSpansEveryLiveState() {
        // Counting SENT alone omits the offers most likely to lapse: a signature or a negotiation
        // is exactly what consumes the time.
        var summary = OfferSummaryResponse.from(List.of(
                offer("sent", OfferStatus.SENT, NOW.plusDays(3)),
                offer("signing", OfferStatus.AWAITING_SIGNATURE, NOW.plusDays(1)),
                offer("signed", OfferStatus.SIGNED, NOW.plusDays(2)),
                offer("negotiating", OfferStatus.UNDER_NEGOTIATION, NOW.plusDays(4)),
                offer("draft", OfferStatus.DRAFT, NOW.plusDays(1))), NOW);

        assertEquals(4, summary.getWithCandidate());
        assertEquals(4, summary.getExpiringSoon());
    }

    @Test
    @DisplayName("Imminent is a tighter window than soon, and both are counted")
    void imminentIsItsOwnFigure() {
        var summary = OfferSummaryResponse.from(List.of(
                offer("tomorrow", OfferStatus.AWAITING_SIGNATURE, NOW.plusHours(20)),
                offer("next-week", OfferStatus.SENT, NOW.plusDays(6))), NOW);

        assertEquals(2, summary.getExpiringSoon());
        assertEquals(1, summary.getExpiringImminently());
        assertEquals("tomorrow", summary.getSoonestExpiryId());
        assertEquals(0L, summary.getSoonestExpiryDays());
    }

    @Test
    @DisplayName("A lapsed offer is its own state, not a decline")
    void lapsedIsDistinct() {
        // A candidate who never answered and one who said no need different follow-ups.
        var summary = OfferSummaryResponse.from(List.of(
                offer("lapsed", OfferStatus.EXPIRED, NOW.minusDays(5)),
                offer("declined", OfferStatus.DECLINED, NOW.minusDays(5))), NOW);

        assertEquals(1, summary.getLapsed());
        assertEquals(1L, summary.getCountsByStatus().get(OfferStatus.DECLINED.name()));
    }

    @Test
    @DisplayName("An offer with no expiry is reported rather than silently left out")
    void missingExpiryIsSurfaced() {
        // offerExpiryDate is optional, so such an offer appears in no near-expiry count and can sit
        // indefinitely. Saying how many there are keeps the expiry figures honest.
        var summary = OfferSummaryResponse.from(List.of(
                offer("no-date", OfferStatus.SENT, null),
                offer("dated", OfferStatus.SENT, NOW.plusDays(2))), NOW);

        assertEquals(2, summary.getWithCandidate());
        assertEquals(1, summary.getWithoutExpiry());
        assertEquals(1, summary.getExpiringSoon());
        assertEquals("dated", summary.getSoonestExpiryId());
    }

    @Test
    @DisplayName("Monthly salaries are annualised before being added to annual ones")
    void committedValueIsOneMeasure() {
        var summary = OfferSummaryResponse.from(List.of(
                paid("annual", OfferStatus.SENT, "780000", "ANNUALLY"),
                paid("monthly", OfferStatus.AWAITING_SIGNATURE, "50000", "MONTHLY")), NOW);

        // 780 000 + (50 000 × 12). Summing the raw figures would have reported 830 000 as rand.
        assertEquals(new BigDecimal("1380000"), summary.getCommittedAnnualValue());
        assertEquals(0, summary.getCommittedValueExcluded());
    }

    @Test
    @DisplayName("An hourly offer is excluded and counted, never annualised on a guess")
    void hourlyIsExcludedAndDeclared() {
        // Annualising an hourly rate needs contracted hours the offer does not record; assuming
        // 2 080 would produce a number nobody agreed to.
        var summary = OfferSummaryResponse.from(List.of(
                paid("annual", OfferStatus.SENT, "600000", "ANNUALLY"),
                paid("hourly", OfferStatus.SENT, "450", "HOURLY"),
                offer("no-salary", OfferStatus.SENT, NOW.plusDays(3))), NOW);

        assertEquals(new BigDecimal("600000"), summary.getCommittedAnnualValue());
        assertEquals(2, summary.getCommittedValueExcluded());
    }

    @Test
    @DisplayName("An absent frequency is annual, because that is the entity's own default")
    void absentFrequencyIsAnnual() {
        Offer offer = paid("a", OfferStatus.SENT, "700000", null);
        assertEquals(new BigDecimal("700000"), OfferSummaryResponse.annualised(offer));
    }

    @Test
    @DisplayName("Every status appears, including the ones holding nothing")
    void emptyStatusesStillAppear() {
        var summary = OfferSummaryResponse.from(List.of(offer("a", OfferStatus.SENT, NOW.plusDays(1))), NOW);

        assertEquals(OfferStatus.values().length, summary.getCountsByStatus().size());
        assertEquals(0L, summary.getCountsByStatus().get(OfferStatus.ACCEPTED.name()));
    }

    @Test
    @DisplayName("An empty set reports no soonest expiry rather than a zero")
    void emptySetIsHonest() {
        var summary = OfferSummaryResponse.from(List.of(), NOW);

        assertEquals(0, summary.getTotal());
        assertNull(summary.getSoonestExpiryDays());
        assertNull(summary.getSoonestExpiryId());
        assertEquals(BigDecimal.ZERO, summary.getCommittedAnnualValue());
    }
}
