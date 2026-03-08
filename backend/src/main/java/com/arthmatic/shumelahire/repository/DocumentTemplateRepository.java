package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {

    List<DocumentTemplate> findByTypeAndIsArchivedFalseOrderByCreatedAtDesc(String type);

    List<DocumentTemplate> findByIsArchivedFalseOrderByCreatedAtDesc();

    Optional<DocumentTemplate> findByTypeAndIsDefaultTrue(String type);

    @Query("SELECT t FROM DocumentTemplate t WHERE " +
           "(:showArchived = true OR t.isArchived = false) AND " +
           "(:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:type IS NULL OR t.type = :type) " +
           "ORDER BY t.createdAt DESC")
    List<DocumentTemplate> findWithFilters(
            @Param("search") String search,
            @Param("type") String type,
            @Param("showArchived") boolean showArchived);
}
