package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.dto.ApplicantCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicantResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class ApplicantServiceTest {

    @Mock
    private ApplicantRepository applicantRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private ApplicantService applicantService;

    private Applicant testApplicant;
    private ApplicantCreateRequest testRequest;

    @BeforeEach
    void setUp() {
        // Set up test applicant
        testApplicant = new Applicant();
        testApplicant.setId(1L);
        testApplicant.setName("John");
        testApplicant.setSurname("Doe");
        testApplicant.setEmail("john.doe@example.com");
        testApplicant.setPhone("+1234567890");
        testApplicant.setIdPassportNumber("ID123456");
        testApplicant.setAddress("123 Main St, San Francisco, CA");
        testApplicant.setEducation("{\"degree\": \"Computer Science\", \"university\": \"MIT\"}");
        testApplicant.setExperience("{\"years\": 5, \"companies\": [\"Google\", \"Microsoft\"]}");
        testApplicant.setSkills("[\"Java\", \"Spring Boot\", \"React\"]");
        testApplicant.setCreatedAt(LocalDateTime.now());
        testApplicant.setUpdatedAt(LocalDateTime.now());

        // Set up test request
        testRequest = new ApplicantCreateRequest();
        testRequest.setName("John");
        testRequest.setSurname("Doe");
        testRequest.setEmail("john.doe@example.com");
        testRequest.setPhone("+1234567890");
        testRequest.setIdPassportNumber("ID123456");
        testRequest.setAddress("123 Main St, San Francisco, CA");
        testRequest.setEducation("{\"degree\": \"Computer Science\", \"university\": \"MIT\"}");
        testRequest.setExperience("{\"years\": 5, \"companies\": [\"Google\", \"Microsoft\"]}");
        testRequest.setSkills("[\"Java\", \"Spring Boot\", \"React\"]");
    }

    @Test
    void createApplicant_ValidRequest_ReturnsApplicantResponse() {
        // Given
        when(applicantRepository.existsByEmail(testRequest.getEmail())).thenReturn(false);
        when(applicantRepository.save(any(Applicant.class))).thenReturn(testApplicant);

        // When
        ApplicantResponse result = applicantService.createApplicant(testRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("John");
        assertThat(result.getSurname()).isEqualTo("Doe");
        assertThat(result.getEmail()).isEqualTo("john.doe@example.com");
        verify(applicantRepository, times(1)).existsByEmail(testRequest.getEmail());
        verify(applicantRepository, times(1)).save(any(Applicant.class));
        verify(auditLogService, times(1)).logApplicantAction(1L, "CREATED", "APPLICANT", "John Doe");
    }

    @Test
    void createApplicant_EmailAlreadyExists_ThrowsIllegalArgumentException() {
        // Given
        when(applicantRepository.existsByEmail(testRequest.getEmail())).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> applicantService.createApplicant(testRequest)
        );

        assertThat(exception.getMessage()).contains("Email already exists");
        verify(applicantRepository, times(1)).existsByEmail(testRequest.getEmail());
        verify(applicantRepository, never()).save(any(Applicant.class));
    }

    @Test
    void updateApplicant_ValidRequest_ReturnsUpdatedApplicantResponse() {
        // Given
        Long applicantId = 1L;
        ApplicantCreateRequest updateRequest = new ApplicantCreateRequest();
        updateRequest.setName("Jane");
        updateRequest.setSurname("Smith");
        updateRequest.setEmail("jane.smith@example.com");
        updateRequest.setPhone("+0987654321");
        updateRequest.setIdPassportNumber("ID654321");
        updateRequest.setAddress("456 Oak Ave, Los Angeles, CA");
        updateRequest.setEducation("{\"degree\": \"Software Engineering\", \"university\": \"Stanford\"}");
        updateRequest.setExperience("{\"years\": 7, \"companies\": [\"Apple\", \"Netflix\"]}");
        updateRequest.setSkills("[\"Python\", \"Django\", \"Vue.js\"]");

        Applicant updatedApplicant = new Applicant();
        updatedApplicant.setId(applicantId);
        updatedApplicant.setName("Jane");
        updatedApplicant.setSurname("Smith");
        updatedApplicant.setEmail("jane.smith@example.com");

        when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
        when(applicantRepository.existsByEmail(updateRequest.getEmail())).thenReturn(false);
        when(applicantRepository.save(any(Applicant.class))).thenReturn(updatedApplicant);

        // When
        ApplicantResponse result = applicantService.updateApplicant(applicantId, updateRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Jane");
        assertThat(result.getSurname()).isEqualTo("Smith");
        assertThat(result.getEmail()).isEqualTo("jane.smith@example.com");
        verify(applicantRepository, times(1)).findById(applicantId);
        verify(applicantRepository, times(1)).save(any(Applicant.class));
        verify(auditLogService, times(1)).logApplicantAction(applicantId, "UPDATED", "APPLICANT", "Jane Smith");
    }

    @Test
    void updateApplicant_EmailConflict_ThrowsIllegalArgumentException() {
        // Given
        Long applicantId = 1L;
        ApplicantCreateRequest updateRequest = new ApplicantCreateRequest();
        updateRequest.setName("Jane");
        updateRequest.setSurname("Smith");
        updateRequest.setEmail("existing.email@example.com");

        when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
        when(applicantRepository.existsByEmail(updateRequest.getEmail())).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> applicantService.updateApplicant(applicantId, updateRequest)
        );

        assertThat(exception.getMessage()).contains("Email already exists");
        verify(applicantRepository, times(1)).findById(applicantId);
        verify(applicantRepository, times(1)).existsByEmail(updateRequest.getEmail());
        verify(applicantRepository, never()).save(any(Applicant.class));
    }

    @Test
    void getApplicant_ExistingId_ReturnsApplicantResponse() {
        // Given
        Long applicantId = 1L;
        when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));

        // When
        ApplicantResponse result = applicantService.getApplicant(applicantId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("John");
        assertThat(result.getSurname()).isEqualTo("Doe");
        assertThat(result.getEmail()).isEqualTo("john.doe@example.com");
        verify(applicantRepository, times(1)).findById(applicantId);
    }

    @Test
    void findApplicantById_NonExistingId_ThrowsRuntimeException() {
        // Given
        Long nonExistingId = 999L;
        when(applicantRepository.findById(nonExistingId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(
                RuntimeException.class,
                () -> applicantService.getApplicant(nonExistingId)
        );

        verify(applicantRepository, times(1)).findById(nonExistingId);
    }

    @Test
    void validateApplicantData_ValidData_PassesValidation() {
        // Given
        ApplicantCreateRequest validRequest = new ApplicantCreateRequest();
        validRequest.setName("John");
        validRequest.setSurname("Doe");
        validRequest.setEmail("valid.email@example.com");

        // When & Then
        // This test ensures that valid data doesn't throw validation errors
        when(applicantRepository.existsByEmail(validRequest.getEmail())).thenReturn(false);
        when(applicantRepository.save(any(Applicant.class))).thenReturn(testApplicant);

        ApplicantResponse result = applicantService.createApplicant(validRequest);
        assertThat(result).isNotNull();
    }

    @Test
    void createApplicant_MinimalValidRequest_Success() {
        // Given
        ApplicantCreateRequest minimalRequest = new ApplicantCreateRequest();
        minimalRequest.setName("Jane");
        minimalRequest.setSurname("Doe");
        minimalRequest.setEmail("jane.minimal@example.com");

        when(applicantRepository.existsByEmail(minimalRequest.getEmail())).thenReturn(false);
        when(applicantRepository.save(any(Applicant.class))).thenReturn(testApplicant);

        // When
        ApplicantResponse result = applicantService.createApplicant(minimalRequest);

        // Then
        assertThat(result).isNotNull();
        verify(applicantRepository, times(1)).existsByEmail(minimalRequest.getEmail());
        verify(applicantRepository, times(1)).save(any(Applicant.class));
        verify(auditLogService, times(1)).logApplicantAction(any(), anyString(), anyString(), anyString());
    }
}
