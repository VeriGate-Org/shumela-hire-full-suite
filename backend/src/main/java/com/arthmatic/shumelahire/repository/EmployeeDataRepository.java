package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Employee entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaEmployeeDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoEmployeeRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface EmployeeDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Employee> findById(String id);

    Employee save(Employee entity);

    List<Employee> saveAll(List<Employee> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find an employee by email address. */
    Optional<Employee> findByEmail(String email);

    /** Find an employee by employee number. */
    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    /** Check whether an employee with the given email already exists. */
    boolean existsByEmail(String email);

    /** Check whether an employee with the given employee number already exists. */
    boolean existsByEmployeeNumber(String employeeNumber);

    /** Search employees by a free-text term across name, email, and employee number. */
    CursorPage<Employee> findBySearchTerm(String searchTerm, String cursor, int pageSize);

    /** Find employees by status with pagination. */
    CursorPage<Employee> findByStatus(EmployeeStatus status, String cursor, int pageSize);

    /** Find employees by department with pagination. */
    CursorPage<Employee> findByDepartment(String department, String cursor, int pageSize);

    /** Find employees with optional filters on department, status, job title, and location. */
    CursorPage<Employee> findByFilters(String department, EmployeeStatus status,
                                        String jobTitle, String location,
                                        String cursor, int pageSize);

    /** Find active employees ordered by last name, first name (directory listing). */
    CursorPage<Employee> findActiveDirectory(String cursor, int pageSize);

    /** Find direct reports for a given manager. */
    List<Employee> findByReportingManagerId(String managerId);

    /** Count active employees grouped by department. Returns list of [department, count]. */
    List<Object[]> countByDepartment();

    /** Find the employee created from a given applicant. */
    Optional<Employee> findByApplicantId(String applicantId);

    /** Find the max employee number matching a given prefix (for sequence generation). */
    String findMaxEmployeeNumberByPrefix(String prefix);

    /** Return distinct department names across all employees. */
    List<String> findDistinctDepartments();

    /** Return distinct location values across all employees. */
    List<String> findDistinctLocations();

    /** Return distinct job title values across all employees. */
    List<String> findDistinctJobTitles();

    /** Return all employees for the current tenant. */
    List<Employee> findAll();
}
