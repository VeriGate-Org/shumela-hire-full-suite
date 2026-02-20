package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = com.arthmatic.shumelahire.ShumelaHireApplication.class)
class ApplicationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ApplicationRepository applicationRepository;

    private Applicant testApplicant;
    private JobPosting testJobPosting;
    private Application testApplication;

    @BeforeEach
    void setUp() {
        // TODO: Wire up test data from test database or fixtures
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void whenFindByStatus_thenReturnApplications() {
        // Given
        ApplicationStatus status = ApplicationStatus.SUBMITTED;

        // When
        List<Application> found = applicationRepository.findByStatusOrderBySubmittedAtDesc(status);

        // Then
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getStatus()).isEqualTo(status);
        assertThat(found.get(0).getApplicant().getEmail()).isEqualTo("john.doe@test.com");
    }

    @Test
    void whenFindByStatusWithPagination_thenReturnApplicationsPage() {
        // Given
        ApplicationStatus status = ApplicationStatus.SUBMITTED;
        PageRequest pageRequest = PageRequest.of(0, 10);

        // When
        Page<Application> found = applicationRepository.findByStatus(status, pageRequest);

        // Then
        assertThat(found.getContent()).hasSize(1);
        assertThat(found.getTotalElements()).isEqualTo(1);
        assertThat(found.getContent().get(0).getStatus()).isEqualTo(status);
    }

    @Test
    void whenFindByApplicantId_thenReturnApplications() {
        // Given
        Long applicantId = testApplicant.getId();

        // When
        List<Application> found = applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId);

        // Then
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getApplicant().getId()).isEqualTo(applicantId);
    }

    @Test
    void whenCountByStatus_thenReturnCorrectCount() {
        // Given
        ApplicationStatus status = ApplicationStatus.SUBMITTED;

        // When
        long count = applicationRepository.countByStatus(status);

        // Then
        assertThat(count).isEqualTo(1);
    }

    @Test
    void whenFindRecentApplications_thenReturnApplications() {
        // Given
        LocalDateTime since = LocalDateTime.now().minusHours(1);

        // When
        List<Application> found = applicationRepository.findRecentApplications(since);

        // Then
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getSubmittedAt()).isAfter(since);
    }

    @Test
    void whenSearchApplications_thenReturnMatchingApplications() {
        // Given
        String searchTerm = "john";
        PageRequest pageRequest = PageRequest.of(0, 10);

        // When
        Page<Application> found = applicationRepository.searchApplications(searchTerm, pageRequest);

        // Then
        assertThat(found.getContent()).hasSize(1);
        assertThat(found.getContent().get(0).getApplicant().getName().toLowerCase()).contains(searchTerm.toLowerCase());
    }

    @Test
    void whenFindApplicationsPendingReview_thenReturnApplications() {
        // When
        List<Application> found = applicationRepository.findApplicationsPendingReview();

        // Then
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getStatus()).isIn(ApplicationStatus.SUBMITTED, ApplicationStatus.SCREENING);
    }

    @Test
    void whenGetApplicationStatusCounts_thenReturnCounts() {
        // When
        List<Object[]> statusCounts = applicationRepository.getApplicationStatusCounts();

        // Then
        assertThat(statusCounts).isNotEmpty();
        
        // Find the SUBMITTED status count
        Object[] submittedCount = statusCounts.stream()
            .filter(row -> row[0].equals(ApplicationStatus.SUBMITTED))
            .findFirst()
            .orElse(null);
        
        assertThat(submittedCount).isNotNull();
        assertThat(submittedCount[1]).isEqualTo(1L);
    }

    @Test
    void whenFindByStatusIn_thenReturnApplications() {
        // Given
        List<ApplicationStatus> statuses = List.of(ApplicationStatus.SUBMITTED, ApplicationStatus.SCREENING);

        // When
        List<Application> found = applicationRepository.findByStatusInOrderBySubmittedAtDesc(statuses);

        // Then
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getStatus()).isIn(statuses);
    }

    @Test
    void whenCountByRating_thenReturnCorrectCount() {
        // Given
        Integer rating = 4;

        // When
        Long count = applicationRepository.countByRating(rating);

        // Then
        assertThat(count).isEqualTo(1L);
    }
}
