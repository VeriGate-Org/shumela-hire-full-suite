package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.JobAdTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobAdTemplateRepository extends JpaRepository<JobAdTemplate, Long> {

    List<JobAdTemplate> findByIsArchivedFalseOrderByCreatedAtDesc();

    List<JobAdTemplate> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM JobAdTemplate t WHERE " +
           "(:showArchived = true OR t.isArchived = false) AND " +
           "(:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:employmentType IS NULL OR t.employmentType = :employmentType) AND " +
           "(:location IS NULL OR LOWER(t.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))) AND " +
           "(:createdBy IS NULL OR t.createdBy = :createdBy) " +
           "ORDER BY t.createdAt DESC")
    List<JobAdTemplate> findWithFilters(
            @Param("search") String search,
            @Param("employmentType") String employmentType,
            @Param("location") String location,
            @Param("createdBy") String createdBy,
            @Param("showArchived") boolean showArchived);

    long countByIsArchivedFalse();

    long countByIsArchivedTrue();

    Optional<JobAdTemplate> findFirstByIsArchivedFalseOrderByUsageCountDesc();

    @Query("SELECT t FROM JobAdTemplate t WHERE t.isArchived = false ORDER BY t.createdAt DESC")
    List<JobAdTemplate> findRecentlyCreated();
}
