package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the SalaryRecommendation entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaSalaryRecommendationDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoSalaryRecommendationRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface SalaryRecommendationDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<SalaryRecommendation> findById(String id);

    SalaryRecommendation save(SalaryRecommendation entity);

    List<SalaryRecommendation> saveAll(List<SalaryRecommendation> entities);

    void deleteById(String id);

    boolean existsById(String id);

    /** Return all salary recommendations for the current tenant. */
    List<SalaryRecommendation> findAll();

    // -- Domain-specific queries ----------------------------------------------

    /** Salary recommendations with a given status. */
    List<SalaryRecommendation> findByStatus(SalaryRecommendationStatus status);

    /** Salary recommendations requested by a given user. */
    List<SalaryRecommendation> findByRequestedBy(String requestedBy);

    /** Find a salary recommendation by its unique recommendation number. */
    Optional<SalaryRecommendation> findByRecommendationNumber(String recommendationNumber);

    /** Salary recommendations for a given application. */
    List<SalaryRecommendation> findByApplicationId(String applicationId);

    /** Salary recommendations linked to a given offer. */
    List<SalaryRecommendation> findByOfferId(String offerId);

    /** Salary recommendations by department within a date range. */
    List<SalaryRecommendation> findByDepartmentAndDateRange(String department,
                                                             LocalDateTime startDate,
                                                             LocalDateTime endDate);

    /** Salary recommendations with a given status, newest first. */
    List<SalaryRecommendation> findByStatusOrderByCreatedAtDesc(SalaryRecommendationStatus status);
}
