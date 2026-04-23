package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.LifecycleEvent;
import com.arthmatic.shumelahire.dto.RecruitmentLifecycle;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.InterviewDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.SalaryRecommendationDataRepository;
import com.arthmatic.shumelahire.repository.PipelineTransitionDataRepository;
import com.arthmatic.shumelahire.repository.AuditLogDataRepository;
import com.arthmatic.shumelahire.repository.JobAdDataRepository;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecruitmentLifecycleServiceTest {

    @Mock private ApplicationDataRepository applicationRepository;
    @Mock private InterviewDataRepository interviewRepository;
    @Mock private OfferDataRepository offerRepository;
    @Mock private SalaryRecommendationDataRepository salaryRecommendationRepository;
    @Mock private PipelineTransitionDataRepository pipelineTransitionRepository;
    @Mock private AuditLogDataRepository auditLogRepository;
    @Mock private JobAdDataRepository jobAdRepository;
    @Mock private RequisitionDataRepository requisitionRepository;
    @Mock private BackgroundCheckDataRepository backgroundCheckRepository;

    @InjectMocks
    private RecruitmentLifecycleService service;

    private Application mockApplication;
    private Applicant mockApplicant;
    private JobPosting mockJobPosting;

    @BeforeEach
    void setUp() {
        mockApplicant = new Applicant();
        mockApplicant.setId("10");
        mockApplicant.setName("Jane");
        mockApplicant.setSurname("Doe");

        mockJobPosting = new JobPosting();
        mockJobPosting.setId("20");
        mockJobPosting.setTitle("Senior Developer");
        mockJobPosting.setDepartment("Engineering");
        mockJobPosting.setCreatedAt(LocalDateTime.of(2026, 1, 1, 9, 0));
        mockJobPosting.setPublishedAt(LocalDateTime.of(2026, 1, 5, 10, 0));

        mockApplication = new Application();
        mockApplication.setId("1");
        mockApplication.setApplicant(mockApplicant);
        mockApplication.setJobPosting(mockJobPosting);
        mockApplication.setSubmittedAt(LocalDateTime.of(2026, 1, 10, 14, 30));
        mockApplication.setPipelineStage(PipelineStage.FIRST_INTERVIEW);
        mockApplication.setPipelineStageEnteredAt(LocalDateTime.of(2026, 1, 15, 9, 0));
    }

    @Test
    void testGetByApplicationId_BasicLifecycle() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));
        when(interviewRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(offerRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(salaryRecommendationRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(pipelineTransitionRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("APPLICATION", "1")).thenReturn(Collections.emptyList());

        // When
        RecruitmentLifecycle lifecycle = service.getByApplicationId("1");

        // Then
        assertNotNull(lifecycle);
        assertEquals("1", lifecycle.getApplicationId());
        assertEquals("Jane Doe", lifecycle.getApplicantName());
        assertEquals("Senior Developer", lifecycle.getJobTitle());
        assertEquals("Engineering", lifecycle.getDepartment());
        assertEquals("FIRST_INTERVIEW", lifecycle.getCurrentStage());
        assertNotNull(lifecycle.getTimeline());
        assertTrue(lifecycle.getTotalEvents() > 0); // At least application events
    }

    @Test
    void testGetByApplicationId_FullLifecycle() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));

        // Interviews
        Interview interview1 = new Interview();
        interview1.setId("100");
        interview1.setTitle("Technical Interview");
        interview1.setType(InterviewType.VIDEO);
        interview1.setRound(InterviewRound.TECHNICAL);
        interview1.setStatus(InterviewStatus.COMPLETED);
        interview1.setScheduledAt(LocalDateTime.of(2026, 1, 20, 10, 0));
        interview1.setCreatedAt(LocalDateTime.of(2026, 1, 16, 9, 0));
        interview1.setCompletedAt(LocalDateTime.of(2026, 1, 20, 11, 0));
        interview1.setDurationMinutes(60);
        interview1.setInterviewerName("Tech Lead");
        interview1.setRecommendation(InterviewRecommendation.HIRE);
        interview1.setRating(4);

        when(interviewRepository.findByApplicationId("1")).thenReturn(List.of(interview1));

        // Offer
        Offer offer = new Offer();
        offer.setId("200");
        offer.setOfferNumber("OFF-2026-001");
        offer.setJobTitle("Senior Developer");
        offer.setBaseSalary(new BigDecimal("750000"));
        offer.setCurrency("ZAR");
        offer.setStatus(OfferStatus.SENT);
        offer.setCreatedAt(LocalDateTime.of(2026, 1, 22, 14, 0));
        offer.setOfferSentAt(LocalDateTime.of(2026, 1, 23, 9, 0));

        when(offerRepository.findByApplicationId("1")).thenReturn(List.of(offer));

        // Pipeline transitions
        PipelineTransition pt1 = new PipelineTransition();
        pt1.setId("300");
        pt1.setFromStage(PipelineStage.APPLICATION_RECEIVED);
        pt1.setToStage(PipelineStage.INITIAL_SCREENING);
        pt1.setTransitionType(TransitionType.PROGRESSION);
        pt1.setCreatedAt(LocalDateTime.of(2026, 1, 12, 9, 0));
        pt1.setEffectiveAt(LocalDateTime.of(2026, 1, 12, 9, 0));
        pt1.setCreatedBy("42");

        PipelineTransition pt2 = new PipelineTransition();
        pt2.setId("301");
        pt2.setFromStage(PipelineStage.INITIAL_SCREENING);
        pt2.setToStage(PipelineStage.FIRST_INTERVIEW);
        pt2.setTransitionType(TransitionType.PROGRESSION);
        pt2.setCreatedAt(LocalDateTime.of(2026, 1, 15, 9, 0));
        pt2.setEffectiveAt(LocalDateTime.of(2026, 1, 15, 9, 0));
        pt2.setCreatedBy("42");
        pt2.setDurationInPreviousStageHours(72L);

        when(pipelineTransitionRepository.findByApplicationIdOrderByCreatedAtDesc("1"))
                .thenReturn(List.of(pt2, pt1));

        // Salary recommendations
        when(salaryRecommendationRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());

        // Background checks
        when(backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());

        // Audit logs
        AuditLog log1 = new AuditLog();
        log1.setId("400");
        log1.setAction("VIEW_APPLICATION");
        log1.setUserId("42");
        log1.setDetails("Viewed application details");
        log1.setTimestamp(LocalDateTime.of(2026, 1, 11, 10, 0));

        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("APPLICATION", "1"))
                .thenReturn(List.of(log1));

        // When
        RecruitmentLifecycle lifecycle = service.getByApplicationId("1");

        // Then
        assertNotNull(lifecycle);
        assertEquals("1", lifecycle.getApplicationId());
        assertEquals("Jane Doe", lifecycle.getApplicantName());

        // Timeline should be chronologically sorted
        List<LifecycleEvent> timeline = lifecycle.getTimeline();
        assertFalse(timeline.isEmpty());

        for (int i = 1; i < timeline.size(); i++) {
            LocalDateTime prev = timeline.get(i - 1).getTimestamp();
            LocalDateTime curr = timeline.get(i).getTimestamp();
            if (prev != null && curr != null) {
                assertTrue(prev.compareTo(curr) <= 0,
                        "Events should be sorted chronologically: " + prev + " <= " + curr);
            }
        }

        // Verify entity types are represented
        Set<String> entityTypes = new HashSet<>();
        for (LifecycleEvent e : timeline) {
            entityTypes.add(e.getEntityType());
        }
        assertTrue(entityTypes.contains("APPLICATION"));
        assertTrue(entityTypes.contains("INTERVIEW"));
        assertTrue(entityTypes.contains("OFFER"));
        assertTrue(entityTypes.contains("PIPELINE"));
        assertTrue(entityTypes.contains("AUDIT"));

        // Verify counts
        assertTrue(lifecycle.getInterviewCount() >= 1);
        assertTrue(lifecycle.getOfferCount() >= 1);
        assertTrue(lifecycle.getStageTransitionCount() >= 2);
        assertTrue(lifecycle.getTotalEvents() >= 5);

        // Verify duration
        assertNotNull(lifecycle.getStartDate());
        assertNotNull(lifecycle.getEndDate());
        assertNotNull(lifecycle.getTotalDurationHours());
    }

    @Test
    void testGetByApplicationId_WithBackgroundCheck() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));
        when(interviewRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(offerRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(salaryRecommendationRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(pipelineTransitionRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("APPLICATION", "1")).thenReturn(Collections.emptyList());

        BackgroundCheck bc = new BackgroundCheck();
        bc.setId("500");
        bc.setReferenceId("DA-ABC123");
        bc.setProvider("dots-africa");
        bc.setCheckTypes("[\"ID_VERIFICATION\",\"CRIMINAL_CHECK\"]");
        bc.setStatus(BackgroundCheckStatus.COMPLETED);
        bc.setOverallResult(BackgroundCheckResult.CLEAR);
        bc.setCreatedAt(LocalDateTime.of(2026, 1, 25, 9, 0));
        bc.setCompletedAt(LocalDateTime.of(2026, 1, 28, 14, 0));

        when(backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(List.of(bc));

        // When
        RecruitmentLifecycle lifecycle = service.getByApplicationId("1");

        // Then
        List<LifecycleEvent> bgCheckEvents = lifecycle.getTimeline().stream()
                .filter(e -> "BACKGROUND_CHECK".equals(e.getEntityType()))
                .toList();
        assertEquals(2, bgCheckEvents.size()); // INITIATED + COMPLETED

        LifecycleEvent completedEvent = bgCheckEvents.stream()
                .filter(e -> "COMPLETED".equals(e.getEventType()))
                .findFirst()
                .orElse(null);
        assertNotNull(completedEvent);
        assertTrue(completedEvent.getDescription().contains("Clear"));
    }

    @Test
    void testGetByApplicationId_NotFound() {
        when(applicationRepository.findById("999")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getByApplicationId("999"));
    }

    @Test
    void testGetEventsByApplicationId() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));
        when(interviewRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(offerRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(salaryRecommendationRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(pipelineTransitionRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("APPLICATION", "1")).thenReturn(Collections.emptyList());

        // When
        List<LifecycleEvent> events = service.getEventsByApplicationId("1");

        // Then
        assertNotNull(events);
        assertFalse(events.isEmpty());
    }

    @Test
    void testLifecycleEventColorAndIconMapping() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));

        Interview interview = new Interview();
        interview.setId("100");
        interview.setTitle("Phone Screen");
        interview.setCreatedAt(LocalDateTime.of(2026, 1, 16, 9, 0));
        interview.setScheduledAt(LocalDateTime.of(2026, 1, 18, 10, 0));
        interview.setDurationMinutes(30);
        when(interviewRepository.findByApplicationId("1")).thenReturn(List.of(interview));

        when(offerRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(salaryRecommendationRepository.findByApplicationId("1")).thenReturn(Collections.emptyList());
        when(pipelineTransitionRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc("1")).thenReturn(Collections.emptyList());
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("APPLICATION", "1")).thenReturn(Collections.emptyList());

        // When
        RecruitmentLifecycle lifecycle = service.getByApplicationId("1");

        // Then
        for (LifecycleEvent event : lifecycle.getTimeline()) {
            assertNotNull(event.getIcon(), "Icon should be set for " + event.getEntityType());
            assertNotNull(event.getColorClass(), "Color class should be set for " + event.getEntityType());
        }
    }
}
