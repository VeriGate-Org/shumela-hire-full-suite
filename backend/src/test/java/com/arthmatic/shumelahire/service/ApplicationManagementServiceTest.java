package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationManagementServiceTest {

    @Mock
    private ApplicationDataRepository applicationRepository;

    @Mock
    private ApplicantDataRepository applicantRepository;
    
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ApplicationManagementService applicationManagementService;

    private Application mockApplication;
    private JobPosting mockJobPosting;
    private Applicant mockApplicant;

    @BeforeEach
    void setUp() {
        mockApplicant = new Applicant();
        mockApplicant.setId("1");
        mockApplicant.setEmail("john.doe@example.com");
        mockApplicant.setName("John");
        mockApplicant.setSurname("Doe");

        mockJobPosting = new JobPosting();
        mockJobPosting.setId("1");
        mockJobPosting.setTitle("Senior Frontend Developer");
        mockJobPosting.setDepartment("Engineering");

        mockApplication = new Application();
        mockApplication.setId("1");
        mockApplication.setApplicant(mockApplicant);
        mockApplication.setJobPosting(mockJobPosting);
        mockApplication.setJobTitle("Senior Frontend Developer");
        mockApplication.setDepartment("Engineering");
        mockApplication.setStatus(ApplicationStatus.SUBMITTED);
        mockApplication.setPipelineStage(PipelineStage.APPLICATION_RECEIVED);
        mockApplication.setSubmittedAt(LocalDateTime.now());
        mockApplication.setUpdatedAt(LocalDateTime.now());
        mockApplication.setRating(4);
    }

    @Test
    void testSearchApplications() {
        // Given
        List<Application> applications = List.of(mockApplication);
        when(applicationRepository.searchApplicationsFiltered(
            eq("John Doe"), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull()))
            .thenReturn(applications);

        // When
        Page<Application> result = applicationManagementService.searchApplications(
            "John Doe", null, null, null, null, null, null, null,
            null, null, Pageable.unpaged());

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(mockApplication.getId(), result.getContent().get(0).getId());
        verify(applicationRepository).searchApplicationsFiltered(
            eq("John Doe"), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull());
    }

    @Test
    void testBulkUpdateStatus_Success() {
        // Given
        List<String> applicationIds = Arrays.asList("1", "2");
        List<Application> applications = Arrays.asList(mockApplication);
        when(applicationRepository.findAllByIds(applicationIds)).thenReturn(applications);
        when(applicationRepository.save(any(Application.class))).thenReturn(mockApplication);

        // When
        Map<String, Object> result = applicationManagementService.bulkUpdateStatus(
            applicationIds, ApplicationStatus.SCREENING, "Moving to next stage");

        // Then
        assertNotNull(result);
        assertEquals(1, result.get("updatedCount"));
        assertEquals(2, result.get("totalRequested"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertTrue(errors.isEmpty());
        verify(applicationRepository).findAllByIds(applicationIds);
        verify(applicationRepository).save(mockApplication);
        verify(notificationService).notifyStatusChange(mockApplication, ApplicationStatus.SCREENING);
    }

    @Test
    void testBulkAssignPipelineStage() {
        // Given
        List<String> applicationIds = Arrays.asList("1");
        List<Application> applications = List.of(mockApplication);
        when(applicationRepository.findAllByIds(applicationIds)).thenReturn(applications);
        when(applicationRepository.save(any(Application.class))).thenReturn(mockApplication);

        // When
        Map<String, Object> result = applicationManagementService.bulkAssignPipelineStage(
            applicationIds, PipelineStage.INITIAL_SCREENING);

        // Then
        assertNotNull(result);
        assertEquals(1, result.get("updatedCount"));
        assertEquals(1, result.get("totalRequested"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertTrue(errors.isEmpty());
        verify(applicationRepository).findAllByIds(applicationIds);
        verify(applicationRepository).save(mockApplication);
    }

    @Test
    void testBulkRateApplications() {
        // Given
        Map<String, Integer> ratings = new HashMap<>();
        ratings.put("1", 5);
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));
        when(applicationRepository.save(any(Application.class))).thenReturn(mockApplication);

        // When
        Map<String, Object> result = applicationManagementService.bulkRateApplications(ratings);

        // Then
        assertNotNull(result);
        assertEquals(1, result.get("updatedCount"));
        assertEquals(1, result.get("totalRequested"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertTrue(errors.isEmpty());
        verify(applicationRepository).findById("1");
        verify(applicationRepository).save(mockApplication);
    }

    @Test
    void testBulkRateApplications_InvalidRating() {
        // Given
        Map<String, Integer> ratings = new HashMap<>();
        ratings.put("1", 6); // Invalid rating

        // When
        Map<String, Object> result = applicationManagementService.bulkRateApplications(ratings);

        // Then
        assertNotNull(result);
        assertEquals(0, result.get("updatedCount"));
        assertEquals(1, result.get("totalRequested"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertFalse(errors.isEmpty());
        verify(applicationRepository, never()).findById(anyString());
    }

    @Test
    void testBulkAddScreeningNotes() {
        // Given
        List<String> applicationIds = Arrays.asList("1");
        List<Application> applications = List.of(mockApplication);
        when(applicationRepository.findAllByIds(applicationIds)).thenReturn(applications);
        when(applicationRepository.save(any(Application.class))).thenReturn(mockApplication);

        // When
        Map<String, Object> result = applicationManagementService.bulkAddScreeningNotes(
            applicationIds, "Candidate shows strong potential");

        // Then
        assertNotNull(result);
        assertEquals(1, result.get("updatedCount"));
        assertEquals(1, result.get("totalRequested"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertTrue(errors.isEmpty());
        verify(applicationRepository).findAllByIds(applicationIds);
        verify(applicationRepository).save(mockApplication);
    }

    @Test
    void testGetApplicationStatistics() {
        // Given - Mock all possible status counts
        when(applicationRepository.countByStatus(any(ApplicationStatus.class))).thenReturn(2L);
        when(applicationRepository.countByDepartment()).thenReturn(
            Arrays.asList(new Object[]{"Engineering", 15L}, new Object[]{"Marketing", 10L}));
        when(applicationRepository.countBySubmittedAtAfter(any(LocalDateTime.class))).thenReturn(5L);
        when(applicationRepository.countByRating(anyInt())).thenReturn(3L);
        when(applicationRepository.count()).thenReturn(28L);
        when(applicantRepository.count()).thenReturn(25L);

        // When
        Map<String, Object> statistics = applicationManagementService.getApplicationStatistics();

        // Then
        assertNotNull(statistics);
        assertTrue(statistics.containsKey("statusDistribution"));
        assertTrue(statistics.containsKey("departmentDistribution"));
        assertTrue(statistics.containsKey("recentApplications"));
        assertTrue(statistics.containsKey("ratingDistribution"));
        assertTrue(statistics.containsKey("totalApplications"));
        assertTrue(statistics.containsKey("uniqueApplicants"));
        
        // Verify the method was called for each ApplicationStatus enum value
        verify(applicationRepository, times(ApplicationStatus.values().length)).countByStatus(any(ApplicationStatus.class));
    }

    @Test
    void testGetApplicationsRequiringAttention() {
        // Given
        List<ApplicationStatus> activeStatuses = Arrays.asList(
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.SCREENING,
            ApplicationStatus.INTERVIEW_SCHEDULED
        );
        List<Application> stalledApplications = List.of(mockApplication);
        when(applicationRepository.findByStatusInAndUpdatedAtBeforeOrderBySubmittedAtAsc(
            eq(activeStatuses), any(LocalDateTime.class))).thenReturn(stalledApplications);

        // When
        List<Application> result = applicationManagementService.getApplicationsRequiringAttention(7);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(mockApplication.getId(), result.get(0).getId());
        verify(applicationRepository).findByStatusInAndUpdatedAtBeforeOrderBySubmittedAtAsc(
            eq(activeStatuses), any(LocalDateTime.class));
    }

    @Test
    void testExportApplications() {
        // Given
        List<Long> applicationIds = Arrays.asList(1L);
        List<String> stringIds = Arrays.asList("1");
        when(applicationRepository.findAllByIds(stringIds)).thenReturn(List.of(mockApplication));

        // When
        List<Map<String, Object>> result = applicationManagementService.exportApplications(
            applicationIds, null); // null means export all fields

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        Map<String, Object> exportedApp = result.get(0);
        assertTrue(exportedApp.containsKey("id"));
        assertTrue(exportedApp.containsKey("applicantName"));
        assertTrue(exportedApp.containsKey("applicantEmail"));
        assertTrue(exportedApp.containsKey("jobTitle"));
        assertTrue(exportedApp.containsKey("department"));
        assertTrue(exportedApp.containsKey("status"));
        verify(applicationRepository).findAllByIds(stringIds);
    }

    @Test
    void testExportApplications_SpecificFields() {
        // Given
        List<Long> applicationIds = Arrays.asList(1L);
        List<String> stringIds = Arrays.asList("1");
        List<String> fields = Arrays.asList("id", "applicantName", "status");
        when(applicationRepository.findAllByIds(stringIds)).thenReturn(List.of(mockApplication));

        // When
        List<Map<String, Object>> result = applicationManagementService.exportApplications(
            applicationIds, fields);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        Map<String, Object> exportedApp = result.get(0);
        assertTrue(exportedApp.containsKey("id"));
        assertTrue(exportedApp.containsKey("applicantName"));
        assertTrue(exportedApp.containsKey("status"));
        assertFalse(exportedApp.containsKey("department")); // Not requested
        verify(applicationRepository).findAllByIds(stringIds);
    }

    /**
     * Bulk was the way round the rules.
     *
     * <p>The single-candidate path refuses a move that skips stages; bulk wrote the target stage
     * straight onto every selected record, so a recruiter could tick a column of candidates and
     * send them from Application Received to Offer Extended in one action — past every interview,
     * past reference and background checks. The rule and the bypass shipped side by side.</p>
     */
    @Test
    void bulkAssignPipelineStageRefusesAJumpTheSingleCandidatePathWouldRefuse() {
        // Given — John Doe is at Application Received (order 1); Offer Extended is order 13
        List<String> applicationIds = Arrays.asList("1");
        when(applicationRepository.findAllByIds(applicationIds)).thenReturn(List.of(mockApplication));

        // When
        Map<String, Object> result = applicationManagementService.bulkAssignPipelineStage(
            applicationIds, PipelineStage.OFFER_EXTENDED);

        // Then — nothing moved, and the reason names the person and both stages
        assertEquals(0, result.get("updatedCount"));
        assertEquals(1, result.get("totalRequested"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertEquals(1, errors.size());
        assertTrue(errors.get(0).contains("John Doe"), "a bare id tells the reader nothing: " + errors.get(0));
        assertTrue(errors.get(0).contains("Application Received"), errors.get(0));
        assertTrue(errors.get(0).contains("Offer Extended"), errors.get(0));
        assertEquals(PipelineStage.APPLICATION_RECEIVED, mockApplication.getPipelineStage());
        verify(applicationRepository, never()).save(ArgumentMatchers.any(Application.class));
    }

    /**
     * A bulk request is many decisions, not one. Some candidates in a selection may be eligible for
     * the target stage and others not, so the caller has to be told which — reading
     * {@code updatedCount} alone would report a clean success while a candidate sat unmoved.
     */
    @Test
    void bulkAssignPipelineStageMovesTheEligibleAndReportsTheRest() {
        // Given — one candidate mid-pipeline, one already rejected (a terminal stage)
        Applicant second = new Applicant();
        second.setId("2");
        second.setName("Thandi");
        second.setSurname("Nkosi");

        Application rejected = new Application();
        rejected.setId("2");
        rejected.setApplicant(second);
        rejected.setJobPosting(mockJobPosting);
        rejected.setStatus(ApplicationStatus.SUBMITTED);
        rejected.setPipelineStage(PipelineStage.REJECTED);

        mockApplication.setPipelineStage(PipelineStage.FIRST_INTERVIEW);

        List<String> applicationIds = Arrays.asList("1", "2");
        when(applicationRepository.findAllByIds(applicationIds))
            .thenReturn(List.of(mockApplication, rejected));
        when(applicationRepository.save(ArgumentMatchers.any(Application.class))).thenReturn(mockApplication);

        // When
        Map<String, Object> result = applicationManagementService.bulkAssignPipelineStage(
            applicationIds, PipelineStage.TECHNICAL_ASSESSMENT);

        // Then
        assertEquals(1, result.get("updatedCount"));
        assertEquals(PipelineStage.TECHNICAL_ASSESSMENT, mockApplication.getPipelineStage());
        assertEquals(PipelineStage.REJECTED, rejected.getPipelineStage(), "a closed application must not be reopened by a bulk move");
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertEquals(1, errors.size());
        assertTrue(errors.get(0).contains("Thandi Nkosi"), errors.get(0));
        verify(applicationRepository).save(mockApplication);
        verify(applicationRepository, never()).save(rejected);
    }
}
