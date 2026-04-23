package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.dto.employee.EmployeeCreateRequest;
import com.arthmatic.shumelahire.dto.employee.EmployeeResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);
    public static final String EMPLOYEES_CACHE = "employees";

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @CacheEvict(value = EMPLOYEES_CACHE, allEntries = true)
    public EmployeeResponse createEmployee(EmployeeCreateRequest request) {
        logger.info("Creating employee: {} {}", request.getFirstName(), request.getLastName());

        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        Employee employee = new Employee();
        mapRequestToEntity(request, employee);
        employee.setEmployeeNumber(generateEmployeeNumber());
        employee.setStatus(EmployeeStatus.ACTIVE);

        if (request.getReportingManagerId() != null) {
            Employee manager = findEmployeeById(request.getReportingManagerId());
            employee.setReportingManager(manager);
        }

        if (request.getDemographicsConsent() != null && request.getDemographicsConsent()) {
            employee.setDemographicsConsent(true);
            employee.setDemographicsConsentDate(LocalDateTime.now());
        }

        Employee saved = employeeRepository.save(employee);

        auditLogService.logApplicantAction(saved.getId(), "EMPLOYEE_CREATED", "EMPLOYEE", saved.getFullName());
        logger.info("Employee created: {} ({})", saved.getFullName(), saved.getEmployeeNumber());

        return EmployeeResponse.fromEntity(saved);
    }

    @CacheEvict(value = EMPLOYEES_CACHE, allEntries = true)
    public EmployeeResponse updateEmployee(String id, EmployeeCreateRequest request) {
        logger.info("Updating employee: {}", id);

        Employee employee = findEmployeeById(id);

        if (!employee.getEmail().equals(request.getEmail()) &&
            employeeRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        mapRequestToEntity(request, employee);

        if (request.getReportingManagerId() != null) {
            if (request.getReportingManagerId().equals(id)) {
                throw new IllegalArgumentException("Employee cannot report to themselves");
            }
            Employee manager = findEmployeeById(request.getReportingManagerId());
            employee.setReportingManager(manager);
        } else {
            employee.setReportingManager(null);
        }

        Employee saved = employeeRepository.save(employee);

        auditLogService.logApplicantAction(saved.getId(), "EMPLOYEE_UPDATED", "EMPLOYEE", saved.getFullName());
        logger.info("Employee updated: {}", saved.getEmployeeNumber());

        return EmployeeResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = EMPLOYEES_CACHE, key = "#id")
    public EmployeeResponse getEmployee(String id) {
        Employee employee = findEmployeeById(id);
        return EmployeeResponse.fromEntity(employee);
    }

    @Transactional(readOnly = true)
    public CursorPage<EmployeeResponse> searchEmployees(String searchTerm, String cursor, int pageSize) {
        CursorPage<Employee> employees;
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            employees = employeeRepository.findBySearchTerm(searchTerm, cursor, pageSize);
        } else {
            employees = employeeRepository.findActiveDirectory(cursor, pageSize);
        }
        List<EmployeeResponse> content = employees.content().stream()
                .map(EmployeeResponse::fromEntity)
                .collect(Collectors.toList());
        return new CursorPage<>(content, employees.nextCursor(), employees.hasMore(),
                employees.size(), employees.totalElements());
    }

    @Transactional(readOnly = true)
    public CursorPage<EmployeeResponse> filterEmployees(String department, EmployeeStatus status,
                                                         String jobTitle, String location,
                                                         String cursor, int pageSize) {
        CursorPage<Employee> employees = employeeRepository.findByFilters(department, status, jobTitle, location, cursor, pageSize);
        List<EmployeeResponse> content = employees.content().stream()
                .map(EmployeeResponse::fromEntity)
                .collect(Collectors.toList());
        return new CursorPage<>(content, employees.nextCursor(), employees.hasMore(),
                employees.size(), employees.totalElements());
    }

    @Transactional(readOnly = true)
    public CursorPage<EmployeeResponse> getDirectory(String cursor, int pageSize) {
        CursorPage<Employee> employees = employeeRepository.findActiveDirectory(cursor, pageSize);
        List<EmployeeResponse> content = employees.content().stream()
                .map(EmployeeResponse::directoryView)
                .collect(Collectors.toList());
        return new CursorPage<>(content, employees.nextCursor(), employees.hasMore(),
                employees.size(), employees.totalElements());
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getDirectReports(String managerId) {
        List<Employee> reports = employeeRepository.findByReportingManagerId(managerId);
        return reports.stream().map(EmployeeResponse::directoryView).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getDepartmentCounts() {
        List<Object[]> counts = employeeRepository.countByDepartment();
        return counts.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctDepartments() {
        return employeeRepository.findDistinctDepartments();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctLocations() {
        return employeeRepository.findDistinctLocations();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctJobTitles() {
        return employeeRepository.findDistinctJobTitles();
    }

    @CacheEvict(value = EMPLOYEES_CACHE, allEntries = true)
    public EmployeeResponse updateStatus(String id, EmployeeStatus status, String reason) {
        Employee employee = findEmployeeById(id);
        EmployeeStatus previousStatus = employee.getStatus();
        employee.setStatus(status);

        if (status == EmployeeStatus.TERMINATED || status == EmployeeStatus.RESIGNED || status == EmployeeStatus.RETIRED) {
            employee.setTerminationDate(LocalDate.now());
            employee.setTerminationReason(reason);
        }

        Employee saved = employeeRepository.save(employee);

        auditLogService.logApplicantAction(saved.getId(), "STATUS_CHANGED", "EMPLOYEE",
                previousStatus + " -> " + status);

        return EmployeeResponse.fromEntity(saved);
    }

    public Employee findEmployeeById(String id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + id));
    }

    String generateEmployeeNumber() {
        String prefix = "UTW-" + Year.now().getValue() + "-";
        String maxNumber = employeeRepository.findMaxEmployeeNumberByPrefix(prefix + "%");

        int nextSeq = 1;
        if (maxNumber != null) {
            String seqPart = maxNumber.substring(prefix.length());
            try {
                nextSeq = Integer.parseInt(seqPart) + 1;
            } catch (NumberFormatException e) {
                logger.warn("Could not parse employee number sequence: {}", maxNumber);
            }
        }

        return prefix + String.format("%04d", nextSeq);
    }

    private void mapRequestToEntity(EmployeeCreateRequest request, Employee employee) {
        employee.setTitle(request.getTitle());
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPreferredName(request.getPreferredName());
        employee.setEmail(request.getEmail());
        employee.setPersonalEmail(request.getPersonalEmail());
        employee.setPhone(request.getPhone());
        employee.setMobilePhone(request.getMobilePhone());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setRace(request.getRace());
        employee.setDisabilityStatus(request.getDisabilityStatus());
        employee.setCitizenshipStatus(request.getCitizenshipStatus());
        employee.setNationality(request.getNationality());
        employee.setMaritalStatus(request.getMaritalStatus());
        employee.setIdNumber(request.getIdNumber());
        employee.setTaxNumber(request.getTaxNumber());
        employee.setBankAccountNumber(request.getBankAccountNumber());
        employee.setBankName(request.getBankName());
        employee.setBankBranchCode(request.getBankBranchCode());
        employee.setPhysicalAddress(request.getPhysicalAddress());
        employee.setPostalAddress(request.getPostalAddress());
        employee.setCity(request.getCity());
        employee.setProvince(request.getProvince());
        employee.setPostalCode(request.getPostalCode());
        employee.setCountry(request.getCountry());
        employee.setDepartment(request.getDepartment());
        employee.setDivision(request.getDivision());
        employee.setJobTitle(request.getJobTitle());
        employee.setJobGrade(request.getJobGrade());
        employee.setEmploymentType(request.getEmploymentType());
        employee.setHireDate(request.getHireDate());
        employee.setProbationEndDate(request.getProbationEndDate());
        employee.setContractEndDate(request.getContractEndDate());
        employee.setCostCentre(request.getCostCentre());
        employee.setLocation(request.getLocation());
        employee.setSite(request.getSite());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
        employee.setEmergencyContactRelationship(request.getEmergencyContactRelationship());
    }
}
