package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRecommendationRepository extends JpaRepository<SalaryRecommendation, Long> {

    List<SalaryRecommendation> findByStatus(SalaryRecommendationStatus status);

    List<SalaryRecommendation> findByRequestedBy(String requestedBy);

    Optional<SalaryRecommendation> findByRecommendationNumber(String recommendationNumber);

    @Query("SELECT sr FROM TgSalaryRecommendation sr WHERE sr.application.id = :applicationId")
    List<SalaryRecommendation> findByApplicationId(@Param("applicationId") Long applicationId);

    List<SalaryRecommendation> findByOfferId(Long offerId);

    @Query("SELECT sr FROM TgSalaryRecommendation sr WHERE sr.department = :department AND sr.createdAt BETWEEN :startDate AND :endDate")
    List<SalaryRecommendation> findByDepartmentAndDateRange(
            @Param("department") String department,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    List<SalaryRecommendation> findByStatusOrderByCreatedAtDesc(SalaryRecommendationStatus status);
}
