package com.arthmatic.shumelahire.approval;

import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.service.SalaryRecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PendingApprovalsServiceTest {

    @Mock private RequisitionDataRepository requisitionRepository;
    @Mock private JobPostingDataRepository jobPostingRepository;
    @Mock private OfferDataRepository offerRepository;
    @Mock private SalaryRecommendationService salaryRecommendationService;

    private PendingApprovalsService service;

    @BeforeEach
    void setUp() {
        service = new PendingApprovalsService(requisitionRepository, jobPostingRepository,
                offerRepository, salaryRecommendationService);
        // Default: every source answers with nothing.
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(any()))
                .thenReturn(Collections.emptyList());
        when(jobPostingRepository.findByStatusOrderByCreatedAtDesc(any()))
                .thenReturn(Collections.emptyList());
        when(offerRepository.findOffersRequiringApproval(org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(Collections.emptyList());
        when(salaryRecommendationService.getPendingApproval()).thenReturn(Collections.emptyList());
    }

    private static Requisition requisition(String id, String title, BigDecimal ceiling, LocalDateTime updated) {
        Requisition r = new Requisition();
        r.setId(id);
        r.setJobTitle(title);
        r.setDepartment("Enterprise Risk Management");
        r.setSalaryMax(ceiling);
        r.setUpdatedAt(updated);
        return r;
    }

    private static SalaryRecommendation salaryRec(String id, BigDecimal recommended, LocalDateTime updated) {
        SalaryRecommendation rec = new SalaryRecommendation();
        rec.setId(id);
        rec.setPositionTitle("Risk Manager");
        rec.setRecommendedSalary(recommended);
        rec.setUpdatedAt(updated);
        return rec;
    }

    @Test
    @DisplayName("Items from every source arrive in one list, oldest first")
    void aggregatesAndSortsByWait() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_HR_APPROVAL))
                .thenReturn(List.of(requisition("r1", "Chief Audit Executive",
                        new BigDecimal("1450000"), LocalDateTime.of(2026, 8, 5, 9, 0))));
        when(salaryRecommendationService.getPendingApproval())
                .thenReturn(List.of(salaryRec("s1", new BigDecimal("1300000"),
                        LocalDateTime.of(2026, 8, 20, 9, 0))));

        // An approval level is supplied so every source can answer; with none, offers are
        // legitimately unavailable and the result would be partial by design.
        PendingApprovalsResult result = service.pendingFor(2);

        assertEquals(2, result.getTotal());
        assertEquals("r1", result.getItems().get(0).getId(), "the 5 August item waited longest");
        assertEquals("s1", result.getItems().get(1).getId());
        assertFalse(result.isPartial());
    }

    @Test
    @DisplayName("A failed source is reported, and the rest still come back")
    void failedSourceIsReportedNotSwallowed() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(any()))
                .thenThrow(new RuntimeException("Dynamo unavailable"));
        when(salaryRecommendationService.getPendingApproval())
                .thenReturn(List.of(salaryRec("s1", new BigDecimal("900000"), LocalDateTime.now())));

        PendingApprovalsResult result = service.pendingFor(0);

        assertTrue(result.isPartial(), "a failure must be visible to the caller");
        assertTrue(result.getUnavailableSources().containsKey("requisitions"));
        assertTrue(result.getUnavailableSources().get("requisitions").contains("Dynamo unavailable"),
                "the reason must survive, not just the fact of failure");
        assertEquals(1, result.getTotal(), "the sources that answered still answer");
    }

    @Test
    @DisplayName("Every source failing gives an empty list that is explicitly partial, not 'nothing pending'")
    void totalFailureIsDistinguishableFromNothingPending() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(any()))
                .thenThrow(new RuntimeException("down"));
        when(jobPostingRepository.findByStatusOrderByCreatedAtDesc(any()))
                .thenThrow(new RuntimeException("down"));
        when(salaryRecommendationService.getPendingApproval())
                .thenThrow(new RuntimeException("down"));

        PendingApprovalsResult result = service.pendingFor(2);

        assertEquals(0, result.getTotal());
        assertTrue(result.isPartial());
        assertEquals(3, result.getUnavailableSources().size());
    }

    @Test
    @DisplayName("A quiet day is empty and NOT partial — the opposite case must be distinguishable")
    void nothingPendingIsNotPartial() {
        PendingApprovalsResult result = service.pendingFor(2);

        assertEquals(0, result.getTotal());
        assertFalse(result.isPartial(), "no work is not the same as no answer");
        assertTrue(result.getUnavailableSources().isEmpty());
    }

    @Test
    @DisplayName("Without an approval level, offers are skipped with a reason rather than silently absent")
    void offersSkippedWhenLevelUnknown() {
        PendingApprovalsResult result = service.pendingFor(0);

        assertTrue(result.getUnavailableSources().containsKey("offers"));
        assertTrue(result.getUnavailableSources().get("offers").contains("approval level"));
        verifyNoInteractions(offerRepository);
    }

    @Test
    @DisplayName("With an approval level, offers are read and marked as genuinely the caller's")
    void offersAreAssignedWhenFilteredByLevel() {
        Offer offer = new Offer();
        offer.setId("o1");
        offer.setJobTitle("ICT Business Analyst");
        offer.setOfferNumber("OF-2026-0031");
        offer.setBaseSalary(new BigDecimal("780000"));
        offer.setCreatedAt(LocalDateTime.of(2026, 8, 18, 9, 0));
        when(offerRepository.findOffersRequiringApproval(2)).thenReturn(List.of(offer));

        PendingApprovalsResult result = service.pendingFor(2);

        assertEquals(1, result.getTotal());
        PendingApproval item = result.getItems().get(0);
        assertEquals(PendingApproval.Assignment.YOURS, item.getAssignment(),
                "the source filtered by this user, so the item really is theirs");
        assertEquals(1, result.getAssignedToYou());
    }

    @Test
    @DisplayName("Requisitions and salary recommendations are unconfirmed — the source cannot say whose they are")
    void unfilterableSourcesAreMarkedUnconfirmed() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_HR_APPROVAL))
                .thenReturn(List.of(requisition("r1", "Risk Manager",
                        new BigDecimal("1100000"), LocalDateTime.now())));

        PendingApprovalsResult result = service.pendingFor(0);

        assertEquals(PendingApproval.Assignment.UNCONFIRMED, result.getItems().get(0).getAssignment());
        assertEquals(0, result.getAssignedToYou(), "nothing may be claimed as the caller's here");
    }

    @Test
    @DisplayName("A requisition with no band says so instead of reporting zero")
    void unpricedRequisitionHasNoStakeAmount() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_HR_APPROVAL))
                .thenReturn(List.of(requisition("r1", "Communications Officer", null, LocalDateTime.now())));

        PendingApproval item = service.pendingFor(0).getItems().get(0);

        assertNull(item.getStakeAmount(), "absent must not become zero");
        assertEquals("No band recorded", item.getStakeLabel());
    }

    @Test
    @DisplayName("A job advert commits no money, and says that rather than leaving a blank")
    void jobAdvertHasNoMonetaryStake() {
        JobPosting posting = new JobPosting();
        posting.setId("j1");
        posting.setTitle("Investment Analyst");
        posting.setSubmittedForApprovalAt(LocalDateTime.now());
        when(jobPostingRepository.findByStatusOrderByCreatedAtDesc(JobPostingStatus.PENDING_APPROVAL))
                .thenReturn(List.of(posting));

        PendingApproval item = service.pendingFor(0).getItems().get(0);

        assertNull(item.getStakeAmount());
        assertTrue(item.getStakeLabel().contains("no financial commitment"));
    }

    @Test
    @DisplayName("Value held up sums only real amounts, and is null when there are none")
    void valueHeldUpIgnoresNonMonetaryItems() {
        JobPosting posting = new JobPosting();
        posting.setId("j1");
        posting.setTitle("Investment Analyst");
        posting.setSubmittedForApprovalAt(LocalDateTime.now());
        when(jobPostingRepository.findByStatusOrderByCreatedAtDesc(JobPostingStatus.PENDING_APPROVAL))
                .thenReturn(List.of(posting));

        assertNull(service.pendingFor(0).getValueHeldUp(),
                "an advert-only queue holds up no money, which is not the same as R0");

        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_HR_APPROVAL))
                .thenReturn(List.of(requisition("r1", "Risk Manager",
                        new BigDecimal("1100000"), LocalDateTime.now())));

        assertEquals(0, new BigDecimal("1100000").compareTo(service.pendingFor(0).getValueHeldUp()));
    }

    @Test
    @DisplayName("Counts by kind let the caller build the strip without regrouping the list")
    void countsByKind() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_HR_APPROVAL))
                .thenReturn(List.of(requisition("r1", "A", new BigDecimal("1"), LocalDateTime.now())));
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL))
                .thenReturn(List.of(requisition("r2", "B", new BigDecimal("2"), LocalDateTime.now())));
        when(salaryRecommendationService.getPendingApproval())
                .thenReturn(List.of(salaryRec("s1", new BigDecimal("3"), LocalDateTime.now())));

        PendingApprovalsResult result = service.pendingFor(0);

        assertEquals(2, result.getCountsByKind().get("REQUISITION"));
        assertEquals(1, result.getCountsByKind().get("SALARY_RECOMMENDATION"));
        assertNull(result.getCountsByKind().get("LEAVE"), "leave is not read by this service yet");
    }

    @Test
    @DisplayName("Both pending requisition stages are read, not only the first")
    void readsEveryPendingRequisitionStage() {
        when(requisitionRepository.findByStatusOrderByCreatedAtDesc(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL))
                .thenReturn(List.of(requisition("r2", "Risk Manager",
                        new BigDecimal("1100000"), LocalDateTime.now())));

        PendingApprovalsResult result = service.pendingFor(0);

        assertEquals(1, result.getTotal(), "an executive-stage requisition must not be missed");
        assertEquals("PENDING_EXECUTIVE_APPROVAL", result.getItems().get(0).getStage());
    }
}
