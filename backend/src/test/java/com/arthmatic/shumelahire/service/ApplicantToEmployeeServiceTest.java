package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.employee.ApplicantToEmployeeRequest;
import com.arthmatic.shumelahire.dto.employee.EmployeeResponse;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.EmploymentEventDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicantToEmployeeServiceTest {

    @Mock
    private ApplicantDataRepository applicantRepository;

    @Mock
    private EmployeeDataRepository employeeRepository;

    @Mock
    private EmploymentEventDataRepository eventRepository;

    @Mock
    private EmployeeService employeeService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ApplicantToEmployeeService service;

    private Applicant testApplicant;
    private ApplicantToEmployeeRequest testRequest;

    @BeforeEach
    void setUp() {
        testApplicant = new Applicant();
        testApplicant.setId("1");
        testApplicant.setName("John");
        testApplicant.setSurname("Doe");
        testApplicant.setEmail("john.doe@example.com");
        testApplicant.setPhone("+27123456789");
        testApplicant.setIdPassportNumber("9001015800080");
        testApplicant.setAddress("123 Main St");
        testApplicant.setCreatedAt(LocalDateTime.now());
        testApplicant.setUpdatedAt(LocalDateTime.now());

        testRequest = new ApplicantToEmployeeRequest();
        testRequest.setApplicantId("1");
        testRequest.setHireDate(LocalDate.of(2026, 3, 1));
        testRequest.setDepartment("Engineering");
        testRequest.setJobTitle("Software Developer");
        testRequest.setJobGrade("C3");
        testRequest.setLocation("Johannesburg");
    }

    @Test
    void convertApplicantToEmployee_ValidRequest_CreatesEmployeeWithApplicantData() {
        Employee savedEmployee = new Employee();
        savedEmployee.setId("1");
        savedEmployee.setEmployeeNumber("UTW-2026-0001");
        savedEmployee.setFirstName("John");
        savedEmployee.setLastName("Doe");
        savedEmployee.setEmail("john.doe@example.com");
        savedEmployee.setDepartment("Engineering");
        savedEmployee.setJobTitle("Software Developer");
        savedEmployee.setStatus(EmployeeStatus.ACTIVE);
        savedEmployee.setHireDate(LocalDate.of(2026, 3, 1));
        savedEmployee.setApplicant(testApplicant);
        savedEmployee.setCreatedAt(LocalDateTime.now());
        savedEmployee.setUpdatedAt(LocalDateTime.now());

        when(applicantRepository.findById("1")).thenReturn(Optional.of(testApplicant));
        when(employeeRepository.findByApplicantId("1")).thenReturn(Optional.empty());
        when(employeeService.generateEmployeeNumber()).thenReturn("UTW-2026-0001");
        when(employeeRepository.save(any(Employee.class))).thenReturn(savedEmployee);
        when(eventRepository.save(any(EmploymentEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeResponse result = service.convertApplicantToEmployee(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getEmployeeNumber()).isEqualTo("UTW-2026-0001");
        assertThat(result.getDepartment()).isEqualTo("Engineering");
        assertThat(result.getApplicantId()).isEqualTo("1");

        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(eventRepository, times(1)).save(any(EmploymentEvent.class));
        verify(auditLogService, times(1)).logApplicantAction(any(), eq("APPLICANT_CONVERTED"), eq("EMPLOYEE"), anyString());
    }

    @Test
    void convertApplicantToEmployee_ApplicantNotFound_ThrowsException() {
        when(applicantRepository.findById("999")).thenReturn(Optional.empty());
        testRequest.setApplicantId("999");

        assertThrows(
                IllegalArgumentException.class,
                () -> service.convertApplicantToEmployee(testRequest)
        );

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void convertApplicantToEmployee_AlreadyConverted_ThrowsException() {
        when(applicantRepository.findById("1")).thenReturn(Optional.of(testApplicant));
        when(employeeRepository.findByApplicantId("1")).thenReturn(Optional.of(new Employee()));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.convertApplicantToEmployee(testRequest)
        );

        assertThat(exception.getMessage()).contains("already converted");
        verify(employeeRepository, never()).save(any(Employee.class));
    }
}
