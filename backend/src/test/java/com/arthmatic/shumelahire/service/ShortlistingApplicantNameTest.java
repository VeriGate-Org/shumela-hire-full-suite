package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.ShortlistScore;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.ShortlistScoreDataRepository;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.arthmatic.shumelahire.service.ai.features.CvScreeningAiService;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The candidate's <em>name</em> must survive scoring, not only their skills.
 *
 * <p>{@link ShortlistingHydrationTest} guards the scoring half of this defect: a stubbed applicant
 * scored zero on three of five dimensions. This guards the half that reached the screen. Scoring
 * hydrated the applicant into a local variable and then attached the <em>original</em> application
 * — still holding the id-only stub — to the score. The shortlist table renders
 * {@code `${applicant.name} ${applicant.surname}`} off exactly that object, so all forty-two rows
 * read <b>"null null"</b> while the scores beside them were correct.</p>
 *
 * <p>Neither the regression suite, the hazard walk nor the gate verification caught it, because
 * none of them renders that table. It was found by reading a screenshot.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Shortlisting — the candidate is named, not \"null null\"")
class ShortlistingApplicantNameTest {

    private static final String APPLICANT_ID = "a1b2c3d4-0000-4000-8000-000000000001";
    private static final String APPLICATION_ID = "b2c3d4e5-0000-4000-8000-000000000002";

    @Mock private ShortlistScoreDataRepository shortlistScoreRepository;
    @Mock private ApplicationDataRepository applicationRepository;
    @Mock private JobPostingDataRepository jobPostingRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;
    @Mock private DocumentDataRepository documentRepository;
    @Mock private ApplicantDataRepository applicantRepository;
    @Mock private CvScreeningAiService cvScreeningAiService;
    @Mock private AiService aiService;

    @InjectMocks
    private ShortlistingService service;

    /** Exactly what {@code DynamoApplicationRepository.toEntity} produces: an id and nothing else. */
    private static Applicant stub() {
        Applicant a = new Applicant();
        a.setId(APPLICANT_ID);
        return a;
    }

    private static Applicant full() {
        Applicant a = new Applicant();
        a.setId(APPLICANT_ID);
        a.setName("Lerato");
        a.setSurname("Dlamini");
        a.setEmail("lerato.dlamini@example.co.za");
        return a;
    }

    private static Application applicationWithStub() {
        Application app = new Application();
        app.setId(APPLICATION_ID);
        app.setApplicant(stub());
        return app;
    }

    @Test
    @DisplayName("The score carries a named applicant, not the stub it was scored from")
    void scoreCarriesNamedApplicant() {
        Application application = applicationWithStub();
        JobPosting posting = new JobPosting();

        when(shortlistScoreRepository.findByApplicationId(APPLICATION_ID)).thenReturn(Optional.empty());
        when(applicantRepository.findById(APPLICANT_ID)).thenReturn(Optional.of(full()));
        when(shortlistScoreRepository.save(any(ShortlistScore.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ShortlistScore score = service.calculateScore(application, posting, false);

        Applicant onScore = score.getApplication().getApplicant();
        assertNotNull(onScore, "the score must carry an applicant at all");
        assertEquals("Lerato", onScore.getName(),
                "the shortlist table renders this field — a null here is the literal \"null null\" bug");
        assertEquals("Dlamini", onScore.getSurname(),
                "surname is the second half of the same rendered string");
    }

    @Test
    @DisplayName("Hydration is not paid for twice — the applicant is read once per scored application")
    void hydratesWithoutAnExtraRead() {
        Application application = applicationWithStub();

        when(shortlistScoreRepository.findByApplicationId(APPLICATION_ID)).thenReturn(Optional.empty());
        when(applicantRepository.findById(APPLICANT_ID)).thenReturn(Optional.of(full()));
        when(shortlistScoreRepository.save(any(ShortlistScore.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.calculateScore(application, new JobPosting(), false);

        // Naming the candidate reuses the applicant that scoring already loaded. If this becomes
        // two, someone has added a second lookup and a 42-row table pays for it 42 times.
        verify(applicantRepository, times(1)).findById(APPLICANT_ID);
    }

    @Test
    @DisplayName("A missing applicant record degrades to the stub rather than throwing the row away")
    void missingApplicantKeepsTheRow() {
        Application application = applicationWithStub();

        when(shortlistScoreRepository.findByApplicationId(APPLICATION_ID)).thenReturn(Optional.empty());
        when(applicantRepository.findById(APPLICANT_ID)).thenReturn(Optional.empty());
        when(shortlistScoreRepository.save(any(ShortlistScore.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ShortlistScore score = service.calculateScore(application, new JobPosting(), false);

        assertNotNull(score.getApplication().getApplicant(),
                "an unresolvable applicant must still leave the association intact — saving a null "
                        + "here is what erased applicationId on six rows in the offers defect");
        assertEquals(APPLICANT_ID, score.getApplication().getApplicant().getId());
    }
}
