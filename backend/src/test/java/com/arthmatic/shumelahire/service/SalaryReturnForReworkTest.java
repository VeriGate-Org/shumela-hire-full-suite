package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;
import com.arthmatic.shumelahire.repository.SalaryRecommendationDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Sending a salary recommendation back for rework.
 *
 * <p><b>This transition did not exist.</b> {@code RETURNED} was declared on the status enum and
 * accepted by {@code submitForReview}, so the resubmission half of the loop was built — but no code
 * anywhere set the status, which meant no recommendation could ever be in it. The workflow could
 * reject, and it could resubmit something returned; it could not return.
 *
 * <p>The distinction these pin is the one that matters: a rejection ends the recommendation, a
 * return expects it back.
 */
class SalaryReturnForReworkTest {

    private SalaryRecommendationDataRepository repository;
    private SalaryRecommendationService service;

    @BeforeEach
    void setUp() {
        repository = mock(SalaryRecommendationDataRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        service = new SalaryRecommendationService(
                repository,
                mock(com.arthmatic.shumelahire.repository.ApplicationDataRepository.class),
                auditLogService);
        when(repository.save(any(SalaryRecommendation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private SalaryRecommendation existing(SalaryRecommendationStatus status) {
        SalaryRecommendation rec = new SalaryRecommendation();
        rec.setId("sr1");
        rec.setRecommendationNumber("SR-2026-0044");
        rec.setStatus(status);
        when(repository.findById(anyString())).thenReturn(Optional.of(rec));
        return rec;
    }

    @Test
    @DisplayName("A recommendation awaiting review can be sent back, with who and why recorded")
    void returnsFromPendingReview() {
        existing(SalaryRecommendationStatus.PENDING_REVIEW);

        var returned = service.returnForRework("sr1", "hr@example.com", "Market evidence missing");

        assertEquals(SalaryRecommendationStatus.RETURNED, returned.getStatus());
        assertEquals("hr@example.com", returned.getReturnedBy());
        assertEquals("Market evidence missing", returned.getReturnReason());
        assertNotNull(returned.getReturnedAt());
    }

    @Test
    @DisplayName("An approver can send back a recommendation waiting on their signature")
    void returnsFromPendingApproval() {
        existing(SalaryRecommendationStatus.PENDING_APPROVAL);

        var returned = service.returnForRework("sr1", "exec@example.com", "Above band, revise");

        assertEquals(SalaryRecommendationStatus.RETURNED, returned.getStatus());
    }

    @Test
    @DisplayName("A recommended-but-unapproved one can also go back")
    void returnsFromRecommended() {
        existing(SalaryRecommendationStatus.RECOMMENDED);

        assertEquals(SalaryRecommendationStatus.RETURNED,
                service.returnForRework("sr1", "exec@example.com", "Revise").getStatus());
    }

    @Test
    @DisplayName("A draft cannot be returned — nobody has been asked to look at it")
    void draftCannotBeReturned() {
        existing(SalaryRecommendationStatus.DRAFT);

        assertThrows(IllegalStateException.class,
                () -> service.returnForRework("sr1", "hr@example.com", "Not ready"));
    }

    @Test
    @DisplayName("A finished recommendation cannot be returned")
    void terminalStatesCannotBeReturned() {
        // Rejected and implemented are both endings. Returning either would reopen a decision that
        // was already made, without any record that it had been reopened.
        existing(SalaryRecommendationStatus.REJECTED);
        assertThrows(IllegalStateException.class,
                () -> service.returnForRework("sr1", "hr@example.com", "Reconsider"));

        existing(SalaryRecommendationStatus.IMPLEMENTED);
        assertThrows(IllegalStateException.class,
                () -> service.returnForRework("sr1", "hr@example.com", "Reconsider"));
    }

    @Test
    @DisplayName("A reason is required — \"returned\" with no explanation is not actionable")
    void reasonIsRequired() {
        existing(SalaryRecommendationStatus.PENDING_REVIEW);

        assertThrows(IllegalArgumentException.class,
                () -> service.returnForRework("sr1", "hr@example.com", null));
        assertThrows(IllegalArgumentException.class,
                () -> service.returnForRework("sr1", "hr@example.com", "   "));
    }

    @Test
    @DisplayName("The loop closes: a returned recommendation can be resubmitted")
    void returnedCanBeResubmitted() {
        // submitForReview has always accepted RETURNED. Until now nothing could put a
        // recommendation into that state, so the branch was unreachable.
        SalaryRecommendation rec = existing(SalaryRecommendationStatus.PENDING_REVIEW);

        service.returnForRework("sr1", "hr@example.com", "Add market evidence");
        assertEquals(SalaryRecommendationStatus.RETURNED, rec.getStatus());

        var resubmitted = service.submitForReview("sr1", "manager@example.com");
        assertEquals(SalaryRecommendationStatus.PENDING_REVIEW, resubmitted.getStatus());
    }

    @Test
    @DisplayName("Returns are counted, because resubmitting hides that it ever happened")
    void returnsAreCounted() {
        // Once it is resubmitted the status moves on. One return is a correction; four is a
        // disagreement nobody is resolving, and only a count can tell them apart.
        SalaryRecommendation rec = existing(SalaryRecommendationStatus.PENDING_REVIEW);

        service.returnForRework("sr1", "hr@example.com", "First");
        assertEquals(1, rec.getTimesReturned());

        service.submitForReview("sr1", "manager@example.com");
        service.returnForRework("sr1", "hr@example.com", "Again");
        assertEquals(2, rec.getTimesReturned());

        service.submitForReview("sr1", "manager@example.com");
        service.returnForRework("sr1", "hr@example.com", "Still wrong");
        assertEquals(3, rec.getTimesReturned());
    }

    @Test
    @DisplayName("A record written before returning existed counts from zero, not from null")
    void nullCountIsTreatedAsZero() {
        SalaryRecommendation rec = existing(SalaryRecommendationStatus.PENDING_REVIEW);
        rec.setTimesReturned(null);

        service.returnForRework("sr1", "hr@example.com", "First time back");

        assertEquals(1, rec.getTimesReturned());
    }

    @Test
    @DisplayName("Returning is not rejecting — the rejection fields stay empty")
    void returningDoesNotRecordARejection() {
        // A rejection ends the recommendation. Writing the rejection fields on a return would make
        // a live recommendation look refused on every screen that reads them.
        SalaryRecommendation rec = existing(SalaryRecommendationStatus.PENDING_APPROVAL);

        service.returnForRework("sr1", "exec@example.com", "Revise the number");

        assertEquals(null, rec.getRejectedBy());
        assertEquals(null, rec.getRejectionReason());
    }
}
