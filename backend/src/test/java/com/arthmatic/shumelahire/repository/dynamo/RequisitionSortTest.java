package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Requisition;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * The in-memory sort behind {@code DynamoRequisitionRepository}'s paged queries.
 *
 * <p>Both paged methods previously ignored {@code pageable.getSort()} entirely, so the sort
 * parameter callers have always sent had no effect. These tests pin the behaviour that replaced
 * that, calling the ordering helper directly — it is static and package-private precisely so this can be
 * pinned without standing up a DynamoDB client.
 */
class RequisitionSortTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 24, 12, 0);

    private static Requisition req(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        Requisition requisition = new Requisition();
        requisition.setId(id);
        requisition.setCreatedAt(createdAt);
        requisition.setUpdatedAt(updatedAt);
        return requisition;
    }

    private static List<String> sortedIds(List<Requisition> records, Sort sort) {
        return DynamoRequisitionRepository.sorted(records, sort).stream()
                .map(Requisition::getId)
                .toList();
    }

    @Test
    @DisplayName("updatedAt ascending puts the longest wait first — the queue ordering")
    void oldestUpdatedFirst() {
        List<Requisition> records = new ArrayList<>(List.of(
                req("recent", NOW.minusDays(30), NOW.minusDays(2)),
                req("stale", NOW.minusDays(20), NOW.minusDays(19)),
                req("middling", NOW.minusDays(25), NOW.minusDays(11))));

        assertEquals(List.of("stale", "middling", "recent"),
                sortedIds(records, Sort.by(Sort.Direction.ASC, "updatedAt")));
    }

    @Test
    @DisplayName("createdAt descending is newest first, the previous default")
    void newestCreatedFirst() {
        List<Requisition> records = new ArrayList<>(List.of(
                req("old", NOW.minusDays(30), NOW),
                req("new", NOW.minusDays(1), NOW)));

        assertEquals(List.of("new", "old"),
                sortedIds(records, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Test
    @DisplayName("A record with no timestamp sorts last in both directions")
    void undatedRecordsNeverLead() {
        List<Requisition> records = new ArrayList<>(List.of(
                req("undated", NOW.minusDays(5), null),
                req("dated", NOW.minusDays(5), NOW.minusDays(9))));

        // Ascending: an unknown wait must not win a queue ordered by longest wait.
        assertEquals(List.of("dated", "undated"),
                sortedIds(records, Sort.by(Sort.Direction.ASC, "updatedAt")));
        // Descending: reversing a nullsLast comparator would otherwise bring nulls to the front.
        assertEquals(List.of("dated", "undated"),
                sortedIds(records, Sort.by(Sort.Direction.DESC, "updatedAt")));
    }

    @Test
    @DisplayName("An unsupported sort property leaves the order alone rather than guessing")
    void unsupportedPropertyIsIgnored() {
        List<Requisition> records = new ArrayList<>(List.of(
                req("b", NOW.minusDays(1), NOW.minusDays(1)),
                req("a", NOW.minusDays(2), NOW.minusDays(2))));

        // A silent mis-sort is harder to notice than an unchanged one.
        assertEquals(List.of("b", "a"), sortedIds(records, Sort.by("jobTitle")));
    }

    @Test
    @DisplayName("An unsorted pageable leaves the order alone")
    void unsortedIsUntouched() {
        List<Requisition> records = new ArrayList<>(List.of(
                req("b", NOW.minusDays(1), NOW.minusDays(1)),
                req("a", NOW.minusDays(2), NOW.minusDays(2))));

        Pageable unsorted = PageRequest.of(0, 20);
        assertEquals(List.of("b", "a"), sortedIds(records, unsorted.getSort()));
    }
}
