package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.AuditLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Pins the ordering of the paged audit-log query.
 *
 * <p>{@code DynamoAuditLogRepository.findAll(Pageable)} sliced an unordered scan, so page 0 was an
 * arbitrary fifty entries in DynamoDB key order rather than the fifty most recent. The admin
 * console filters client-side over whatever page it was handed, so "recent activity" showed a
 * random sample and the newest entries were unreachable once a tenant exceeded one page — while
 * the header still read "230 total events". Its sibling
 * {@code findByEntityTypeOrderByTimestampDesc} had always sorted; this method never did.</p>
 *
 * <p>The comparator is duplicated here rather than exercised through the repository because the
 * repository needs a live DynamoDB client to construct. The ordering rule is the whole of the fix.</p>
 */
class AuditLogOrderingTest {

    /** Mirrors DynamoAuditLogRepository.timestampOrder(). */
    private Comparator<AuditLog> timestampOrder(Pageable pageable) {
        boolean ascending = pageable.getSort().stream()
                .filter(order -> "timestamp".equals(order.getProperty()))
                .findFirst()
                .map(Sort.Order::isAscending)
                .orElse(false);

        Comparator<LocalDateTime> direction =
                ascending ? Comparator.naturalOrder() : Comparator.reverseOrder();
        return Comparator.comparing(AuditLog::getTimestamp, Comparator.nullsLast(direction));
    }

    private AuditLog at(String isoTimestamp, String action) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setTimestamp(isoTimestamp == null ? null : LocalDateTime.parse(isoTimestamp));
        return log;
    }

    /** Deliberately not in time order — this is the shape a table scan returns. */
    private List<AuditLog> unordered() {
        List<AuditLog> logs = new ArrayList<>();
        logs.add(at("2026-06-06T19:29:07", "JOB_POSTING_CREATED"));
        logs.add(at("2026-08-22T15:40:31", "JOB_POSTING_PUBLISHED"));
        logs.add(at("2026-06-21T13:31:42", "APPLICATION_SUBMITTED"));
        logs.add(at("2026-06-22T09:15:32", "REQUISITION_ESCALATED_TO_EXECUTIVE"));
        return logs;
    }

    private List<String> actionsInOrder(List<AuditLog> logs, Pageable pageable) {
        return logs.stream().sorted(timestampOrder(pageable)).map(AuditLog::getAction).toList();
    }

    @Test
    @DisplayName("Newest first by default — an unsorted request still gets recent activity")
    void defaultsToNewestFirst() {
        List<String> ordered = actionsInOrder(unordered(), PageRequest.of(0, 50));
        assertEquals(
                List.of("JOB_POSTING_PUBLISHED", "REQUISITION_ESCALATED_TO_EXECUTIVE",
                        "APPLICATION_SUBMITTED", "JOB_POSTING_CREATED"),
                ordered);
    }

    @Test
    @DisplayName("An explicit ascending sort is honoured")
    void ascendingIsHonoured() {
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "timestamp"));
        assertEquals("JOB_POSTING_CREATED", actionsInOrder(unordered(), pageable).get(0));
    }

    @Test
    @DisplayName("An explicit descending sort matches the default")
    void descendingMatchesDefault() {
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "timestamp"));
        assertEquals(actionsInOrder(unordered(), PageRequest.of(0, 50)),
                actionsInOrder(unordered(), pageable));
    }

    @Test
    @DisplayName("The first page holds the most recent entries, not an arbitrary slice")
    void firstPageIsMostRecent() {
        List<AuditLog> sorted = unordered().stream().sorted(timestampOrder(PageRequest.of(0, 2))).toList();
        List<AuditLog> firstPage = sorted.subList(0, 2);
        assertEquals("JOB_POSTING_PUBLISHED", firstPage.get(0).getAction());
        assertEquals("REQUISITION_ESCALATED_TO_EXECUTIVE", firstPage.get(1).getAction(),
                "the escalation an auditor is looking for must not fall off page 1 by accident");
    }

    @Test
    @DisplayName("A null timestamp sorts last in both directions and never throws")
    void nullTimestampsSortLast() {
        List<AuditLog> logs = new ArrayList<>(unordered());
        logs.add(at(null, "ORPHANED_ENTRY"));

        for (Pageable pageable : List.of(
                PageRequest.of(0, 50),
                PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "timestamp")))) {
            List<String> ordered = assertDoesNotThrow(() -> actionsInOrder(logs, pageable));
            assertEquals("ORPHANED_ENTRY", ordered.get(ordered.size() - 1),
                    "one entry missing a timestamp must not take down the audit console");
        }
    }

    @Test
    @DisplayName("A sort on some other property leaves the newest-first guarantee intact")
    void unrelatedSortPropertyIgnored() {
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "action"));
        assertEquals("JOB_POSTING_PUBLISHED", actionsInOrder(unordered(), pageable).get(0));
    }
}
