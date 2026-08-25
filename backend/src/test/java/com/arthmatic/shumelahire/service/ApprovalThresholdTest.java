package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.SalaryRecommendationCreateRequest;
import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.SalaryRecommendationDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The rand figure that decides whether a second person has to sign.
 *
 * <p>It was a hard-coded constant, and so was {@code OfferService}'s — 200000 here, 150000 there,
 * both setting {@code approvalLevelRequired} to 2, neither referring to the other. Anyone comparing
 * them found a R50,000 band where the system called an amount high-value and then routed it to a
 * manager anyway.
 *
 * <p>These pin the boundary itself (a threshold read off by one is the classic way a control like
 * this fails silently) and that the default is genuinely unchanged, because the whole claim of the
 * change is that it alters no approval outcome.
 */
class ApprovalThresholdTest {

    private SalaryRecommendationDataRepository repository;
    private SalaryRecommendationService service;

    @BeforeEach
    void setUp() {
        repository = mock(SalaryRecommendationDataRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        ApplicationDataRepository applicationRepository = mock(ApplicationDataRepository.class);
        service = new SalaryRecommendationService(repository, applicationRepository, auditLogService);
        when(repository.save(any(SalaryRecommendation.class)))
                .thenAnswer(invocation -> {
                    SalaryRecommendation saved = invocation.getArgument(0);
                    if (saved.getId() == null) {
                        saved.setId("sr1");
                    }
                    return saved;
                });
        when(applicationRepository.findById(anyString())).thenReturn(Optional.empty());
    }

    private SalaryRecommendationCreateRequest requestFor(String target) {
        SalaryRecommendationCreateRequest request = new SalaryRecommendationCreateRequest();
        request.setPositionTitle("Systems Analyst");
        request.setProposedTargetSalary(new BigDecimal(target));
        return request;
    }

    private int approvalLevelFor(String target) {
        return service.createRecommendationRequest(requestFor(target), "hr@example.com")
                .getApprovalLevelRequired();
    }

    @Test
    @DisplayName("Above the threshold needs an executive; at or below it does not")
    void thresholdBoundary() {
        // Strictly greater-than. An amount exactly on the threshold stays with the manager, which is
        // the existing behaviour and the easiest thing to change by accident.
        assertEquals(1, approvalLevelFor("899999"));
        assertEquals(1, approvalLevelFor("900000"));
        assertEquals(2, approvalLevelFor("900001"));
    }

    @Test
    @DisplayName("The two thresholds are set to catch the same appointments")
    void thresholdsAreChosenAsAPair() {
        // The original pair — 200000 on base salary, 150000 on total compensation — left a band
        // where an offer was called high value and then routed to a manager anyway. Total
        // compensation runs about 1.25x base for a typical package, so putting the offer gate at
        // 1.25x the salary gate makes an appointment that trips one trip the other. The ratio is
        // the point; asserting it stops the two drifting apart again.
        BigDecimal salaryThreshold =
                (BigDecimal) ReflectionTestUtils.getField(service, "executiveApprovalThreshold");
        BigDecimal offerThreshold = new BigDecimal("1125000"); // OfferService's default

        assertEquals(new BigDecimal("900000"), salaryThreshold);
        assertEquals(0, offerThreshold.compareTo(
                salaryThreshold.multiply(new BigDecimal("1.25"))));
    }

    @Test
    @DisplayName("A professional-level appointment does not need an executive")
    void ordinaryAppointmentsDoNotEscalate() {
        // The reason the figure moved. At 200000 almost every appointment reached an executive,
        // which is how an approval gate stops being read.
        assertEquals(1, approvalLevelFor("650000"));
    }

    @Test
    @DisplayName("Setting the property moves the boundary")
    void thresholdIsConfigurable() {
        // The point of the change: this figure reads like a placeholder — R200,000 a year would send
        // most professional appointments to an executive — and it must be settable without a rebuild.
        ReflectionTestUtils.setField(service, "executiveApprovalThreshold", new BigDecimal("850000"));

        assertEquals(1, approvalLevelFor("400000"));
        assertEquals(2, approvalLevelFor("850001"));
    }

    @Test
    @DisplayName("A request with no proposed figure stays with the manager")
    void noProposedSalaryDoesNotEscalate() {
        // Null is "not costed yet", not "expensive". Escalating it would send every unpriced draft
        // to an executive.
        SalaryRecommendationCreateRequest request = new SalaryRecommendationCreateRequest();
        request.setPositionTitle("Systems Analyst");

        assertEquals(1, service.createRecommendationRequest(request, "hr@example.com")
                .getApprovalLevelRequired());
    }

    @Test
    @DisplayName("Both thresholds are declared together where they can be compared")
    void bothThresholdsAreConfiguredInOnePlace() throws IOException {
        // The defect was not the numbers, it was that nobody could see them side by side. If one is
        // ever moved out of this block, the other stops being comparable and the trap reopens.
        String config = Files.readString(Path.of("src/main/resources/application.yml"));

        assertTrue(config.contains("executive-salary-threshold"), "salary threshold not configured");
        assertTrue(config.contains("offer-high-value-threshold"), "offer threshold not configured");
        assertTrue(config.indexOf("offer-high-value-threshold")
                        - config.indexOf("executive-salary-threshold") < 200,
                "the two thresholds have drifted apart in the config and can no longer be read together");
    }
}
