package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Counts for the whole offer set.
 *
 * <p>An offer is the only record in this product with a hard clock on it, and a lapse costs the
 * entire hire — the candidate returns to the pipeline and the advert has usually closed. So this is
 * organised around expiry rather than around volume.
 */
public class OfferSummaryResponse {

    /**
     * Every status where the offer is actually with the candidate.
     *
     * <p>The clock runs in all four. Counting only {@code SENT} — which is what
     * {@code countNearExpiry} did — omits precisely the offers most likely to lapse, because a
     * signature or a negotiation is exactly what is consuming the time.
     */
    public static final Set<OfferStatus> WITH_CANDIDATE = EnumSet.of(
            OfferStatus.SENT,
            OfferStatus.AWAITING_SIGNATURE,
            OfferStatus.SIGNED,
            OfferStatus.UNDER_NEGOTIATION);

    /** Statuses where the offer is over, one way or another. */
    public static final Set<OfferStatus> CLOSED = EnumSet.of(
            OfferStatus.DECLINED,
            OfferStatus.WITHDRAWN,
            OfferStatus.EXPIRED,
            OfferStatus.SUPERSEDED);

    private Map<String, Long> countsByStatus = new LinkedHashMap<>();
    private long total;

    /** Out with candidates right now — the set the clock applies to. */
    private long withCandidate;

    /** Of those, expiring within seven days. */
    private long expiringSoon;

    /** Of those, expiring within forty-eight hours. The ones worth interrupting someone for. */
    private long expiringImminently;

    /** Lapsed unanswered. A different follow-up from a candidate who said no. */
    private long lapsed;

    /** Days until the soonest expiry among offers with a candidate, or null if none have one. */
    private Long soonestExpiryDays;

    /** That offer's id, so a caller can go straight to it. */
    private String soonestExpiryId;

    /**
     * Out with candidates and carrying no expiry date at all.
     *
     * <p>{@code offerExpiryDate} is optional and the create form does not require it. An offer with
     * no expiry appears in no near-expiry count and can sit indefinitely, so it is reported rather
     * than quietly excluded — otherwise the expiry figures look complete when they are not.
     */
    private long withoutExpiry;

    /**
     * Annualised base salary committed across offers with a candidate.
     *
     * <p><b>Annualised, because base salary is not one measure.</b> {@code salaryFrequency} is
     * ANNUALLY, MONTHLY or HOURLY, so summing the raw figures would add a monthly salary to an
     * annual one and report the total as rand. Monthly is multiplied by twelve; hourly cannot be
     * annualised without contracted hours, which the offer does not record.
     */
    private BigDecimal committedAnnualValue = BigDecimal.ZERO;

    /**
     * How many offers were left out of that figure, and why it is stated rather than hidden.
     *
     * <p>An hourly offer, or one with no base salary, cannot be added to an annual total. Reporting
     * the count keeps the total honest: a reader can see it describes most of the set rather than
     * assuming it describes all of it.
     */
    private long committedValueExcluded;

    public static OfferSummaryResponse from(List<Offer> offers, LocalDateTime now) {
        OfferSummaryResponse summary = new OfferSummaryResponse();

        for (OfferStatus status : OfferStatus.values()) {
            summary.countsByStatus.put(status.name(), 0L);
        }

        Offer soonest = null;

        for (Offer offer : offers) {
            summary.total++;
            OfferStatus status = offer.getStatus();
            if (status == null) continue;
            summary.countsByStatus.merge(status.name(), 1L, Long::sum);

            if (status == OfferStatus.EXPIRED) {
                summary.lapsed++;
            }
            if (!WITH_CANDIDATE.contains(status)) {
                continue;
            }

            summary.withCandidate++;

            BigDecimal annual = annualised(offer);
            if (annual == null) {
                summary.committedValueExcluded++;
            } else {
                summary.committedAnnualValue = summary.committedAnnualValue.add(annual);
            }

            LocalDateTime expiry = offer.getOfferExpiryDate();
            if (expiry == null) {
                summary.withoutExpiry++;
                continue;
            }
            if (expiry.isBefore(now.plusDays(7))) {
                summary.expiringSoon++;
            }
            if (expiry.isBefore(now.plusHours(48))) {
                summary.expiringImminently++;
            }
            if (soonest == null || expiry.isBefore(soonest.getOfferExpiryDate())) {
                soonest = offer;
            }
        }

        if (soonest != null) {
            summary.soonestExpiryId = soonest.getId();
            // Floored at zero: an offer already past its date is "expiring in 0 days", not in a
            // negative number of them.
            summary.soonestExpiryDays = Math.max(0,
                    Duration.between(now, soonest.getOfferExpiryDate()).toDays());
        }

        return summary;
    }

    /**
     * Base salary as an annual figure, or null where it cannot be one.
     *
     * <p>Null rather than a guess: an hourly rate needs contracted hours to annualise and the offer
     * does not record them, so inventing 2 080 hours would produce a number nobody agreed to.
     */
    static BigDecimal annualised(Offer offer) {
        BigDecimal base = offer.getBaseSalary();
        if (base == null) {
            return null;
        }
        String frequency = offer.getSalaryFrequency();
        // Defaults to ANNUALLY on the entity, so an absent value means annual rather than unknown.
        if (frequency == null || frequency.isBlank() || "ANNUALLY".equalsIgnoreCase(frequency)) {
            return base;
        }
        if ("MONTHLY".equalsIgnoreCase(frequency)) {
            return base.multiply(BigDecimal.valueOf(12));
        }
        return null;
    }

    public Map<String, Long> getCountsByStatus() { return countsByStatus; }
    public void setCountsByStatus(Map<String, Long> countsByStatus) { this.countsByStatus = countsByStatus; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getWithCandidate() { return withCandidate; }
    public void setWithCandidate(long withCandidate) { this.withCandidate = withCandidate; }

    public long getExpiringSoon() { return expiringSoon; }
    public void setExpiringSoon(long expiringSoon) { this.expiringSoon = expiringSoon; }

    public long getExpiringImminently() { return expiringImminently; }
    public void setExpiringImminently(long expiringImminently) { this.expiringImminently = expiringImminently; }

    public long getLapsed() { return lapsed; }
    public void setLapsed(long lapsed) { this.lapsed = lapsed; }

    public Long getSoonestExpiryDays() { return soonestExpiryDays; }
    public void setSoonestExpiryDays(Long soonestExpiryDays) { this.soonestExpiryDays = soonestExpiryDays; }

    public String getSoonestExpiryId() { return soonestExpiryId; }
    public void setSoonestExpiryId(String soonestExpiryId) { this.soonestExpiryId = soonestExpiryId; }

    public long getWithoutExpiry() { return withoutExpiry; }
    public void setWithoutExpiry(long withoutExpiry) { this.withoutExpiry = withoutExpiry; }

    public BigDecimal getCommittedAnnualValue() { return committedAnnualValue; }
    public void setCommittedAnnualValue(BigDecimal committedAnnualValue) { this.committedAnnualValue = committedAnnualValue; }

    public long getCommittedValueExcluded() { return committedValueExcluded; }
    public void setCommittedValueExcluded(long committedValueExcluded) { this.committedValueExcluded = committedValueExcluded; }
}
