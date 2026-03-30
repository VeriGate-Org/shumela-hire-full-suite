package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.entity.OfferType;
import com.arthmatic.shumelahire.entity.NegotiationStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Offer entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaOfferDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoOfferRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface OfferDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Offer> findById(String id);

    Offer save(Offer entity);

    List<Offer> saveAll(List<Offer> entities);

    void deleteById(String id);

    boolean existsById(String id);

    /** Return all offers. */
    List<Offer> findAll();

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find an offer with eagerly loaded application details. */
    Optional<Offer> findByIdWithDetails(String id);

    /** All offers for a given application. */
    List<Offer> findByApplicationId(String applicationId);

    /** Find an offer by its unique offer number. */
    Optional<Offer> findByOfferNumber(String offerNumber);

    /** All offers with a given status. */
    List<Offer> findByStatus(OfferStatus status);

    /** All offers matching any of the given statuses. */
    List<Offer> findByStatusIn(List<OfferStatus> statuses);

    /** All offers of a given type. */
    List<Offer> findByOfferType(OfferType offerType);

    /** All offers with a given negotiation status. */
    List<Offer> findByNegotiationStatus(NegotiationStatus negotiationStatus);

    /** Offers pending approval within a user's approval level. */
    List<Offer> findOffersRequiringApproval(int userApprovalLevel);

    /** Expired offers (past expiry, still SENT or UNDER_NEGOTIATION). */
    List<Offer> findExpiredOffers(LocalDateTime expiryTime);

    /** Offers expiring between two time boundaries. */
    List<Offer> findOffersExpiringBetween(LocalDateTime startTime, LocalDateTime endTime);

    /** Active (non-superseded) offers for an application, ordered by version desc. */
    List<Offer> findActiveOffersByApplication(String applicationId);

    /** Active offers for an applicant, ordered by createdAt desc. */
    List<Offer> findActiveOffersByApplicantId(String applicantId);

    /** Count offers with a given status. */
    long countByStatusAndDateRange(OfferStatus status, LocalDateTime startDate, LocalDateTime endDate);

    /** Count pending approval offers. */
    long countPendingApproval();

    /** Count offers near expiry. */
    long countNearExpiry(LocalDateTime nearExpiryTime);

    /** Count offers sent within a date range. */
    long countByOfferSentAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // ── Search & analytics ───────────────────────────────────────────────────

    /** Search offers with multiple filters (paginated). */
    Page<Offer> searchOffers(OfferStatus status, OfferType offerType,
                             NegotiationStatus negotiationStatus,
                             String department, String jobTitle,
                             BigDecimal minSalary, BigDecimal maxSalary,
                             LocalDateTime startDate, LocalDateTime endDate,
                             Pageable pageable);

    /** Offer status distribution within a date range. Returns list of [status, count]. */
    List<Object[]> getOfferStatusDistribution(LocalDateTime startDate, LocalDateTime endDate);

    /** Offer type distribution within a date range. Returns list of [offerType, count]. */
    List<Object[]> getOfferTypeDistribution(LocalDateTime startDate, LocalDateTime endDate);

    /** Acceptance rate data within a date range. Returns [totalSent, totalAccepted]. */
    Object[] getAcceptanceRateData(LocalDateTime startDate, LocalDateTime endDate);

    /** Average hours from offer sent to accepted within a date range. */
    Double getAverageTimeToAcceptanceHours(LocalDateTime startDate, LocalDateTime endDate);

    /** Average hours from offer sent to any decision within a date range. */
    Double getAverageTimeToDecisionHours(LocalDateTime startDate, LocalDateTime endDate);

    /** Average salary grouped by department within a date range. Returns list of [department, avgSalary]. */
    List<Object[]> getAverageSalaryByDepartment(LocalDateTime startDate, LocalDateTime endDate);

    /** Count offers currently under negotiation. */
    long countActiveNegotiations();

    /** Count offers accepted after a given date. */
    long countRecentAcceptances(LocalDateTime since);
}
