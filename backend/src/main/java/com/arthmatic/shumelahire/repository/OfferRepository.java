package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.entity.OfferType;
import com.arthmatic.shumelahire.entity.NegotiationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    // Basic queries
    List<Offer> findByApplicationId(Long applicationId);
    
    Optional<Offer> findByOfferNumber(String offerNumber);
    
    List<Offer> findByStatus(OfferStatus status);
    
    List<Offer> findByOfferType(OfferType offerType);
    
    List<Offer> findByNegotiationStatus(NegotiationStatus negotiationStatus);
    
    // Status-based queries
    List<Offer> findByStatusIn(List<OfferStatus> statuses);
    
    @Query("SELECT o FROM Offer o WHERE o.status IN :statuses AND o.createdBy = :createdBy")
    List<Offer> findByStatusInAndCreatedBy(@Param("statuses") List<OfferStatus> statuses, @Param("createdBy") Long createdBy);
    
    @Query("SELECT o FROM Offer o WHERE o.status = 'PENDING_APPROVAL' AND o.approvalLevelRequired <= :userApprovalLevel")
    List<Offer> findOffersRequiringApproval(@Param("userApprovalLevel") Integer userApprovalLevel);
    
    @Query("SELECT o FROM Offer o WHERE o.status = 'PENDING_APPROVAL' AND o.baseSalary >= :threshold")
    List<Offer> findHighValueOffersRequiringApproval(@Param("threshold") BigDecimal threshold);
    
    // Expiry and time-based queries
    @Query("SELECT o FROM Offer o WHERE o.offerExpiryDate <= :expiryTime AND o.status IN ('SENT', 'UNDER_NEGOTIATION')")
    List<Offer> findExpiredOffers(@Param("expiryTime") LocalDateTime expiryTime);
    
    @Query("SELECT o FROM Offer o WHERE o.offerExpiryDate BETWEEN :startTime AND :endTime AND o.status IN ('SENT', 'UNDER_NEGOTIATION')")
    List<Offer> findOffersExpiringBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT o FROM Offer o WHERE o.offerSentAt IS NULL AND o.status = 'APPROVED' AND o.createdAt <= :oldestAllowed")
    List<Offer> findStaleApprovedOffers(@Param("oldestAllowed") LocalDateTime oldestAllowed);
    
    // Negotiation tracking
    @Query("SELECT o FROM Offer o WHERE o.negotiationStatus IN ('CANDIDATE_RESPONSE_PENDING', 'COMPANY_RESPONSE_PENDING', 'STALLED') AND o.lastNegotiationAt <= :staleTime")
    List<Offer> findStaleNegotiations(@Param("staleTime") LocalDateTime staleTime);
    
    @Query("SELECT o FROM Offer o WHERE o.negotiationRounds >= :minRounds ORDER BY o.negotiationRounds DESC")
    List<Offer> findHighNegotiationRounds(@Param("minRounds") Integer minRounds);
    
    @Query("SELECT o FROM Offer o WHERE o.negotiationStatus = 'ESCALATED' ORDER BY o.lastNegotiationAt ASC")
    List<Offer> findEscalatedNegotiations();
    
    // Analytics queries
    @Query("SELECT COUNT(o) FROM Offer o WHERE o.status = :status AND o.createdAt BETWEEN :startDate AND :endDate")
    Long countByStatusAndDateRange(@Param("status") OfferStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT o.status, COUNT(o) FROM Offer o WHERE o.createdAt BETWEEN :startDate AND :endDate GROUP BY o.status")
    List<Object[]> getOfferStatusDistribution(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT o.offerType, COUNT(o) FROM Offer o WHERE o.createdAt BETWEEN :startDate AND :endDate GROUP BY o.offerType")
    List<Object[]> getOfferTypeDistribution(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT AVG(o.baseSalary) FROM Offer o WHERE o.status = 'ACCEPTED' AND o.offerType = :offerType AND o.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal getAverageAcceptedSalaryByType(@Param("offerType") OfferType offerType, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT o.department, AVG(o.baseSalary) FROM Offer o WHERE o.status = 'ACCEPTED' AND o.createdAt BETWEEN :startDate AND :endDate GROUP BY o.department")
    List<Object[]> getAverageSalaryByDepartment(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Acceptance rate calculations
    @Query("SELECT " +
           "COUNT(CASE WHEN o.status = 'ACCEPTED' THEN 1 END) as accepted, " +
           "COUNT(CASE WHEN o.status IN ('ACCEPTED', 'DECLINED') THEN 1 END) as total " +
           "FROM Offer o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    Object[] getAcceptanceRateData(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT " +
           "o.department, " +
           "COUNT(CASE WHEN o.status = 'ACCEPTED' THEN 1 END) as accepted, " +
           "COUNT(CASE WHEN o.status IN ('ACCEPTED', 'DECLINED') THEN 1 END) as total " +
           "FROM Offer o WHERE o.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY o.department")
    List<Object[]> getAcceptanceRateByDepartment(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT " +
           "o.offerType, " +
           "COUNT(CASE WHEN o.status = 'ACCEPTED' THEN 1 END) as accepted, " +
           "COUNT(CASE WHEN o.status IN ('ACCEPTED', 'DECLINED') THEN 1 END) as total " +
           "FROM Offer o WHERE o.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY o.offerType")
    List<Object[]> getAcceptanceRateByOfferType(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Time to acceptance/decision metrics (PostgreSQL-compatible EXTRACT)
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (o.accepted_at - o.offer_sent_at)) / 3600) " +
           "FROM offers o WHERE o.status = 'ACCEPTED' AND o.offer_sent_at IS NOT NULL AND o.accepted_at IS NOT NULL " +
           "AND o.created_at BETWEEN :startDate AND :endDate", nativeQuery = true)
    Double getAverageTimeToAcceptanceHours(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(o.accepted_at, o.declined_at) - o.offer_sent_at)) / 3600) " +
           "FROM offers o WHERE o.status IN ('ACCEPTED', 'DECLINED') AND o.offer_sent_at IS NOT NULL " +
           "AND o.created_at BETWEEN :startDate AND :endDate", nativeQuery = true)
    Double getAverageTimeToDecisionHours(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Compensation analysis
    @Query("SELECT MIN(o.baseSalary), MAX(o.baseSalary), AVG(o.baseSalary) " +
           "FROM Offer o WHERE o.status = 'ACCEPTED' AND o.offerType = :offerType " +
           "AND o.createdAt BETWEEN :startDate AND :endDate")
    Object[] getSalaryStatisticsByType(@Param("offerType") OfferType offerType, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT " +
           "CASE " +
           "  WHEN o.baseSalary < :lowThreshold THEN 'LOW' " +
           "  WHEN o.baseSalary >= :lowThreshold AND o.baseSalary < :highThreshold THEN 'MEDIUM' " +
           "  ELSE 'HIGH' " +
           "END as salaryBand, " +
           "COUNT(o) " +
           "FROM Offer o WHERE o.status = 'ACCEPTED' AND o.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY " +
           "CASE " +
           "  WHEN o.baseSalary < :lowThreshold THEN 'LOW' " +
           "  WHEN o.baseSalary >= :lowThreshold AND o.baseSalary < :highThreshold THEN 'MEDIUM' " +
           "  ELSE 'HIGH' " +
           "END")
    List<Object[]> getAcceptedOffersBySalaryBand(@Param("lowThreshold") BigDecimal lowThreshold, 
                                                  @Param("highThreshold") BigDecimal highThreshold,
                                                  @Param("startDate") LocalDateTime startDate, 
                                                  @Param("endDate") LocalDateTime endDate);
    
    // Version and superseding tracking
    @Query("SELECT o FROM Offer o WHERE o.supersededByOfferId IS NULL AND o.application.id = :applicationId ORDER BY o.version DESC")
    List<Offer> findActiveOffersByApplication(@Param("applicationId") Long applicationId);
    
    @Query("SELECT o FROM Offer o WHERE o.supersedesOfferId = :originalOfferId")
    Optional<Offer> findSupersedingOffer(@Param("originalOfferId") Long originalOfferId);
    
    @Query("SELECT o FROM Offer o WHERE o.supersededByOfferId = :supersedingOfferId")
    Optional<Offer> findSupersededOffer(@Param("supersedingOfferId") Long supersedingOfferId);
    
    // Pagination and search
    @Query("SELECT o FROM Offer o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:offerType IS NULL OR o.offerType = :offerType) AND " +
           "(:negotiationStatus IS NULL OR o.negotiationStatus = :negotiationStatus) AND " +
           "(:departmentFilter IS NULL OR LOWER(o.department) LIKE LOWER(CONCAT('%', CAST(:departmentFilter AS string), '%'))) AND " +
           "(:jobTitleFilter IS NULL OR LOWER(o.jobTitle) LIKE LOWER(CONCAT('%', CAST(:jobTitleFilter AS string), '%'))) AND " +
           "(:minSalary IS NULL OR o.baseSalary >= :minSalary) AND " +
           "(:maxSalary IS NULL OR o.baseSalary <= :maxSalary) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate)")
    Page<Offer> searchOffers(@Param("status") OfferStatus status,
                            @Param("offerType") OfferType offerType,
                            @Param("negotiationStatus") NegotiationStatus negotiationStatus,
                            @Param("departmentFilter") String departmentFilter,
                            @Param("jobTitleFilter") String jobTitleFilter,
                            @Param("minSalary") BigDecimal minSalary,
                            @Param("maxSalary") BigDecimal maxSalary,
                            @Param("startDate") LocalDateTime startDate,
                            @Param("endDate") LocalDateTime endDate,
                            Pageable pageable);
    
    // Dashboard queries
    @Query("SELECT COUNT(o) FROM Offer o WHERE o.status = 'PENDING_APPROVAL'")
    Long countPendingApproval();
    
    @Query("SELECT COUNT(o) FROM Offer o WHERE o.status = 'SENT' AND o.offerExpiryDate <= :nearExpiryTime")
    Long countNearExpiry(@Param("nearExpiryTime") LocalDateTime nearExpiryTime);
    
    @Query("SELECT COUNT(o) FROM Offer o WHERE o.negotiationStatus IN ('CANDIDATE_RESPONSE_PENDING', 'COMPANY_RESPONSE_PENDING', 'STALLED')")
    Long countActiveNegotiations();
    
    @Query("SELECT COUNT(o) FROM Offer o WHERE o.status = 'ACCEPTED' AND o.createdAt >= :since")
    Long countRecentAcceptances(@Param("since") LocalDateTime since);
    
    // Performance queries with joins
    @Query("SELECT o FROM Offer o " +
           "JOIN FETCH o.application a " +
           "JOIN FETCH a.applicant ap " +
           "JOIN FETCH a.jobPosting jp " +
           "WHERE o.status IN :statuses")
    List<Offer> findByStatusInWithDetails(@Param("statuses") List<OfferStatus> statuses);
    
    @Query("SELECT o FROM Offer o " +
           "JOIN FETCH o.application a " +
           "JOIN FETCH a.applicant ap " +
           "WHERE o.id = :id")
    Optional<Offer> findByIdWithDetails(@Param("id") Long id);
    
    // Analytics methods
    Long countByOfferSentAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}