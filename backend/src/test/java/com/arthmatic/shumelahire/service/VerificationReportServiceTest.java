package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.BackgroundCheck;
import com.arthmatic.shumelahire.entity.BackgroundCheckResult;
import com.arthmatic.shumelahire.entity.BackgroundCheckStatus;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The verification report is the one document in this product a candidate can be refused a job
 * over, so the guarantees worth pinning are about honesty rather than layout: it must not report a
 * check as passed when no result was recorded, and it must not silently drop findings that run off
 * the bottom of the page.
 */
class VerificationReportServiceTest {

    private final VerificationReportService service = new VerificationReportService();

    private static Map<String, Object> checkType(String code, String name) {
        Map<String, Object> ct = new LinkedHashMap<>();
        ct.put("code", code);
        ct.put("name", name);
        return ct;
    }

    private static final List<Map<String, Object>> CATALOGUE = List.of(
            checkType("ID_VERIFICATION", "ID Verification"),
            checkType("CRIMINAL_CHECK", "Criminal Record Check"),
            checkType("CREDIT_CHECK", "Credit Check"));

    private BackgroundCheck check() {
        BackgroundCheck c = new BackgroundCheck();
        c.setReferenceId("DA-TEST-001");
        c.setCandidateName("Lerato Dlamini");
        c.setCandidateIdNumber("9501015800088");
        c.setCandidateEmail("lerato@example.co.za");
        c.setProvider("dots-africa");
        c.setStatus(BackgroundCheckStatus.COMPLETED);
        c.setOverallResult(BackgroundCheckResult.CLEAR);
        c.setConsentObtained(true);
        c.setCreatedAt(LocalDateTime.of(2026, 8, 20, 9, 0));
        c.setCompletedAt(LocalDateTime.of(2026, 8, 21, 14, 40));
        return c;
    }

    private String textOf(byte[] pdf) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private int pageCountOf(byte[] pdf) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            return doc.getNumberOfPages();
        }
    }

    @Test
    @DisplayName("Renders a readable PDF carrying the candidate, the reference and the findings")
    void rendersReadableReport() throws Exception {
        BackgroundCheck c = check();
        c.setCheckTypes("[\"ID_VERIFICATION\"]");
        c.setResultsJson("{\"ID_VERIFICATION\":{\"status\":\"CLEAR\",\"details\":\"Matched DHA records\"}}");

        String text = textOf(service.generateReport(c, CATALOGUE));

        assertTrue(text.contains("Verification Report"), text);
        assertTrue(text.contains("Lerato Dlamini"), text);
        assertTrue(text.contains("DA-TEST-001"), text);
        assertTrue(text.contains("9501015800088"), text);
        assertTrue(text.contains("Matched DHA records"), text);
        assertTrue(text.contains("POPIA"), "the POPIA notice must appear on the report");
    }

    @Test
    @DisplayName("Uses the catalogue's name, never the raw enum code")
    void printsHumanReadableCheckNames() throws Exception {
        BackgroundCheck c = check();
        c.setCheckTypes("[\"CRIMINAL_CHECK\"]");
        c.setResultsJson("{\"CRIMINAL_CHECK\":{\"status\":\"CLEAR\"}}");

        String text = textOf(service.generateReport(c, CATALOGUE));

        assertTrue(text.contains("Criminal Record Check"), text);
        assertFalse(text.contains("CRIMINAL_CHECK"), "the raw enum code reached the report: " + text);
    }

    @Test
    @DisplayName("A check with no recorded result says so rather than reading as a pass")
    void unrecordedResultIsNotReportedAsClear() throws Exception {
        // The overall result is CLEAR while one individual check never returned. Printing that
        // check as clear — or omitting it — would misrepresent the screening in the direction that
        // gets someone hired on evidence that does not exist.
        BackgroundCheck c = check();
        c.setCheckTypes("[\"ID_VERIFICATION\",\"CRIMINAL_CHECK\"]");
        c.setResultsJson("{\"ID_VERIFICATION\":{\"status\":\"CLEAR\"}}");

        String text = textOf(service.generateReport(c, CATALOGUE));

        assertTrue(text.contains("Criminal Record Check"), "the unreturned check was dropped: " + text);
        assertTrue(text.contains("Criminal Record Check " + "— Not recorded")
                        || text.contains("Not recorded"),
                "an unreturned check must be marked Not recorded: " + text);
    }

    @Test
    @DisplayName("An adverse finding is carried through, not softened")
    void adverseFindingSurvives() throws Exception {
        BackgroundCheck c = check();
        c.setOverallResult(BackgroundCheckResult.ADVERSE);
        c.setCheckTypes("[\"CREDIT_CHECK\"]");
        c.setResultsJson("{\"CREDIT_CHECK\":{\"status\":\"ADVERSE\",\"details\":\"Two judgments on record\"}}");

        String text = textOf(service.generateReport(c, CATALOGUE));

        assertTrue(text.contains("Adverse"), text);
        assertTrue(text.contains("Two judgments on record"), text);
    }

    @Test
    @DisplayName("Findings that overflow the page continue onto another one instead of vanishing")
    void longReportPaginatesRatherThanTruncating() throws Exception {
        // PDFBox places text at absolute offsets with no concept of a flow, so without an explicit
        // page break the tail of a long list renders off the bottom edge: the document looks
        // complete and is missing findings.
        List<String> codes = IntStream.rangeClosed(1, 60)
                .mapToObj(i -> "CHECK_" + i)
                .collect(Collectors.toList());

        BackgroundCheck c = check();
        c.setCheckTypes(codes.stream()
                .map(code -> "\"" + code + "\"")
                .collect(Collectors.joining(",", "[", "]")));
        c.setResultsJson(codes.stream()
                .map(code -> "\"" + code + "\":{\"status\":\"CLEAR\"}")
                .collect(Collectors.joining(",", "{", "}")));

        byte[] pdf = service.generateReport(c, CATALOGUE);

        assertTrue(pageCountOf(pdf) > 1, "60 checks must not fit on one page");
        String text = textOf(pdf);
        assertTrue(text.contains("Check 1 "), "first finding missing: " + text);
        assertTrue(text.contains("Check 60"), "last finding was dropped off the page: " + text);
    }

    @Test
    @DisplayName("A record with nothing recorded still produces a report rather than throwing")
    void emptyRecordStillRenders() throws Exception {
        BackgroundCheck c = new BackgroundCheck();
        c.setReferenceId("DA-EMPTY");

        String text = textOf(service.generateReport(c, CATALOGUE));

        assertTrue(text.contains("DA-EMPTY"), text);
        assertTrue(text.contains("No individual checks are recorded"), text);
    }
}
