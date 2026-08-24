package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicantApplicationSummary;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApplicantApplicationSummaryBatchTest {

    @Mock private ApplicantDataRepository applicantRepository;
    @Mock private DocumentDataRepository documentRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private FileStorageService fileStorageService;
    @Mock private UserDataRepository userRepository;
    @Mock private ApplicationDataRepository applicationRepository;

    private ApplicantService service;

    @BeforeEach
    void setUp() {
        service = new ApplicantService(applicantRepository, documentRepository, auditLogService,
                fileStorageService, userRepository, applicationRepository);
    }

    private static Application application(String id, ApplicationStatus status) {
        Application application = new Application();
        application.setId(id);
        application.setJobTitle("Investment Analyst");
        application.setStatus(status);
        application.setSubmittedAt(LocalDateTime.of(2026, 8, 1, 9, 0));
        return application;
    }

    @Test
    @DisplayName("Every requested id appears in the response, including one with no applications")
    void everyRequestedIdIsAnswered() {
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc("a"))
                .thenReturn(List.of(application("app1", ApplicationStatus.SCREENING)));
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc("b"))
                .thenReturn(Collections.emptyList());

        Map<String, ApplicantApplicationSummary> result =
                service.getApplicationSummaries(List.of("a", "b"));

        assertEquals(2, result.size(), "a caller must be able to look up every id it asked about");
        assertEquals(1, result.get("a").getTotal());
        assertEquals(0, result.get("b").getTotal(),
                "no applications is a zeroed summary, not a missing key");
    }

    @Test
    @DisplayName("Duplicate ids are read once, not once per occurrence")
    void duplicatesAreCollapsed() {
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc("a"))
                .thenReturn(List.of(application("app1", ApplicationStatus.HIRED)));

        Map<String, ApplicantApplicationSummary> result =
                service.getApplicationSummaries(List.of("a", "a", "a"));

        assertEquals(1, result.size());
        verify(applicationRepository, times(1)).findByApplicantIdOrderBySubmittedAtDesc("a");
    }

    @Test
    @DisplayName("Null and blank ids are dropped rather than queried")
    void blankIdsAreDropped() {
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc("a"))
                .thenReturn(Collections.emptyList());

        List<String> ids = new ArrayList<>();
        ids.add("a");
        ids.add(null);
        ids.add("   ");

        Map<String, ApplicantApplicationSummary> result = service.getApplicationSummaries(ids);

        assertEquals(1, result.size());
        verify(applicationRepository, times(1)).findByApplicantIdOrderBySubmittedAtDesc(anyString());
    }

    @Test
    @DisplayName("An empty or null request reads nothing at all")
    void emptyRequestDoesNoWork() {
        assertTrue(service.getApplicationSummaries(List.of()).isEmpty());
        assertTrue(service.getApplicationSummaries(null).isEmpty());
        verifyNoInteractions(applicationRepository);
    }

    @Test
    @DisplayName("Over the batch cap is rejected, not silently truncated")
    void oversizedBatchIsRejected() {
        List<String> tooMany = IntStream.rangeClosed(0, ApplicantService.MAX_SUMMARY_BATCH)
                .mapToObj(i -> "applicant-" + i)
                .toList();

        assertEquals(ApplicantService.MAX_SUMMARY_BATCH + 1, tooMany.size());

        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class,
                () -> service.getApplicationSummaries(tooMany));

        assertTrue(thrown.getMessage().contains(String.valueOf(ApplicantService.MAX_SUMMARY_BATCH)),
                "the error must say what the limit is");
        verifyNoInteractions(applicationRepository);
    }

    @Test
    @DisplayName("Exactly the cap is allowed")
    void batchAtTheCapIsAllowed() {
        List<String> atCap = IntStream.range(0, ApplicantService.MAX_SUMMARY_BATCH)
                .mapToObj(i -> "applicant-" + i)
                .toList();
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(anyString()))
                .thenReturn(Collections.emptyList());

        Map<String, ApplicantApplicationSummary> result = service.getApplicationSummaries(atCap);

        assertEquals(ApplicantService.MAX_SUMMARY_BATCH, result.size());
    }

    @Test
    @DisplayName("Duplicates are collapsed before the cap is applied")
    void duplicatesDoNotCountTowardTheCap() {
        List<String> withDuplicates = new ArrayList<>();
        for (int i = 0; i < ApplicantService.MAX_SUMMARY_BATCH + 40; i++) {
            withDuplicates.add("applicant-" + (i % 10));
        }
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(anyString()))
                .thenReturn(Collections.emptyList());

        Map<String, ApplicantApplicationSummary> result =
                service.getApplicationSummaries(withDuplicates);

        assertEquals(10, result.size(),
                "140 ids naming 10 applicants is a request for 10, and must not be rejected");
    }

    @Test
    @DisplayName("The batch does not verify applicant existence — one read per id, not two")
    void batchDoesNotVerifyExistence() {
        when(applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(anyString()))
                .thenReturn(Collections.emptyList());

        service.getApplicationSummaries(List.of("a", "b", "c"));

        verifyNoInteractions(applicantRepository);
        verify(applicationRepository, times(3)).findByApplicantIdOrderBySubmittedAtDesc(anyString());
    }
}
