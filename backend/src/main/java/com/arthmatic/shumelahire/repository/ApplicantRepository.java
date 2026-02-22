package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Applicant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
    
    // Find by email
    Optional<Applicant> findByEmail(String email);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Find by name patterns
    @Query("SELECT a FROM Applicant a WHERE " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(a.surname) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(a.email) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))")
    Page<Applicant> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Find by ID/Passport number
    Optional<Applicant> findByIdPassportNumber(String idPassportNumber);
    
    // Count applicants
    long count();
    
    // Find recent applicants
    @Query("SELECT a FROM Applicant a ORDER BY a.createdAt DESC")
    Page<Applicant> findRecent(Pageable pageable);
}