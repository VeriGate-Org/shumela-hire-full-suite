package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.EmployeeItem;
import com.arthmatic.shumelahire.service.DataEncryptionService;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Employee entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     EMPLOYEE#{id}
 *   GSI1PK: EMP_STATUS#{tenantId}#{status}       GSI1SK: EMPLOYEE#{lastName}#{firstName}
 *   GSI2PK: EMP_EMAIL#{tenantId}#{email}          GSI2SK: EMPLOYEE#{id}
 *   GSI3PK: EMP_DEPT#{tenantId}#{department}      GSI3SK: EMPLOYEE#{lastName}#{firstName}
 *   GSI4PK: EMP_NUM#{tenantId}#{employeeNumber}   GSI4SK: EMPLOYEE#{id}
 *   GSI5PK: EMP_MGR#{tenantId}#{reportingManagerId} GSI5SK: EMPLOYEE#{lastName}#{firstName}
 *   GSI6PK: EMP_HIRE#{tenantId}                   GSI6SK: #{hireDate}#{id}
 * </pre>
 */
@Repository
public class DynamoEmployeeRepository extends DynamoRepository<EmployeeItem, Employee>
        implements EmployeeDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final DataEncryptionService encryptionService;

    public DynamoEmployeeRepository(DynamoDbClient dynamoDbClient,
                                     DynamoDbEnhancedClient enhancedClient,
                                     String dynamoDbTableName,
                                     DataEncryptionService encryptionService) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, EmployeeItem.class);
        this.encryptionService = encryptionService;
    }

    @Override
    protected String entityType() {
        return "EMPLOYEE";
    }

    // ── EmployeeDataRepository implementation ────────────────────────────────

    @Override
    public Optional<Employee> findByEmail(String email) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI2", "EMP_EMAIL#" + tenantId + "#" + email);
    }

    @Override
    public Optional<Employee> findByEmployeeNumber(String employeeNumber) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "EMP_NUM#" + tenantId + "#" + employeeNumber);
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByEmployeeNumber(String employeeNumber) {
        return findByEmployeeNumber(employeeNumber).isPresent();
    }

    @Override
    public CursorPage<Employee> findBySearchTerm(String searchTerm, String cursor, int pageSize) {
        // DynamoDB does not support full-text search natively; scan + filter
        String lowerTerm = searchTerm.toLowerCase();
        List<Employee> all = findAll().stream()
                .filter(e -> containsIgnoreCase(e.getFirstName(), lowerTerm)
                        || containsIgnoreCase(e.getLastName(), lowerTerm)
                        || containsIgnoreCase(e.getEmail(), lowerTerm)
                        || containsIgnoreCase(e.getEmployeeNumber(), lowerTerm))
                .collect(Collectors.toList());
        return paginateInMemory(all, cursor, pageSize);
    }

    @Override
    public CursorPage<Employee> findByStatus(EmployeeStatus status, String cursor, int pageSize) {
        String tenantId = currentTenantId();
        return queryGsi("GSI1", "EMP_STATUS#" + tenantId + "#" + status.name(),
                "EMPLOYEE#", cursor, pageSize);
    }

    @Override
    public CursorPage<Employee> findByDepartment(String department, String cursor, int pageSize) {
        String tenantId = currentTenantId();
        return queryGsi("GSI3", "EMP_DEPT#" + tenantId + "#" + department,
                "EMPLOYEE#", cursor, pageSize);
    }

    @Override
    public CursorPage<Employee> findByFilters(String department, EmployeeStatus status,
                                               String jobTitle, String location,
                                               String cursor, int pageSize) {
        // Multi-filter requires scan + filter since DynamoDB cannot query across GSIs
        List<Employee> all = findAll().stream()
                .filter(e -> department == null || department.equals(e.getDepartment()))
                .filter(e -> status == null || status.equals(e.getStatus()))
                .filter(e -> jobTitle == null || containsIgnoreCase(e.getJobTitle(), jobTitle.toLowerCase()))
                .filter(e -> location == null || location.equals(e.getLocation()))
                .collect(Collectors.toList());
        return paginateInMemory(all, cursor, pageSize);
    }

    @Override
    public CursorPage<Employee> findActiveDirectory(String cursor, int pageSize) {
        String tenantId = currentTenantId();
        return queryGsi("GSI1", "EMP_STATUS#" + tenantId + "#ACTIVE",
                "EMPLOYEE#", cursor, pageSize);
    }

    @Override
    public List<Employee> findByReportingManagerId(String managerId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI5", "EMP_MGR#" + tenantId + "#" + managerId);
    }

    @Override
    public List<Object[]> countByDepartment() {
        // Aggregate in memory — employees per tenant are bounded
        Map<String, Long> counts = findAll().stream()
                .filter(e -> EmployeeStatus.ACTIVE.equals(e.getStatus()))
                .filter(e -> e.getDepartment() != null)
                .collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));
        return counts.entrySet().stream()
                .map(entry -> new Object[]{entry.getKey(), entry.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Employee> findByApplicantId(String applicantId) {
        return findAll().stream()
                .filter(e -> applicantId.equals(
                        e.getApplicant() != null ? e.getApplicant().getId() : null))
                .findFirst();
    }

    @Override
    public String findMaxEmployeeNumberByPrefix(String prefix) {
        return findAll().stream()
                .map(Employee::getEmployeeNumber)
                .filter(num -> num != null && num.startsWith(prefix.replace("%", "")))
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    @Override
    public List<String> findDistinctDepartments() {
        return findAll().stream()
                .map(Employee::getDepartment)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> findDistinctLocations() {
        return findAll().stream()
                .map(Employee::getLocation)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> findDistinctJobTitles() {
        return findAll().stream()
                .map(Employee::getJobTitle)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    // ── Conversion: EmployeeItem <-> Employee ────────────────────────────────

    @Override
    protected Employee toEntity(EmployeeItem item) {
        var emp = new Employee();
        if (item.getId() != null) {
            emp.setId(item.getId());
        }
        emp.setTenantId(item.getTenantId());
        emp.setEmployeeNumber(item.getEmployeeNumber());
        emp.setTitle(item.getTitle());
        emp.setFirstName(item.getFirstName());
        emp.setLastName(item.getLastName());
        emp.setPreferredName(item.getPreferredName());
        emp.setEmail(item.getEmail());
        emp.setPersonalEmail(encryptionService.decryptPII(item.getPersonalEmail()));
        emp.setPhone(item.getPhone());
        emp.setMobilePhone(encryptionService.decryptPII(item.getMobilePhone()));
        if (item.getDateOfBirth() != null) {
            emp.setDateOfBirth(LocalDate.parse(item.getDateOfBirth(), DATE_FMT));
        }
        emp.setGender(item.getGender());
        emp.setRace(item.getRace());
        emp.setDisabilityStatus(item.getDisabilityStatus());
        emp.setCitizenshipStatus(item.getCitizenshipStatus());
        emp.setNationality(item.getNationality());
        emp.setMaritalStatus(item.getMaritalStatus());
        emp.setIdNumber(encryptionService.decryptPII(item.getIdNumber()));
        emp.setTaxNumber(encryptionService.decryptPII(item.getTaxNumber()));
        emp.setBankAccountNumber(encryptionService.decryptPII(item.getBankAccountNumber()));
        emp.setBankName(item.getBankName());
        emp.setBankBranchCode(item.getBankBranchCode());
        emp.setPhysicalAddress(item.getPhysicalAddress());
        emp.setPostalAddress(item.getPostalAddress());
        emp.setCity(item.getCity());
        emp.setProvince(item.getProvince());
        emp.setPostalCode(item.getPostalCode());
        emp.setCountry(item.getCountry());
        if (item.getStatus() != null) {
            emp.setStatus(EmployeeStatus.valueOf(item.getStatus()));
        }
        emp.setDepartment(item.getDepartment());
        emp.setDivision(item.getDivision());
        emp.setJobTitle(item.getJobTitle());
        emp.setJobGrade(item.getJobGrade());
        emp.setEmploymentType(item.getEmploymentType());
        if (item.getHireDate() != null) {
            emp.setHireDate(LocalDate.parse(item.getHireDate(), DATE_FMT));
        }
        if (item.getProbationEndDate() != null) {
            emp.setProbationEndDate(LocalDate.parse(item.getProbationEndDate(), DATE_FMT));
        }
        if (item.getTerminationDate() != null) {
            emp.setTerminationDate(LocalDate.parse(item.getTerminationDate(), DATE_FMT));
        }
        emp.setTerminationReason(item.getTerminationReason());
        if (item.getContractEndDate() != null) {
            emp.setContractEndDate(LocalDate.parse(item.getContractEndDate(), DATE_FMT));
        }
        // reportingManager is a relationship — store only the ID in DynamoDB;
        // the service layer can hydrate if needed
        if (item.getReportingManagerId() != null) {
            var mgr = new Employee();
            mgr.setId(item.getReportingManagerId());
            emp.setReportingManager(mgr);
        }
        emp.setCostCentre(item.getCostCentre());
        emp.setLocation(item.getLocation());
        emp.setSite(item.getSite());
        // applicant is a relationship — store only the ID
        if (item.getApplicantId() != null) {
            var applicant = new com.arthmatic.shumelahire.entity.Applicant();
            applicant.setId(item.getApplicantId());
            emp.setApplicant(applicant);
        }
        emp.setProfilePhotoUrl(item.getProfilePhotoUrl());
        emp.setEmergencyContactName(item.getEmergencyContactName());
        emp.setEmergencyContactPhone(item.getEmergencyContactPhone());
        emp.setEmergencyContactRelationship(item.getEmergencyContactRelationship());
        emp.setDemographicsConsent(item.getDemographicsConsent());
        if (item.getDemographicsConsentDate() != null) {
            emp.setDemographicsConsentDate(LocalDateTime.parse(item.getDemographicsConsentDate(), ISO_FMT));
        }
        if (item.getCreatedAt() != null) {
            emp.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            emp.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return emp;
    }

    @Override
    protected EmployeeItem toItem(Employee entity) {
        var item = new EmployeeItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("EMPLOYEE#" + id);

        // GSI1: Status index, sorted by last name
        item.setGsi1pk("EMP_STATUS#" + tenantId + "#" + (entity.getStatus() != null ? entity.getStatus().name() : "ACTIVE"));
        item.setGsi1sk("EMPLOYEE#" + nullSafe(entity.getLastName()) + "#" + nullSafe(entity.getFirstName()));

        // GSI2: Email unique lookup
        item.setGsi2pk("EMP_EMAIL#" + tenantId + "#" + entity.getEmail());
        item.setGsi2sk("EMPLOYEE#" + id);

        // GSI3: Department index
        item.setGsi3pk("EMP_DEPT#" + tenantId + "#" + nullSafe(entity.getDepartment()));
        item.setGsi3sk("EMPLOYEE#" + nullSafe(entity.getLastName()) + "#" + nullSafe(entity.getFirstName()));

        // GSI4: Employee number unique constraint
        item.setGsi4pk("EMP_NUM#" + tenantId + "#" + entity.getEmployeeNumber());
        item.setGsi4sk("EMPLOYEE#" + id);

        // GSI5: Manager lookup
        String mgrId = entity.getReportingManager() != null && entity.getReportingManager().getId() != null
                ? entity.getReportingManager().getId() : "NONE";
        item.setGsi5pk("EMP_MGR#" + tenantId + "#" + mgrId);
        item.setGsi5sk("EMPLOYEE#" + nullSafe(entity.getLastName()) + "#" + nullSafe(entity.getFirstName()));

        // GSI6: Hire date range
        item.setGsi6pk("EMP_HIRE#" + tenantId);
        item.setGsi6sk(entity.getHireDate() != null ? entity.getHireDate().format(DATE_FMT) + "#" + id : "#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeNumber(entity.getEmployeeNumber());
        item.setTitle(entity.getTitle());
        item.setFirstName(entity.getFirstName());
        item.setLastName(entity.getLastName());
        item.setPreferredName(entity.getPreferredName());
        item.setEmail(entity.getEmail());
        item.setPersonalEmail(encryptionService.encryptPII(entity.getPersonalEmail()));
        item.setPhone(entity.getPhone());
        item.setMobilePhone(encryptionService.encryptPII(entity.getMobilePhone()));
        if (entity.getDateOfBirth() != null) {
            item.setDateOfBirth(entity.getDateOfBirth().format(DATE_FMT));
        }
        item.setGender(entity.getGender());
        item.setRace(entity.getRace());
        item.setDisabilityStatus(entity.getDisabilityStatus());
        item.setCitizenshipStatus(entity.getCitizenshipStatus());
        item.setNationality(entity.getNationality());
        item.setMaritalStatus(entity.getMaritalStatus());
        item.setIdNumber(encryptionService.encryptPII(entity.getIdNumber()));
        item.setTaxNumber(encryptionService.encryptPII(entity.getTaxNumber()));
        item.setBankAccountNumber(encryptionService.encryptPII(entity.getBankAccountNumber()));
        item.setBankName(entity.getBankName());
        item.setBankBranchCode(entity.getBankBranchCode());
        item.setPhysicalAddress(entity.getPhysicalAddress());
        item.setPostalAddress(entity.getPostalAddress());
        item.setCity(entity.getCity());
        item.setProvince(entity.getProvince());
        item.setPostalCode(entity.getPostalCode());
        item.setCountry(entity.getCountry());
        item.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        item.setDepartment(entity.getDepartment());
        item.setDivision(entity.getDivision());
        item.setJobTitle(entity.getJobTitle());
        item.setJobGrade(entity.getJobGrade());
        item.setEmploymentType(entity.getEmploymentType());
        if (entity.getHireDate() != null) {
            item.setHireDate(entity.getHireDate().format(DATE_FMT));
        }
        if (entity.getProbationEndDate() != null) {
            item.setProbationEndDate(entity.getProbationEndDate().format(DATE_FMT));
        }
        if (entity.getTerminationDate() != null) {
            item.setTerminationDate(entity.getTerminationDate().format(DATE_FMT));
        }
        item.setTerminationReason(entity.getTerminationReason());
        if (entity.getContractEndDate() != null) {
            item.setContractEndDate(entity.getContractEndDate().format(DATE_FMT));
        }
        if (entity.getReportingManager() != null && entity.getReportingManager().getId() != null) {
            item.setReportingManagerId(entity.getReportingManager().getId());
        }
        item.setCostCentre(entity.getCostCentre());
        item.setLocation(entity.getLocation());
        item.setSite(entity.getSite());
        if (entity.getApplicant() != null && entity.getApplicant().getId() != null) {
            item.setApplicantId(entity.getApplicant().getId());
        }
        item.setProfilePhotoUrl(entity.getProfilePhotoUrl());
        item.setEmergencyContactName(entity.getEmergencyContactName());
        item.setEmergencyContactPhone(entity.getEmergencyContactPhone());
        item.setEmergencyContactRelationship(entity.getEmergencyContactRelationship());
        item.setDemographicsConsent(entity.getDemographicsConsent());
        if (entity.getDemographicsConsentDate() != null) {
            item.setDemographicsConsentDate(entity.getDemographicsConsentDate().format(ISO_FMT));
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static boolean containsIgnoreCase(String value, String lowerTerm) {
        return value != null && value.toLowerCase().contains(lowerTerm);
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
    }

    /**
     * In-memory pagination for queries that cannot use DynamoDB GSIs.
     */
    private CursorPage<Employee> paginateInMemory(List<Employee> all, String cursor, int pageSize) {
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try {
                offset = Integer.parseInt(cursor);
            } catch (NumberFormatException ignored) {
                // invalid cursor, start from beginning
            }
        }
        int end = Math.min(offset + pageSize, all.size());
        List<Employee> page = offset < all.size() ? all.subList(offset, end) : List.of();
        boolean hasMore = end < all.size();
        String nextCursor = hasMore ? String.valueOf(end) : null;
        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) all.size());
    }
}
