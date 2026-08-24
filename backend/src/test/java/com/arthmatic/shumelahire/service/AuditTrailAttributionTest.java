package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.repository.AuditLogDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * What an audit row must carry to be worth writing.
 *
 * <p>Two faults are pinned here. Every {@code logUserAction} call wrote {@code entityId = null} —
 * forty-seven of them across offers, interviews, the pipeline, shortlisting, job postings,
 * applications, CV uploads and GDPR requests — so the events existed in the table and could never
 * be retrieved for the record they described. And entity types were written in two spellings, so
 * even a row that <em>did</em> carry an id was invisible to a lookup using the other casing.
 */
class AuditTrailAttributionTest {

    private AuditLogDataRepository repository;
    private AuditLogService service;

    @BeforeEach
    void setUp() {
        repository = mock(AuditLogDataRepository.class);
        when(repository.save(any(AuditLog.class))).thenAnswer(call -> call.getArgument(0));
        service = new AuditLogService(repository);
    }

    private AuditLog captureSaved() {
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("A logged action carries the id of the record it was taken against")
    void entityIdIsRecorded() {
        service.logUserAction("user-7", "STATUS_UPDATED", "APPLICATION", "app-1", "From SUBMITTED to SCREENING");

        AuditLog saved = captureSaved();
        assertEquals("app-1", saved.getEntityId());
        assertEquals("user-7", saved.getUserId());
    }

    @Test
    @DisplayName("Entity types are stored in one spelling, whatever the caller wrote")
    void entityTypeIsNormalised() {
        // "Offer" appeared in twenty call sites and "OFFER" in fifteen, for the same records.
        service.logUserAction("user-7", "OFFER_SENT", "Offer", "offer-1", "Offer sent");
        assertEquals("OFFER", captureSaved().getEntityType());
    }

    @Test
    @DisplayName("Lookup finds rows written under either spelling, so history does not split")
    void lookupSpansBothSpellings() {
        AuditLog legacy = new AuditLog("user-7", "OFFER_SENT", "Offer", "offer-1", "older row");
        legacy.setTimestamp(LocalDateTime.of(2026, 8, 1, 9, 0));
        AuditLog current = new AuditLog("user-7", "OFFER_ACCEPTED", "OFFER", "offer-1", "newer row");
        current.setTimestamp(LocalDateTime.of(2026, 8, 20, 9, 0));

        when(repository.findByEntityTypeAndEntityIdOrderByTimestampDesc(eq("OFFER"), eq("offer-1")))
                .thenReturn(List.of(current));
        when(repository.findByEntityTypeAndEntityIdOrderByTimestampDesc(eq("Offer"), eq("offer-1")))
                .thenReturn(List.of(legacy));

        List<AuditLog> logs = service.getLogsByEntity("Offer", "offer-1");

        assertEquals(2, logs.size());
        // Newest first, across both spellings — a record's history is one sequence.
        assertEquals("OFFER_ACCEPTED", logs.get(0).getAction());
        assertEquals("OFFER_SENT", logs.get(1).getAction());
    }

    @Test
    @DisplayName("A lookup in the canonical spelling does not query twice")
    void canonicalLookupIsASingleQuery() {
        when(repository.findByEntityTypeAndEntityIdOrderByTimestampDesc(eq("APPLICATION"), eq("app-1")))
                .thenReturn(List.of());

        service.getLogsByEntity("APPLICATION", "app-1");

        verify(repository).findByEntityTypeAndEntityIdOrderByTimestampDesc("APPLICATION", "app-1");
    }

    @Test
    @DisplayName("Normalisation tolerates padding and leaves null alone")
    void normalisationIsDefensive() {
        assertEquals("APPLICATION", AuditLogService.normaliseEntityType("  application "));
        assertNotNull(AuditLogService.normaliseEntityType("OFFER"));
        assertEquals(null, AuditLogService.normaliseEntityType(null));
    }
}
