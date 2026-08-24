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
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the {@code /api/applications/**} URL rule to the roles the endpoints themselves name.
 *
 * <p>The fifth appearance of one bug. Spring evaluates {@code requestMatchers} in the filter chain
 * before any {@code @PreAuthorize}, so where the two disagree the URL rule wins silently and the
 * annotation becomes decoration. It has now been found on shortlisting (#191), offers, the audit
 * trail (#244), and here: {@code ApplicationController.submitApplication} explicitly granted
 * {@code EMPLOYEE} while the URL rule withheld it, so an employee could not apply for an internal
 * vacancy at all — the entire point of the Internal Jobs feature, 403 on submit, in production.
 *
 * <p>Reads the source rather than standing up a security context, because the failure guarded
 * against is a <em>divergence between three files</em>. A runtime test of one endpoint would pass
 * while the others quietly disagreed.</p>
 */
class ApplicationAuthorisationTest {

    /**
     * Everyone who may reach any application endpoint. Per-endpoint narrowing is the annotation's
     * job: management operations withhold APPLICANT and EMPLOYEE by themselves.
     */
    private static final Set<String> EXPECTED_URL_RULE =
            Set.of("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "APPLICANT", "EMPLOYEE");

    /** The applicant-facing set: apply, see your own, withdraw, check eligibility. */
    private static final Set<String> SELF_SERVICE =
            Set.of("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "APPLICANT", "EMPLOYEE");

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/ApplicationController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    private Set<String> urlRuleRoles(String source) {
        Matcher m = Pattern.compile(
                "requestMatchers\\(new AntPathRequestMatcher\\(\"/api/applications/\\*\\*\"\\)\\)\\s*\\.hasAnyRole\\(([^)]*)\\)")
                .matcher(source);
        assertTrue(m.find(), "no /api/applications/** rule found — did the path change?");
        return Pattern.compile("\"([A-Z_]+)\"").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toSet());
    }

    private List<Set<String>> annotationRoles(String source) {
        return Pattern.compile("@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)\"\\)").matcher(source).results()
                .map(r -> Pattern.compile("'([A-Z_]+)'").matcher(r.group(1)).results()
                        .map(x -> x.group(1)).collect(Collectors.toSet()))
                .collect(Collectors.toList());
    }

    /** Roles on the handler whose mapping annotation matches {@code mapping}. */
    private Set<String> rolesFor(String source, String mapping) {
        Matcher m = Pattern.compile(
                Pattern.quote(mapping) + "\\s*@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)\"\\)")
                .matcher(source);
        assertTrue(m.find(), "no guarded " + mapping + " — did it move?");
        return Pattern.compile("'([A-Z_]+)'").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toCollection(TreeSet::new));
    }

    @Test
    @DisplayName("Both security configs grant applications to the same roles")
    void urlRulesAgreeWithEachOther() throws IOException {
        Set<String> first = urlRuleRoles(read(CONFIGS.get(0)));
        for (Path p : CONFIGS) {
            assertEquals(first, urlRuleRoles(read(p)),
                    p.getFileName() + " grants a different set — dev and cloud must not diverge");
        }
    }

    @Test
    @DisplayName("The URL rule admits every role the endpoints name")
    void urlRuleAdmitsEveryRoleTheEndpointsName() throws IOException {
        for (Path p : CONFIGS) {
            assertEquals(new TreeSet<>(EXPECTED_URL_RULE), new TreeSet<>(urlRuleRoles(read(p))),
                    p.getFileName().toString());
        }
    }

    @Test
    @DisplayName("No endpoint names a role the URL rule would reject")
    void noEndpointNamesARoleTheUrlRuleRejects() throws IOException {
        Set<String> urlRule = urlRuleRoles(read(CONFIGS.get(0)));

        for (Set<String> roles : annotationRoles(read(CONTROLLER))) {
            Set<String> deniedInPractice = roles.stream()
                    .filter(r -> !urlRule.contains(r))
                    .collect(Collectors.toCollection(TreeSet::new));
            assertEquals(Set.of(), deniedInPractice,
                    "an endpoint names " + deniedInPractice + ", which the URL rule rejects; the URL "
                            + "rule wins at runtime, so the annotation would be a lie");
        }
    }

    @Test
    @DisplayName("An employee can submit an application")
    void anEmployeeCanSubmitAnApplication() throws IOException {
        // The bug itself: internal mobility is the whole point of the Internal Jobs feature, and
        // an EMPLOYEE is exactly who uses it.
        assertTrue(rolesFor(read(CONTROLLER), "@PostMapping\n").contains("EMPLOYEE"),
                "submitApplication must admit EMPLOYEE");
        for (Path p : CONFIGS) {
            assertTrue(urlRuleRoles(read(p)).contains("EMPLOYEE"),
                    p.getFileName() + " must admit EMPLOYEE, or the annotation above is decoration");
        }
    }

    @Test
    @DisplayName("An employee gets the same self-service reach as an applicant")
    void anEmployeeMatchesAnApplicantOnSelfService() throws IOException {
        String source = read(CONTROLLER);
        for (String mapping : List.of(
                "@PostMapping\n",
                "@GetMapping(\"/applicant/{applicantId}\")\n",
                "@PostMapping(\"/{id}/withdraw\")\n",
                "@GetMapping(\"/can-apply\")\n")) {
            assertEquals(new TreeSet<>(SELF_SERVICE), rolesFor(source, mapping),
                    mapping.trim() + " should treat an employee exactly as it treats an applicant");
        }
    }

    @Test
    @DisplayName("Widening the rule did not open the management endpoints")
    void managementEndpointsStayClosedToEmployees() throws IOException {
        String source = read(CONTROLLER);
        for (String mapping : List.of(
                "@PutMapping(\"/{id}/status\")\n",
                "@PostMapping(\"/{id}/rate\")\n",
                "@DeleteMapping(\"/{id}\")\n",
                "@GetMapping(\"/statistics\")\n")) {
            Set<String> roles = rolesFor(source, mapping);
            assertTrue(!roles.contains("EMPLOYEE") && !roles.contains("APPLICANT"),
                    mapping.trim() + " must not be reachable by a candidate — the URL rule is a "
                            + "coarse gate and the annotation is what actually narrows it");
        }
    }
}
