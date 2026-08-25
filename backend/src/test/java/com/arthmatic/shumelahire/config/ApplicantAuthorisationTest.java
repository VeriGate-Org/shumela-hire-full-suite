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
 * Pins the {@code /api/applicants/**} URL rule against the endpoints it fronts.
 *
 * <p>The sixth appearance of the bug {@link ApplicationAuthorisationTest} documents: Spring
 * evaluates {@code requestMatchers} in the filter chain before any {@code @PreAuthorize}, so where
 * the two disagree the URL rule wins silently and the annotation becomes decoration. Applicants was
 * the one path in that family with no test.
 *
 * <p>It had diverged. Six endpoints named {@code EMPLOYEE} in their annotations while the URL rule
 * withheld it, so {@code EmployeeDashboard} — which resolves the signed-in employee's own applicant
 * record to list their applications and interviews — was taking a 403 and rendering empty. The
 * annotations said employees had self-service; the filter chain said they had nothing.
 *
 * <p>Granting {@code EMPLOYEE} at the URL layer is only safe because the annotations now check
 * ownership rather than role alone. Before that, adding it here would have opened the whole
 * applicant table.
 */
class ApplicantAuthorisationTest {

    /**
     * Everyone who may reach any applicant endpoint.
     *
     * <p>Per-endpoint narrowing is the annotation's job: the list is staff-only, and the id-scoped
     * endpoints admit a candidate only for their own record.
     */
    private static final Set<String> EXPECTED_URL_RULE =
            Set.of("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "APPLICANT", "EMPLOYEE");

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/ApplicantController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    private Set<String> urlRuleRoles(String source) {
        Matcher m = Pattern.compile(
                "requestMatchers\\(new AntPathRequestMatcher\\(\"/api/applicants/\\*\\*\"\\)\\)"
                        + "\\s*\\.hasAnyRole\\(([^)]*)\\)")
                .matcher(source);
        assertTrue(m.find(), "no /api/applicants/** rule found — did the path change?");
        return Pattern.compile("\"([A-Z_]+)\"").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toCollection(TreeSet::new));
    }

    @Test
    @DisplayName("Both security configs grant applicants to the same roles")
    void urlRulesAgreeWithEachOther() throws IOException {
        Set<String> first = urlRuleRoles(read(CONFIGS.get(0)));
        for (Path p : CONFIGS) {
            assertEquals(first, urlRuleRoles(read(p)),
                    p.getFileName() + " grants a different set — dev and cloud must not diverge");
        }
    }

    @Test
    @DisplayName("The URL rule admits every role the endpoints rely on")
    void urlRuleAdmitsEveryRoleTheEndpointsNeed() throws IOException {
        for (Path p : CONFIGS) {
            assertEquals(new TreeSet<>(EXPECTED_URL_RULE), urlRuleRoles(read(p)),
                    p.getFileName().toString());
        }
    }

    @Test
    @DisplayName("A candidate can reach the self-lookup through the filter chain")
    void selfLookupIsReachableByCandidatesAndEmployees() throws IOException {
        // /api/applicants/me is authorised isAuthenticated() at the method, so the URL rule is the
        // only thing that can refuse it. If either role were dropped from the rule, every
        // self-service page would 403 while the annotation still claimed to allow it.
        Set<String> urlRule = urlRuleRoles(read(CONFIGS.get(0)));

        assertTrue(urlRule.contains("APPLICANT"), "candidates could not resolve their own record");
        assertTrue(urlRule.contains("EMPLOYEE"), "employees could not resolve their own record");
    }

    @Test
    @DisplayName("No applicant endpoint grants a candidate by role alone")
    void noEndpointGrantsCandidatesByRole() throws IOException {
        // The URL rule deliberately admits APPLICANT and EMPLOYEE so self-service is reachable.
        // That makes the annotations the only thing standing between a signed-in candidate and
        // everybody else's record, so none of them may fall back to a bare role grant.
        String source = read(CONTROLLER);

        List<String> roleGrants = Pattern
                .compile("@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)")
                .matcher(source).results()
                .map(r -> r.group(1))
                .filter(roles -> roles.contains("'APPLICANT'") || roles.contains("'EMPLOYEE'"))
                .collect(Collectors.toList());

        // createApplicant is the one legitimate case: registering is not addressed by an id, so
        // there is no record to own yet.
        assertEquals(1, roleGrants.size(),
                "only applicant creation may name a candidate role: " + roleGrants);
        assertFalse(source.contains("@GetMapping\n    @PreAuthorize(\"hasAnyRole('ADMIN', 'HR_MANAGER', "
                        + "'RECRUITER', 'HIRING_MANAGER', 'APPLICANT', 'EMPLOYEE')\")"),
                "the applicant list is staff-only");
    }
}
