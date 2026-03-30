package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.SapPayrollTransmission;
import com.arthmatic.shumelahire.entity.TransmissionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the SapPayrollTransmission entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaSapPayrollTransmissionDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoSapPayrollTransmissionRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface SapPayrollTransmissionDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<SapPayrollTransmission> findById(String id);

    SapPayrollTransmission save(SapPayrollTransmission entity);

    List<SapPayrollTransmission> saveAll(List<SapPayrollTransmission> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find a transmission by its unique transmission ID. */
    Optional<SapPayrollTransmission> findByTransmissionId(String transmissionId);

    /** Transmissions for a specific offer, ordered by creation date descending. */
    List<SapPayrollTransmission> findByOfferIdOrderByCreatedAtDesc(String offerId);

    /** Transmissions with a given status. */
    List<SapPayrollTransmission> findByStatus(TransmissionStatus status);

    /** Transmissions with any of the given statuses, ordered by creation date descending. */
    List<SapPayrollTransmission> findByStatusIn(List<TransmissionStatus> statuses);

    /** Retryable transmissions (FAILED/RETRY_PENDING, under max retries, nextRetryAt elapsed). */
    List<SapPayrollTransmission> findRetryable(LocalDateTime now);

    /** Pending transmissions ordered by creation date ascending. */
    List<SapPayrollTransmission> findPending();

    /** Transmitted but stale (transmitted before cutoff), ordered by transmittedAt ascending. */
    List<SapPayrollTransmission> findStaleTransmissions(LocalDateTime cutoff);

    /** Find a transmission by SAP employee number. */
    Optional<SapPayrollTransmission> findBySapEmployeeNumber(String sapEmployeeNumber);

    /** Count transmissions with a given status. */
    long countByStatus(TransmissionStatus status);

    /** Transmissions initiated by a specific user, ordered by creation date descending. */
    List<SapPayrollTransmission> findByInitiatedByOrderByCreatedAtDesc(String userId);
}
