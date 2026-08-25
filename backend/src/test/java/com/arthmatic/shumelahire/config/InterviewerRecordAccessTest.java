package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * An interviewer may read a candidate record and change nothing.
 *
 * <p>A hiring manager sends a panel member the candidate's link before an interview, and that link
 * used to answer 403 — which makes the record's whole reason for having an address useless. Reading
 * is now permitted; every write route still excludes the role, and that half matters more than the
 * first, so it is pinned here rather than left to review.
 *
 * <p>Reads the source, because the risk is a divergence between three files: Spring evaluates the
 * URL rule before any {@code @PreAuthorize}, so where the two disagree the annotation is decoration.
 */
class InterviewerRecordAccessTest {

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/ApplicationController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    @Test
    @DisplayName("Both security configs let an interviewer reach the applications API")
    void urlRulesAdmitInterviewer() throws IOException {
        for (Path config : CONFIGS) {
            Matcher m = Pattern.compile(
                    "\"/api/applications/\\*\\*\"\\)\\)\\s*\\.hasAnyRole\\(([^)]*)\\)")
                    .matcher(read(config));
            assertTrue(m.find(), config.getFileName() + ": no /api/applications/** rule found");
            assertTrue(m.group(1).contains("INTERVIEWER"),
                    config.getFileName() + " omits INTERVIEWER, so the annotation would never be reached");
        }
    }

    @Test
    @DisplayName("Reading one application admits the interviewer")
    void readAdmitsInterviewer() throws IOException {
        String source = read(CONTROLLER);
        int at = source.indexOf("public ResponseEntity<?> getApplication(");
        assertTrue(at > 0, "getApplication not found — did it move?");

        String preceding = source.substring(Math.max(0, at - 400), at);
        assertTrue(preceding.contains("INTERVIEWER"),
                "the single-application read must admit INTERVIEWER");
    }

    @Test
    @DisplayName("No write route admits the interviewer")
    void writesStillExcludeInterviewer() throws IOException {
        String source = read(CONTROLLER);
        // Each mapping annotation, with whatever @PreAuthorize follows it before the method body.
        Matcher m = Pattern.compile(
                "@(Post|Put|Patch|Delete)Mapping\\([^)]*\\)\\s*(@[^\\n]*\\n\\s*)*?@PreAuthorize\\(\"([^\"]*)\"\\)")
                .matcher(source);

        int checked = 0;
        while (m.find()) {
            checked++;
            assertFalse(m.group(3).contains("INTERVIEWER"),
                    "a write route admits INTERVIEWER: " + m.group(0).replaceAll("\\s+", " "));
        }
        assertTrue(checked >= 4, "expected to inspect several write routes, saw " + checked);
    }
}
