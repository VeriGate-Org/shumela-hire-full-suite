package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicationResponse;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

/**
 * The application record page is titled with {@code applicantName}. The repository returns the
 * applicant as an id-only stub, and the single-record endpoint mapped that stub straight into the
 * response, so every record read "Unknown candidate".
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Application record — the candidate is named")
class ApplicationRecordApplicantNameTest {

    private static final String APPLICANT_ID = "2239e1a8-0000-4000-8000-000000000001";
    private static final String APPLICATION_ID = "55385330-0000-4000-8000-000000000002";

    @Mock private ApplicationDataRepository applicationRepository;
    @Mock private ApplicantDataRepository applicantRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ApplicationService service;

    @Test
    @DisplayName("getApplication hydrates the id-only applicant stub")
    void getApplicationReturnsTheApplicantsName() {
        Applicant stub = new Applicant();
        stub.setId(APPLICANT_ID);

        Application application = new Application();
        application.setId(APPLICATION_ID);
        application.setApplicant(stub);
        application.setStatus(ApplicationStatus.SCREENING);

        Applicant full = new Applicant();
        full.setId(APPLICANT_ID);
        full.setName("Thandi");
        full.setSurname("Molefe");
        full.setEmail("thandi.molefe@example.co.za");

        when(applicationRepository.findById(APPLICATION_ID)).thenReturn(Optional.of(application));
        when(applicantRepository.findById(APPLICANT_ID)).thenReturn(Optional.of(full));

        ApplicationResponse response = service.getApplication(APPLICATION_ID);

        assertEquals("Thandi Molefe", response.getApplicantName());
        assertEquals("thandi.molefe@example.co.za", response.getApplicantEmail());
    }
}
