package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the URL rule and the method annotations for shortlisting to the same set of roles.
 *
 * <p>Spring evaluates {@code requestMatchers} in the filter chain <em>before</em> any
 * {@code @PreAuthorize} on the handler, so where the two disagree the URL rule silently wins and the
 * annotation becomes decoration. That is not hypothetical here: {@code /scores} already listed
 * {@code HIRING_MANAGER} while the URL rule did not, so Yolanda — a hiring manager looking at her
 * own vacancy — got a 403 from a method that explicitly permitted her. The same shape is recorded
 * as issue #191.</p>
 *
 * <p>This reads the source rather than standing up a security context, because the failure being
 * guarded against is a <em>divergence between two files</em>. A runtime test of one endpoint would
 * pass while the other three quietly disagreed.</p>
 */
class ShortlistingAuthorisationTest {

    private static final Set<String> EXPECTED =
            Set.of("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER");

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/ShortlistingController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    /** Roles named on the /api/shortlisting/** URL rule in a security config. */
    private Set<String> urlRuleRoles(String source) {
        Matcher m = Pattern.compile(
                "requestMatchers\\(new AntPathRequestMatcher\\(\"/api/shortlisting/\\*\\*\"\\)\\)\\s*\\.hasAnyRole\\(([^)]*)\\)")
                .matcher(source);
        assertTrue(m.find(), "no /api/shortlisting/** rule found — did the path change?");
        return Pattern.compile("\"([A-Z_]+)\"").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toSet());
    }

    /**
     * Every request-mapping annotation on a <em>method</em> — i.e. every reachable endpoint.
     *
     * <p>Anchored to a line with leading indentation so the class-level
     * {@code @RequestMapping("/api/shortlisting")}, which sits in column 0 and is a path prefix
     * rather than an endpoint, is not counted as a sixth handler.
     */
    private int endpointCount(String source) {
        return (int) Pattern.compile("^[ \\t]+@(Get|Post|Put|Patch|Delete|Request)Mapping\\(",
                        Pattern.MULTILINE)
                .matcher(source).results().count();
    }

    /** Roles named on each @PreAuthorize in the controller. */
    private List<Set<String>> annotationRoles(String source) {
        return Pattern.compile("@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)\"\\)").matcher(source).results()
                .map(r -> Pattern.compile("'([A-Z_]+)'").matcher(r.group(1)).results()
                        .map(x -> x.group(1)).collect(Collectors.toSet()))
                .collect(Collectors.toList());
    }

    @Test
    @DisplayName("Both security configs grant shortlisting to the same roles")
    void urlRulesAgreeWithEachOther() throws IOException {
        Set<String> first = urlRuleRoles(read(CONFIGS.get(0)));
        for (Path p : CONFIGS) {
            assertEquals(first, urlRuleRoles(read(p)),
                    p.getFileName() + " grants a different set — dev and cloud must not diverge");
        }
    }

    @Test
    @DisplayName("The URL rule includes the hiring manager")
    void urlRuleIncludesHiringManager() throws IOException {
        for (Path p : CONFIGS) {
            assertEquals(EXPECTED, urlRuleRoles(read(p)), p.getFileName().toString());
        }
    }

    @Test
    @DisplayName("Every shortlisting endpoint grants the same roles as the URL rule")
    void annotationsMatchTheUrlRule() throws IOException {
        String controller = read(CONTROLLER);
        Set<String> urlRule = urlRuleRoles(read(CONFIGS.get(0)));
        List<Set<String>> annotations = annotationRoles(controller);

        // Compare against the number of endpoints actually declared rather than a literal. The
        // point of this assertion is "no endpoint is unguarded", and a hardcoded count only says
        // that by coincidence: adding a guarded endpoint failed the test, which trains whoever
        // sees it to bump the number — the same edit an unguarded endpoint would need.
        assertEquals(endpointCount(controller), annotations.size(),
                "every shortlisting endpoint must carry @PreAuthorize — an unguarded one would be "
                        + "worse than a mismatched one");

        for (int i = 0; i < annotations.size(); i++) {
            assertEquals(urlRule, annotations.get(i),
                    "endpoint " + i + " disagrees with the URL rule; the URL rule wins at runtime, "
                            + "so the annotation would be a lie");
        }
    }

    @Test
    @DisplayName("A role listed on an endpoint but missing from the URL rule is the bug being guarded")
    void divergenceIsWhatBreaks() {
        Set<String> annotation = Set.of("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER");
        Set<String> urlRule = Set.of("ADMIN", "HR_MANAGER", "RECRUITER");   // the old state

        Set<String> deniedInPractice = annotation.stream()
                .filter(r -> !urlRule.contains(r)).collect(Collectors.toSet());

        assertEquals(Set.of("HIRING_MANAGER"), deniedInPractice,
                "this is exactly what produced Yolanda's 403 on /scores");
    }
}
