package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.employee.EmployeeCreateRequest;
import com.arthmatic.shumelahire.dto.employee.EmployeeResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee testEmployee;
    private EmployeeCreateRequest testRequest;

    @BeforeEach
    void setUp() {
        testEmployee = new Employee();
        testEmployee.setId(1L);
        testEmployee.setEmployeeNumber("UTW-2026-0001");
        testEmployee.setFirstName("John");
        testEmployee.setLastName("Doe");
        testEmployee.setEmail("john.doe@company.com");
        testEmployee.setPhone("+27123456789");
        testEmployee.setDepartment("Engineering");
        testEmployee.setJobTitle("Software Developer");
        testEmployee.setStatus(EmployeeStatus.ACTIVE);
        testEmployee.setHireDate(LocalDate.of(2024, 1, 15));
        testEmployee.setCreatedAt(LocalDateTime.now());
        testEmployee.setUpdatedAt(LocalDateTime.now());

        testRequest = new EmployeeCreateRequest();
        testRequest.setFirstName("John");
        testRequest.setLastName("Doe");
        testRequest.setEmail("john.doe@company.com");
        testRequest.setPhone("+27123456789");
        testRequest.setDepartment("Engineering");
        testRequest.setJobTitle("Software Developer");
        testRequest.setHireDate(LocalDate.of(2024, 1, 15));
    }

    @Test
    void createEmployee_ValidRequest_ReturnsEmployeeResponse() {
        when(employeeRepository.existsByEmail(testRequest.getEmail())).thenReturn(false);
        when(employeeRepository.findMaxEmployeeNumberByPrefix(anyString())).thenReturn(null);
        when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);

        EmployeeResponse result = employeeService.createEmployee(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getEmail()).isEqualTo("john.doe@company.com");
        assertThat(result.getDepartment()).isEqualTo("Engineering");
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(auditLogService, times(1)).logApplicantAction(any(), eq("EMPLOYEE_CREATED"), eq("EMPLOYEE"), anyString());
    }

    @Test
    void createEmployee_EmailAlreadyExists_ThrowsIllegalArgumentException() {
        when(employeeRepository.existsByEmail(testRequest.getEmail())).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.createEmployee(testRequest)
        );

        assertThat(exception.getMessage()).contains("Email already exists");
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void updateEmployee_ValidRequest_ReturnsUpdatedResponse() {
        EmployeeCreateRequest updateRequest = new EmployeeCreateRequest();
        updateRequest.setFirstName("Jane");
        updateRequest.setLastName("Smith");
        updateRequest.setEmail("jane.smith@company.com");
        updateRequest.setHireDate(LocalDate.of(2024, 1, 15));
        updateRequest.setDepartment("Marketing");

        Employee updatedEmployee = new Employee();
        updatedEmployee.setId(1L);
        updatedEmployee.setEmployeeNumber("UTW-2026-0001");
        updatedEmployee.setFirstName("Jane");
        updatedEmployee.setLastName("Smith");
        updatedEmployee.setEmail("jane.smith@company.com");
        updatedEmployee.setDepartment("Marketing");
        updatedEmployee.setStatus(EmployeeStatus.ACTIVE);
        updatedEmployee.setHireDate(LocalDate.of(2024, 1, 15));
        updatedEmployee.setCreatedAt(LocalDateTime.now());
        updatedEmployee.setUpdatedAt(LocalDateTime.now());

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(testEmployee));
        when(employeeRepository.existsByEmail("jane.smith@company.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenReturn(updatedEmployee);

        EmployeeResponse result = employeeService.updateEmployee(1L, updateRequest);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Jane");
        assertThat(result.getDepartment()).isEqualTo("Marketing");
        verify(employeeRepository, times(1)).save(any(Employee.class));
    }

    @Test
    void updateEmployee_SelfReporting_ThrowsIllegalArgumentException() {
        testRequest.setReportingManagerId(1L);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(testEmployee));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.updateEmployee(1L, testRequest)
        );

        assertThat(exception.getMessage()).contains("cannot report to themselves");
    }

    @Test
    void getEmployee_ExistingId_ReturnsResponse() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(testEmployee));

        EmployeeResponse result = employeeService.getEmployee(1L);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getEmployeeNumber()).isEqualTo("UTW-2026-0001");
        verify(employeeRepository, times(1)).findById(1L);
    }

    @Test
    void getEmployee_NonExistingId_ThrowsIllegalArgumentException() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.getEmployee(999L)
        );
    }

    @Test
    void searchEmployees_WithSearchTerm_ReturnsFilteredResults() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Employee> page = new PageImpl<>(List.of(testEmployee));

        when(employeeRepository.findBySearchTerm("John", pageable)).thenReturn(page);

        Page<EmployeeResponse> result = employeeService.searchEmployees("John", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getFirstName()).isEqualTo("John");
    }

    @Test
    void searchEmployees_NoSearchTerm_ReturnsAllResults() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Employee> page = new PageImpl<>(List.of(testEmployee));

        when(employeeRepository.findAll(pageable)).thenReturn(page);

        Page<EmployeeResponse> result = employeeService.searchEmployees(null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getDirectReports_ReturnsDirectoryViewResponses() {
        Employee report = new Employee();
        report.setId(2L);
        report.setFirstName("Jane");
        report.setLastName("Smith");
        report.setEmail("jane@company.com");
        report.setDepartment("Engineering");
        report.setJobTitle("Junior Developer");
        report.setStatus(EmployeeStatus.ACTIVE);
        report.setHireDate(LocalDate.now());
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());

        when(employeeRepository.findByReportingManagerId(1L)).thenReturn(List.of(report));

        List<EmployeeResponse> reports = employeeService.getDirectReports(1L);

        assertThat(reports).hasSize(1);
        assertThat(reports.get(0).getFirstName()).isEqualTo("Jane");
    }

    @Test
    void updateStatus_ToTerminated_SetsTerminationFields() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(testEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeResponse result = employeeService.updateStatus(1L, EmployeeStatus.TERMINATED, "Performance");

        assertThat(result.getStatus()).isEqualTo(EmployeeStatus.TERMINATED);
        verify(auditLogService, times(1)).logApplicantAction(any(), eq("STATUS_CHANGED"), eq("EMPLOYEE"), anyString());
    }

    @Test
    void generateEmployeeNumber_FirstEmployee_ReturnsSequence0001() {
        when(employeeRepository.findMaxEmployeeNumberByPrefix(anyString())).thenReturn(null);

        String number = employeeService.generateEmployeeNumber();

        assertThat(number).startsWith("UTW-");
        assertThat(number).endsWith("-0001");
    }

    @Test
    void generateEmployeeNumber_ExistingEmployees_IncrementsSequence() {
        String currentYear = String.valueOf(java.time.Year.now().getValue());
        when(employeeRepository.findMaxEmployeeNumberByPrefix("UTW-" + currentYear + "-%"))
                .thenReturn("UTW-" + currentYear + "-0005");

        String number = employeeService.generateEmployeeNumber();

        assertThat(number).isEqualTo("UTW-" + currentYear + "-0006");
    }

    @Test
    void getDistinctDepartments_ReturnsList() {
        when(employeeRepository.findDistinctDepartments()).thenReturn(Arrays.asList("Engineering", "HR", "Finance"));

        List<String> departments = employeeService.getDistinctDepartments();

        assertThat(departments).hasSize(3);
        assertThat(departments).contains("Engineering", "HR", "Finance");
    }
}
