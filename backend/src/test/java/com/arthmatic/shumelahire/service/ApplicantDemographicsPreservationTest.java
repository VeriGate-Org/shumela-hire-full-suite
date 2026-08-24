package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicantCreateRequest;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.security.DemographicsAccess;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * The hazard the redaction itself created.
 *
 * <p>Withholding demographics means a recruiter now receives nulls for those four fields. The
 * update path set them straight from the request, so saving a profile form would have written
 * those nulls over the applicant's real answers — <b>the fix would have destroyed the data it was
 * protecting</b>. These pin that it does not.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApplicantDemographicsPreservationTest {

    @Mock private ApplicantDataRepository applicantRepository;
    @Mock private DocumentDataRepository documentRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private FileStorageService fileStorageService;
    @Mock private UserDataRepository userRepository;
    @Mock private ApplicationDataRepository applicationRepository;
    @Mock private DemographicsAccess demographicsAccess;

    private ApplicantService service;
    private Applicant stored;

    @BeforeEach
    void setUp() {
        service = new ApplicantService(applicantRepository, documentRepository, auditLogService,
                fileStorageService, userRepository, applicationRepository, demographicsAccess);

        stored = new Applicant();
        stored.setId("a1");
        stored.setName("Thabo");
        stored.setSurname("Nkosi");
        stored.setEmail("t.nkosi@example.com");
        stored.setRace("African");
        stored.setGender("Male");
        stored.setDisabilityStatus("None");
        stored.setCitizenshipStatus("South African");
        stored.setDemographicsConsent(true);

        when(applicantRepository.findById("a1")).thenReturn(Optional.of(stored));
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(c -> c.getArgument(0));
    }

    /** What a redacted profile form sends back: everything else filled, demographics empty. */
    private static ApplicantCreateRequest blankDemographics() {
        ApplicantCreateRequest request = new ApplicantCreateRequest();
        request.setName("Thabo");
        request.setSurname("Nkosi");
        request.setEmail("t.nkosi@example.com");
        return request;
    }

    @Test
    @DisplayName("An update from someone who could not see demographics leaves them intact")
    void redactedViewerCannotWipeDemographics() {
        when(demographicsAccess.mayView(any(), any())).thenReturn(false);

        service.updateApplicant("a1", blankDemographics(), null);

        assertEquals("African", stored.getRace());
        assertEquals("Male", stored.getGender());
        assertEquals("None", stored.getDisabilityStatus());
        assertEquals("South African", stored.getCitizenshipStatus());
        assertEquals(true, stored.getDemographicsConsent());
    }

    @Test
    @DisplayName("A viewer who could see them may still change them")
    void permittedViewerMayChangeDemographics() {
        when(demographicsAccess.mayView(any(), any())).thenReturn(true);

        ApplicantCreateRequest request = blankDemographics();
        request.setRace("Coloured");
        request.setGender("Female");

        service.updateApplicant("a1", request, null);

        assertEquals("Coloured", stored.getRace());
        assertEquals("Female", stored.getGender());
    }

    @Test
    @DisplayName("A permitted viewer may also clear them — that is a real edit, not a redaction")
    void permittedViewerMayClearDemographics() {
        // Distinguishing this from the case above is the whole point: identical request bodies,
        // opposite outcomes, decided by whether the viewer was shown the data.
        when(demographicsAccess.mayView(any(), any())).thenReturn(true);

        service.updateApplicant("a1", blankDemographics(), null);

        assertEquals(null, stored.getRace());
        assertEquals(null, stored.getGender());
    }
}
