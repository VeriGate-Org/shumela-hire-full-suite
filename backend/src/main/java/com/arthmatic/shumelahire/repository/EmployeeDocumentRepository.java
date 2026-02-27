package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {

    List<EmployeeDocument> findByEmployeeIdAndIsActiveTrueOrderByCreatedAtDesc(Long employeeId);

    List<EmployeeDocument> findByEmployeeIdAndDocumentTypeAndIsActiveTrue(Long employeeId, EmployeeDocumentType documentType);

    @Query("SELECT d FROM EmployeeDocument d WHERE d.expiryDate IS NOT NULL AND d.expiryDate <= :date AND d.isActive = true")
    List<EmployeeDocument> findExpiringDocuments(@Param("date") LocalDate date);

    @Query("SELECT d FROM EmployeeDocument d WHERE d.employee.id = :employeeId AND d.expiryDate IS NOT NULL AND d.expiryDate <= :date AND d.isActive = true")
    List<EmployeeDocument> findExpiringDocumentsByEmployee(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);

    // Find latest version of a document type for an employee
    @Query("SELECT d FROM EmployeeDocument d WHERE d.employee.id = :employeeId AND d.documentType = :type AND d.isActive = true ORDER BY d.version DESC")
    List<EmployeeDocument> findLatestByEmployeeAndType(@Param("employeeId") Long employeeId, @Param("type") EmployeeDocumentType type);
}
