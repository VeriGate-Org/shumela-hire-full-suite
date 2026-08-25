package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the two {@code /api/interviews} URL rules against the controller they front.
 *
 * <p>A candidate could not load their own interview data. The self-service path
 * {@code /api/interviews/application/**} admitted {@code APPLICANT} but not {@code EMPLOYEE}, so an
 * employee applying for an internal vacancy silently got an empty list — {@code ApplicantDashboard}
 * catches the 403 and renders nothing.
 *
 * <p><b>Only the narrow rule was widened.</b> The catch-all still excludes candidates entirely, so
 * the URL layer remains a real second gate rather than a formality leaning on annotations. That
 * matters here more than usual: {@code InterviewController} carries a single class-level
 * {@code @PreAuthorize}, and a method-level one <em>replaces</em> it, so a future method-level
 * annotation on any other endpoint would silently drop the class-level restriction. The URL rule is
 * what would still refuse a candidate if that happened.
 */
class InterviewAuthorisationTest {

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/InterviewController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    private Set<String> urlRuleRoles(String source, String path) {
        Matcher m = Pattern.compile(
                "requestMatchers\\(new AntPathRequestMatcher\\(\"" + Pattern.quote(path)
                        + "\"\\)\\)\\s*\\.hasAnyRole\\(([^)]*)\\)")
                .matcher(source);
        assertTrue(m.find(), "no " + path + " rule found — did the path change?");
        return Pattern.compile("\"([A-Z_]+)\"").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toCollection(TreeSet::new));
    }

    @Test
    @DisplayName("Both security configs grant interviews to the same roles")
    void urlRulesAgreeWithEachOther() throws IOException {
        for (String path : List.of("/api/interviews/application/**", "/api/interviews/**")) {
            Set<String> first = urlRuleRoles(read(CONFIGS.get(0)), path);
            for (Path p : CONFIGS) {
                assertEquals(first, urlRuleRoles(read(p), path),
                        p.getFileName() + " grants a different set for " + path);
            }
        }
    }

    @Test
    @DisplayName("A candidate can reach their own application's interviews")
    void selfServicePathAdmitsCandidates() {
        Set<String> roles;
        try {
            roles = urlRuleRoles(read(CONFIGS.get(0)), "/api/interviews/application/**");
        } catch (IOException e) {
            throw new AssertionError(e);
        }

        // EMPLOYEE was the one missing. An employee applying internally is a candidate like any
        // other, and the dashboard swallowed the 403 rather than showing it.
        assertTrue(roles.contains("APPLICANT"), roles.toString());
        assertTrue(roles.contains("EMPLOYEE"), roles.toString());
    }

    @Test
    @DisplayName("The catch-all still refuses candidates, so the URL layer stays a real gate")
    void catchAllStaysClosedToCandidates() throws IOException {
        Set<String> roles = urlRuleRoles(read(CONFIGS.get(0)), "/api/interviews/**");

        assertFalse(roles.contains("APPLICANT"), roles.toString());
        assertFalse(roles.contains("EMPLOYEE"), roles.toString());
    }

    @Test
    @DisplayName("Only the by-application read is opened to a candidate, and it checks ownership")
    void onlyOneEndpointOverridesTheClassRule() throws IOException {
        String source = read(CONTROLLER);

        // A method-level @PreAuthorize replaces the class-level one. Exactly one method does that,
        // and it is the self-service read. If a second ever appears, this fails and somebody has to
        // decide whether that endpoint should still be refusing candidates.
        long methodLevel = source.lines().filter(l -> l.startsWith("    @PreAuthorize")).count();
        assertEquals(1, methodLevel,
                "a new method-level @PreAuthorize silently drops the class-level restriction");

        assertTrue(source.contains("@PreAuthorize(\"hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', "
                        + "'HIRING_MANAGER', 'INTERVIEWER')\")\npublic class InterviewController"),
                "the class-level rule is what keeps every other endpoint closed to candidates");
        assertTrue(source.contains("@applicantAccess.ownsApplication(authentication, #applicationId)"),
                "the by-application read must check that the application is the caller's own");
    }
}
