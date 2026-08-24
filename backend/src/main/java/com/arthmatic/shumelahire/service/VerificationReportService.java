package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.BackgroundCheck;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Renders a verification report PDF from the check record this system already holds.
 *
 * <p>The provider is the source of the findings, not the only possible source of the document.
 * {@code DotsAfricaService.downloadReport} proxies the provider's own PDF, which requires an
 * {@code externalScreeningId} and a reachable provider — neither of which holds for a check
 * recorded through the webhook, seeded into a tenant, or completed while the provider account
 * was not yet live. Previously all three cases threw, and the caller had no report at all
 * despite the results being on screen directly above the button.
 *
 * <p>Everything printed here comes from the stored {@link BackgroundCheck}. Nothing is inferred
 * and nothing is invented: if a per-check result was never recorded, the line says so rather
 * than defaulting to a pass, because a verification report that quietly reads "clear" where it
 * means "unknown" is the one failure mode that matters in this document.
 */
@Service
public class VerificationReportService {

    private static final Logger logger = LoggerFactory.getLogger(VerificationReportService.class);

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");

    private static final String POPIA_NOTICE =
            "This report contains personal information processed in accordance with the Protection of Personal "
            + "Information Act (POPIA). Distribution is restricted to authorised personnel only.";

    private static final String PROVENANCE_NOTICE =
            "Compiled by ShumelaHire from the verification results recorded against this application. "
            + "The findings are those of the verification provider named above.";

    private static final float MARGIN = 50f;
    private static final float PAGE_TOP = 780f;
    private static final float BODY_BOTTOM = 70f;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Render the report.
     *
     * @param check             the stored check record — the only source of fact for the document
     * @param checkTypeCatalogue the provider catalogue ({@code code}, {@code name}, ...), used to
     *                           print "Criminal Record Check" rather than {@code CRIMINAL_CHECK}.
     *                           An unknown code degrades to a de-underscored form rather than failing.
     */
    public byte[] generateReport(BackgroundCheck check, List<Map<String, Object>> checkTypeCatalogue)
            throws IOException {

        Map<String, String> codeToName = new LinkedHashMap<>();
        if (checkTypeCatalogue != null) {
            for (Map<String, Object> ct : checkTypeCatalogue) {
                Object code = ct.get("code");
                Object name = ct.get("name");
                if (code != null && name != null) {
                    codeToName.put(code.toString(), name.toString());
                }
            }
        }

        List<String> requestedTypes = parseCheckTypes(check.getCheckTypes());
        Map<String, Map<String, String>> results = parseResults(check.getResultsJson());

        try (PDDocument document = new PDDocument()) {
            Renderer r = new Renderer(document);

            r.title("Verification Report");
            r.subtitle("Reference " + nullSafe(check.getReferenceId(), "not recorded"));
            r.gap(14);

            r.heading("Candidate");
            r.field("Name", nullSafe(check.getCandidateName(), "Not recorded"));
            r.field("ID number", nullSafe(check.getCandidateIdNumber(), "Not recorded"));
            r.field("Email", nullSafe(check.getCandidateEmail(), "Not recorded"));
            r.gap(10);

            r.heading("Screening");
            r.field("Status", check.getStatus() == null
                    ? "Not recorded" : check.getStatus().getDisplayName());
            r.field("Overall result", check.getOverallResult() == null
                    ? "Not yet determined" : check.getOverallResult().getDisplayName());
            r.field("Provider", nullSafe(check.getProvider(), "Not recorded"));
            r.field("Consent obtained", Boolean.TRUE.equals(check.getConsentObtained()) ? "Yes" : "No");
            r.field("Initiated", formatDate(check.getCreatedAt()));
            r.field("Completed", check.getCompletedAt() == null
                    ? "Not completed" : formatDate(check.getCompletedAt()));
            r.gap(10);

            r.heading("Checks performed");
            if (requestedTypes.isEmpty()) {
                r.body("No individual checks are recorded against this screening.");
            } else {
                for (String code : requestedTypes) {
                    String label = codeToName.getOrDefault(code, humanise(code));
                    Map<String, String> result = results.get(code);

                    // "Not recorded" is a real and different answer from "Clear". Saying so is the
                    // whole point of the document.
                    String outcome = result == null || result.get("status") == null
                            ? "Not recorded"
                            : humanise(result.get("status"));

                    r.bullet(label + " — " + outcome);

                    String details = result == null ? null : result.get("details");
                    if (details != null && !details.isBlank()) {
                        r.detail(details);
                    }
                }
            }

            if (check.getErrorMessage() != null && !check.getErrorMessage().isBlank()) {
                r.gap(10);
                r.heading("Reported problem");
                r.body(check.getErrorMessage());
            }

            if (check.getNotes() != null && !check.getNotes().isBlank()) {
                r.gap(10);
                r.heading("Notes");
                r.body(check.getNotes());
            }

            r.finish("Generated " + LocalDateTime.now().format(DATETIME_FORMAT));

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            logger.info("Generated verification report for check {}", check.getReferenceId());
            return baos.toByteArray();
        }
    }

    // ── parsing ──────────────────────────────────────

    private List<String> parseCheckTypes(String json) {
        List<String> types = new ArrayList<>();
        if (json == null || json.isBlank()) return types;
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isArray()) {
                node.forEach(n -> types.add(n.asText()));
            }
        } catch (Exception e) {
            logger.warn("Could not parse checkTypes JSON: {}", e.getMessage());
        }
        return types;
    }

    private Map<String, Map<String, String>> parseResults(String json) {
        Map<String, Map<String, String>> parsed = new LinkedHashMap<>();
        if (json == null || json.isBlank()) return parsed;
        try {
            JsonNode root = objectMapper.readTree(json);
            Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                Map<String, String> value = new LinkedHashMap<>();
                JsonNode status = entry.getValue().get("status");
                JsonNode details = entry.getValue().get("details");
                if (status != null) value.put("status", status.asText());
                if (details != null) value.put("details", details.asText());
                parsed.put(entry.getKey(), value);
            }
        } catch (Exception e) {
            logger.warn("Could not parse resultsJson: {}", e.getMessage());
        }
        return parsed;
    }

    private static String humanise(String enumValue) {
        if (enumValue == null || enumValue.isBlank()) return "Not recorded";
        String spaced = enumValue.replace('_', ' ').toLowerCase();
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }

    private static String nullSafe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String formatDate(LocalDateTime value) {
        return value == null ? "Not recorded" : value.format(DATE_FORMAT);
    }

    // ── layout ───────────────────────────────────────

    /**
     * Minimal flowing-text writer over PDFBox.
     *
     * <p>PDFBox has no concept of a text flow — every string is placed at an absolute offset on a
     * fixed page. A report whose length depends on how many checks were run therefore has to track
     * its own cursor and open a new page when it runs out, or the last checks silently render off
     * the bottom edge and the document looks complete while omitting findings.
     */
    private final class Renderer {
        private final PDDocument document;
        private PDPageContentStream cs;
        private float y;

        private final PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private final PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        private final PDType1Font italic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

        Renderer(PDDocument document) throws IOException {
            this.document = document;
            newPage();
        }

        private void newPage() throws IOException {
            if (cs != null) cs.close();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            cs = new PDPageContentStream(document, page);
            y = PAGE_TOP;
        }

        private void ensure(float needed) throws IOException {
            if (y - needed < BODY_BOTTOM) newPage();
        }

        private void write(PDType1Font font, float size, float indent, String text) throws IOException {
            cs.beginText();
            cs.setFont(font, size);
            cs.newLineAtOffset(MARGIN + indent, y);
            cs.showText(sanitise(text));
            cs.endText();
        }

        void title(String text) throws IOException {
            ensure(24);
            write(bold, 18, 0, text);
            y -= 24;
        }

        void subtitle(String text) throws IOException {
            ensure(16);
            write(regular, 10, 0, text);
            y -= 16;
        }

        void heading(String text) throws IOException {
            ensure(20);
            write(bold, 12, 0, text);
            y -= 18;
        }

        void field(String label, String value) throws IOException {
            ensure(15);
            write(regular, 10, 10, label + ": " + value);
            y -= 15;
        }

        void bullet(String text) throws IOException {
            ensure(15);
            write(regular, 10, 10, "•  " + text);
            y -= 15;
        }

        void detail(String text) throws IOException {
            for (String line : wrap(text, 95)) {
                ensure(13);
                write(italic, 9, 24, line);
                y -= 13;
            }
        }

        void body(String text) throws IOException {
            for (String line : wrap(text, 100)) {
                ensure(14);
                write(regular, 10, 10, line);
                y -= 14;
            }
        }

        void gap(float amount) {
            y -= amount;
        }

        /** Footer notices belong on every page, so they are written as the document closes. */
        void finish(String generatedAt) throws IOException {
            cs.close();
            cs = null;
            for (PDPage page : document.getPages()) {
                try (PDPageContentStream footer =
                             new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true)) {
                    footer.beginText();
                    footer.setFont(italic, 7);
                    footer.newLineAtOffset(MARGIN, 52);
                    footer.showText(sanitise(PROVENANCE_NOTICE));
                    footer.endText();

                    footer.beginText();
                    footer.setFont(italic, 7);
                    footer.newLineAtOffset(MARGIN, 42);
                    footer.showText(sanitise(POPIA_NOTICE));
                    footer.endText();

                    footer.beginText();
                    footer.setFont(italic, 7);
                    footer.newLineAtOffset(MARGIN, 32);
                    footer.showText(sanitise(generatedAt));
                    footer.endText();
                }
            }
        }

        /**
         * The Standard 14 fonts use WinAnsi encoding; a character outside it makes showText throw,
         * which would fail the whole download over one pasted character in a free-text note.
         */
        private String sanitise(String text) {
            if (text == null) return "";
            return text.replaceAll("[^\\x20-\\x7E\\u00A0-\\u00FF\\u2022]", " ");
        }

        private List<String> wrap(String text, int width) {
            List<String> lines = new ArrayList<>();
            if (text == null || text.isBlank()) return lines;
            StringBuilder line = new StringBuilder();
            for (String word : text.trim().split("\\s+")) {
                if (line.length() > 0 && line.length() + 1 + word.length() > width) {
                    lines.add(line.toString());
                    line.setLength(0);
                }
                if (line.length() > 0) line.append(' ');
                line.append(word);
            }
            if (line.length() > 0) lines.add(line.toString());
            return lines;
        }
    }
}
