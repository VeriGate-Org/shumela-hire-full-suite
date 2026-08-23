package com.arthmatic.shumelahire.service.shortlisting;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Covers CV text extraction against real files, built in the test rather than fixtures.
 *
 * <p>This is the input the whole AI screening story rests on. {@code CvScreeningAiService} has
 * always accepted a {@code resumeText} argument, but the tenant holds zero documents and zero
 * resume URLs, so it has only ever been handed an empty string. Screening quality was never the
 * constraint; having anything to read was.</p>
 */
class CvTextExtractorTest {

    private final CvTextExtractor extractor = new CvTextExtractor();

    private byte[] pdf(String text) throws Exception {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text);
                cs.endText();
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    private byte[] docx(String text) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.createParagraph().createRun().setText(text);
            doc.write(out);
            return out.toByteArray();
        }
    }

    @Test
    @DisplayName("Reads a PDF CV")
    void readsPdf() throws Exception {
        String text = extractor.extract(pdf("Lerato Dlamini PMP certified project manager"),
                "cv.pdf", "application/pdf");
        assertNotNull(text);
        assertTrue(text.contains("Lerato Dlamini"), text);
        assertTrue(text.contains("PMP"), text);
    }

    @Test
    @DisplayName("Reads a Word CV")
    void readsDocx() throws Exception {
        String text = extractor.extract(docx("Nine years development finance experience"),
                "cv.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        assertNotNull(text);
        assertTrue(text.contains("development finance"), text);
    }

    @Test
    @DisplayName("Reads plain text")
    void readsPlainText() {
        String text = extractor.extract("Skills: Java, AWS".getBytes(StandardCharsets.UTF_8),
                "cv.txt", "text/plain");
        assertNotNull(text);
        assertTrue(text.contains("Java"));
    }

    @Test
    @DisplayName("Content decides the parser, not the file extension")
    void magicBytesBeatExtension() throws Exception {
        // A PDF saved with the wrong extension still parses — an extension is a claim, the
        // header is evidence, and candidates rename files.
        String text = extractor.extract(pdf("Mislabelled but readable"), "cv.doc", "application/msword");
        assertNotNull(text);
        assertTrue(text.contains("Mislabelled"));
    }

    @Test
    @DisplayName("An unreadable file returns null rather than throwing")
    void unreadableReturnsNull() {
        // A scanned CV is an image in a PDF wrapper: nothing to strip. That is a normal outcome
        // and must not fail the upload — the recruiter can still open the file.
        assertNull(extractor.extract("not a real pdf".getBytes(StandardCharsets.UTF_8),
                "cv.pdf", "application/pdf"));
        assertNull(extractor.extract(new byte[]{1, 2, 3}, "cv.bin", "application/octet-stream"));
    }

    @Test
    @DisplayName("Empty input returns null")
    void emptyIsNull() {
        assertNull(extractor.extract(null, "cv.pdf", "application/pdf"));
        assertNull(extractor.extract(new byte[0], "cv.pdf", "application/pdf"));
    }

    @Test
    @DisplayName("A PDF with no text layer yields null, not whitespace")
    void whitespaceOnlyIsNull() throws Exception {
        String text = extractor.extract(pdf(" "), "blank.pdf", "application/pdf");
        assertNull(text, "an empty string would look like successful extraction to every caller downstream");
    }

    @Test
    @DisplayName("Layout whitespace is collapsed")
    void whitespaceCollapsed() {
        String text = extractor.extract(
                "Skills:    Java     AWS\n\n\n\n\nExperience".getBytes(StandardCharsets.UTF_8),
                "cv.txt", "text/plain");
        assertNotNull(text);
        assertFalse(text.contains("    "), "PDF layout leaves runs of spaces that waste prompt budget");
        assertFalse(text.contains("\n\n\n"));
    }

    @Test
    @DisplayName("Very long documents are capped")
    void cappedLength() {
        String text = extractor.extract("x".repeat(60_000).getBytes(StandardCharsets.UTF_8),
                "cv.txt", "text/plain");
        assertNotNull(text);
        assertTrue(text.length() <= 40_000, "a runaway file must not be handed whole to a model");
    }

    @Test
    @DisplayName("Extracted text is usable by the keyword scorer")
    void feedsScoring() throws Exception {
        String cv = extractor.extract(
                pdf("PMP certified project manager with PFMA reporting experience"),
                "cv.pdf", "application/pdf");

        CandidateScoring.Dimension d = CandidateScoring.keywords(cv,
                "PMP certification. PFMA reporting. Development finance.");
        assertTrue(d.scorable());
        assertTrue(d.score() > 0, "the whole point of extraction is that it reaches the scorer");
    }
}
