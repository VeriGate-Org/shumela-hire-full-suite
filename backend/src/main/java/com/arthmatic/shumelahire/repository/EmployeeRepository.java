package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    boolean existsByEmail(String email);

    boolean existsByEmployeeNumber(String employeeNumber);

    @Query("SELECT e FROM Employee e WHERE " +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) OR " +
           "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))")
    Page<Employee> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    Page<Employee> findByStatus(EmployeeStatus status, Pageable pageable);

    Page<Employee> findByDepartment(String department, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:department IS NULL OR e.department = :department) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:jobTitle IS NULL OR LOWER(e.jobTitle) LIKE LOWER(CONCAT('%', CAST(:jobTitle AS string), '%'))) AND " +
           "(:location IS NULL OR e.location = :location)")
    Page<Employee> findByFilters(
            @Param("department") String department,
            @Param("status") EmployeeStatus status,
            @Param("jobTitle") String jobTitle,
            @Param("location") String location,
            Pageable pageable);

    // Directory query - limited fields for listing
    @Query("SELECT e FROM Employee e WHERE e.status = 'ACTIVE' ORDER BY e.lastName, e.firstName")
    Page<Employee> findActiveDirectory(Pageable pageable);

    // Org chart - find direct reports
    List<Employee> findByReportingManagerId(Long managerId);

    // Count by department
    @Query("SELECT e.department, COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE' GROUP BY e.department")
    List<Object[]> countByDepartment();

    // Find by applicant ID
    Optional<Employee> findByApplicantId(Long applicantId);

    // Employee number sequence - get max numeric part
    @Query("SELECT MAX(e.employeeNumber) FROM Employee e WHERE e.employeeNumber LIKE :prefix")
    String findMaxEmployeeNumberByPrefix(@Param("prefix") String prefix);

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL ORDER BY e.department")
    List<String> findDistinctDepartments();

    @Query("SELECT DISTINCT e.location FROM Employee e WHERE e.location IS NOT NULL ORDER BY e.location")
    List<String> findDistinctLocations();

    @Query("SELECT DISTINCT e.jobTitle FROM Employee e WHERE e.jobTitle IS NOT NULL ORDER BY e.jobTitle")
    List<String> findDistinctJobTitles();
}
