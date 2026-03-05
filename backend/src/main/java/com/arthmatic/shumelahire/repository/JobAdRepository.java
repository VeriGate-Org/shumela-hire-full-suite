package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobAdRepository extends JpaRepository<JobAd, Long> {
    
    // Find by slug for public access
    Optional<JobAd> findBySlug(String slug);
    
    // Find by status
    List<JobAd> findByStatus(JobAdStatus status);
    Page<JobAd> findByStatus(JobAdStatus status, Pageable pageable);
    
    // Find by channel
    @Query("SELECT j FROM JobAd j WHERE j.channelInternal = true")
    List<JobAd> findByInternalChannel();
    
    @Query("SELECT j FROM JobAd j WHERE j.channelExternal = true")
    List<JobAd> findByExternalChannel();
    
    // Find by requisition
    List<JobAd> findByRequisitionId(Long requisitionId);

    // Find by job posting (for sync)
    Optional<JobAd> findByJobPostingId(Long jobPostingId);
    
    // Search with filters
    @Query("SELECT j FROM JobAd j WHERE " +
           "(:status IS NULL OR j.status = :status) AND " +
           "(:channelInternal IS NULL OR j.channelInternal = :channelInternal) AND " +
           "(:channelExternal IS NULL OR j.channelExternal = :channelExternal) AND " +
           "(:q IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           " LOWER(j.htmlBody) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))")
    Page<JobAd> findWithFilters(
        @Param("status") JobAdStatus status,
        @Param("channelInternal") Boolean channelInternal,
        @Param("channelExternal") Boolean channelExternal,
        @Param("q") String searchQuery,
        Pageable pageable
    );
    
    // Find published ads for external channel that are not expired
    @Query("SELECT j FROM JobAd j WHERE " +
           "j.status = 'PUBLISHED' AND " +
           "j.channelExternal = true AND " +
           "(j.closingDate IS NULL OR j.closingDate >= :currentDate)")
    List<JobAd> findActiveExternalAds(@Param("currentDate") LocalDate currentDate);
    
    // Find published ads for internal channel that are not expired
    @Query("SELECT j FROM JobAd j WHERE " +
           "j.status = 'PUBLISHED' AND " +
           "j.channelInternal = true AND " +
           "(j.closingDate IS NULL OR j.closingDate >= :currentDate)")
    List<JobAd> findActiveInternalAds(@Param("currentDate") LocalDate currentDate);

    // Paginated version for internal job board endpoint
    @Query("SELECT j FROM JobAd j WHERE " +
           "j.status = 'PUBLISHED' AND " +
           "j.channelInternal = true AND " +
           "(j.closingDate IS NULL OR j.closingDate >= :currentDate)")
    Page<JobAd> findActiveInternalAdsPaged(@Param("currentDate") LocalDate currentDate, Pageable pageable);
    
    // Find ads that should be expired
    @Query("SELECT j FROM JobAd j WHERE " +
           "j.status = 'PUBLISHED' AND " +
           "j.closingDate IS NOT NULL AND " +
           "j.closingDate < :currentDate")
    List<JobAd> findAdsToExpire(@Param("currentDate") LocalDate currentDate);
    
    // Update status for expired ads
    @Modifying
    @Query("UPDATE JobAd j SET j.status = 'EXPIRED', j.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE j.status = 'PUBLISHED' AND j.closingDate IS NOT NULL AND j.closingDate < :currentDate")
    int markExpiredAds(@Param("currentDate") LocalDate currentDate);
    
    // Check if slug exists (for uniqueness)
    boolean existsBySlug(String slug);
    
    // Find by created by
    Page<JobAd> findByCreatedBy(String createdBy, Pageable pageable);
    
    // Count by status
    long countByStatus(JobAdStatus status);
    
    // Recent ads
    @Query("SELECT j FROM JobAd j ORDER BY j.createdAt DESC")
    List<JobAd> findRecentAds(Pageable pageable);
}