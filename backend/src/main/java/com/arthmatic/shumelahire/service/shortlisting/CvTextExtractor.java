package com.arthmatic.shumelahire.service.shortlisting;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.Locale;

/**
 * Pulls plain text out of an uploaded CV.
 *
 * <p>This is the missing input for everything downstream. {@code CvScreeningAiService} has always
 * taken a {@code resumeText} parameter, but the tenant holds <em>zero</em> stored documents and
 * zero resume URLs, so that parameter has only ever been empty. No amount of model quality
 * compensates for having nothing to read.</p>
 *
 * <p>PDF via PDFBox and DOCX via POI, both already dependencies. Extraction failure returns
 * {@code null} rather than throwing: a CV that cannot be parsed is a candidate the recruiter should
 * still see, scored on whatever else is known, and an upload must never fail because the text layer
 * was unreadable — scanned CVs are common.</p>
 */
@Service
public class CvTextExtractor {

    private static final Logger logger = LoggerFactory.getLogger(CvTextExtractor.class);

    /** Beyond this, we are storing a book, not a CV. Keeps a runaway file out of an AI prompt. */
    private static final int MAX_CHARS = 40_000;

    /**
     * Extracted text, or {@code null} when nothing usable could be read.
     *
     * @param filename used only to choose a parser; content is trusted over extension where possible
     */
    public String extract(byte[] content, String filename, String contentType) {
        if (content == null || content.length == 0) return null;

        try {
            if (looksLikePdf(content, filename, contentType)) {
                return clean(extractPdf(content));
            }
            if (looksLikeDocx(content, filename, contentType)) {
                return clean(extractDocx(content));
            }
            if (isPlainText(filename, contentType)) {
                return clean(new String(content, java.nio.charset.StandardCharsets.UTF_8));
            }
            logger.info("No extractor for '{}' ({}) — the CV is stored but not searchable", filename, contentType);
            return null;
        } catch (Exception e) {
            // A scanned CV is an image in a PDF wrapper and yields nothing. That is a normal
            // outcome, not an error worth failing an application over.
            logger.warn("Could not extract text from '{}': {}", filename, e.getMessage());
            return null;
        }
    }

    private String extractPdf(byte[] content) throws Exception {
        try (PDDocument doc = Loader.loadPDF(content)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc);
        }
    }

    private String extractDocx(byte[] content) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(content));
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    /** Magic bytes first: an extension is a claim, the header is evidence. */
    private boolean looksLikePdf(byte[] c, String filename, String contentType) {
        if (c.length >= 4 && c[0] == '%' && c[1] == 'P' && c[2] == 'D' && c[3] == 'F') return true;
        return endsWith(filename, ".pdf") || contains(contentType, "pdf");
    }

    private boolean looksLikeDocx(byte[] c, String filename, String contentType) {
        // DOCX is a zip; "PK" is the zip signature.
        boolean zip = c.length >= 2 && c[0] == 'P' && c[1] == 'K';
        return (zip && endsWith(filename, ".docx"))
                || contains(contentType, "wordprocessingml");
    }

    private boolean isPlainText(String filename, String contentType) {
        return endsWith(filename, ".txt") || contains(contentType, "text/plain");
    }

    private boolean endsWith(String s, String suffix) {
        return s != null && s.toLowerCase(Locale.ROOT).endsWith(suffix);
    }

    private boolean contains(String s, String needle) {
        return s != null && s.toLowerCase(Locale.ROOT).contains(needle);
    }

    /** Collapse the whitespace a PDF layout leaves behind, and cap the length. */
    private String clean(String raw) {
        if (raw == null) return null;
        String text = raw.replaceAll("[ \\t\\x0B\\f\\r]+", " ")
                         .replaceAll("(?m)^ +| +$", "")
                         .replaceAll("\\n{3,}", "\n\n")
                         .trim();
        if (text.isEmpty()) return null;
        return text.length() > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;
    }
}
