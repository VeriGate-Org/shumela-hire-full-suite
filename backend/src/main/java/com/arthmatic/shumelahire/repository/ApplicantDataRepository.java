package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Applicant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Applicant entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaApplicantDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoApplicantRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface ApplicantDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Applicant> findById(String id);

    Applicant save(Applicant entity);

    List<Applicant> saveAll(List<Applicant> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find an applicant by their unique email address. */
    Optional<Applicant> findByEmail(String email);

    /** Check whether an applicant with the given email already exists. */
    boolean existsByEmail(String email);

    /** Search applicants by name, surname, or email (paginated). */
    CursorPage<Applicant> findBySearchTerm(String searchTerm, String cursor, int pageSize);

    /** Find an applicant by ID/Passport number. */
    Optional<Applicant> findByIdPassportNumber(String idPassportNumber);

    /** All applicants for the current tenant. */
    List<Applicant> findAll();

    /** All applicants (paginated with Spring Data Page). */
    Page<Applicant> findAll(Pageable pageable);

    /** Search applicants by name, surname, or email (paginated with Spring Data Page). */
    Page<Applicant> findBySearchTerm(String searchTerm, Pageable pageable);

    /** Count all applicants. */
    long count();

    /** Find recent applicants (paginated, ordered by createdAt DESC). */
    CursorPage<Applicant> findRecent(String cursor, int pageSize);
}
