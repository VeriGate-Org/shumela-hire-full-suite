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
 * Pins the {@code /api/offers/**} URL rule to the roles the endpoints actually name.
 *
 * <p>Same shape as {@link ShortlistingAuthorisationTest} and the same reason: Spring evaluates
 * {@code requestMatchers} in the filter chain <em>before</em> any {@code @PreAuthorize}, so where
 * the two disagree the URL rule wins silently and the annotation becomes decoration. Offers had
 * this twice over. {@code HIRING_MANAGER} was absent from the URL rule while
 * {@code OfferManagement} already offered hiring managers the withdraw action, and
 * {@code EMPLOYEE} was added to eight applicant-facing endpoints without ever being added to the
 * rule — so a hired employee looking at their own offer got a 403 from a method that explicitly
 * permitted them.</p>
 *
 * <p>Reads the source rather than standing up a security context, because the failure guarded
 * against is a <em>divergence between three files</em>. A runtime test of one endpoint would pass
 * while the other twenty-five quietly disagreed.</p>
 */
class OfferAuthorisationTest {

    /** Roles that may reach any offer endpoint. Per-endpoint narrowing is the annotation's job. */
    private static final Set<String> EXPECTED_URL_RULE =
            Set.of("ADMIN", "HR_MANAGER", "HIRING_MANAGER", "APPLICANT", "EMPLOYEE");

    /** Everyone who manages an offer: create, edit, approve, send, withdraw, search, analytics. */
    private static final Set<String> MANAGE =
            Set.of("ADMIN", "HR_MANAGER", "HIRING_MANAGER");

    /** Managers plus the candidate's own view-and-respond endpoints. */
    private static final Set<String> MANAGE_AND_CANDIDATE =
            Set.of("ADMIN", "HR_MANAGER", "HIRING_MANAGER", "APPLICANT", "EMPLOYEE");

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/OfferController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    /** Roles named on the /api/offers/** URL rule in a security config. */
    private Set<String> urlRuleRoles(String source) {
        Matcher m = Pattern.compile(
                "requestMatchers\\(new AntPathRequestMatcher\\(\"/api/offers/\\*\\*\"\\)\\)\\s*\\.hasAnyRole\\(([^)]*)\\)")
                .matcher(source);
        assertTrue(m.find(), "no /api/offers/** rule found — did the path change?");
        return Pattern.compile("\"([A-Z_]+)\"").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toSet());
    }

    /** Roles named on each @PreAuthorize in the controller, in source order. */
    private List<Set<String>> annotationRoles(String source) {
        return Pattern.compile("@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)\"\\)").matcher(source).results()
                .map(r -> Pattern.compile("'([A-Z_]+)'").matcher(r.group(1)).results()
                        .map(x -> x.group(1)).collect(Collectors.toSet()))
                .collect(Collectors.toList());
    }

    @Test
    @DisplayName("Both security configs grant offers to the same roles")
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
        List<Set<String>> annotations = annotationRoles(read(CONTROLLER));

        assertEquals(26, annotations.size(),
                "expected twenty-six guarded endpoints — an unguarded one would be worse "
                        + "than a mismatched one");

        for (int i = 0; i < annotations.size(); i++) {
            Set<String> deniedInPractice = annotations.get(i).stream()
                    .filter(r -> !urlRule.contains(r))
                    .collect(Collectors.toCollection(TreeSet::new));
            assertEquals(Set.of(), deniedInPractice,
                    "endpoint " + i + " names " + deniedInPractice + ", which the URL rule rejects; "
                            + "the URL rule wins at runtime, so the annotation would be a lie");
        }
    }

    @Test
    @DisplayName("Every endpoint grants either the manage set or the manage-and-candidate set")
    void everyEndpointUsesOneOfTheTwoVocabularies() throws IOException {
        List<Set<String>> annotations = annotationRoles(read(CONTROLLER));

        for (int i = 0; i < annotations.size(); i++) {
            Set<String> roles = annotations.get(i);
            assertTrue(roles.equals(MANAGE) || roles.equals(MANAGE_AND_CANDIDATE),
                    "endpoint " + i + " grants " + new TreeSet<>(roles) + ", which is neither the "
                            + "manage set " + new TreeSet<>(MANAGE) + " nor the manage-and-candidate "
                            + "set " + new TreeSet<>(MANAGE_AND_CANDIDATE) + "; a one-off role list "
                            + "on a single endpoint is how these drift apart");
        }
    }

    @Test
    @DisplayName("Creating an offer is a manage action, not a candidate one")
    void creatingAnOfferIsAManageAction() throws IOException {
        String source = read(CONTROLLER);

        Matcher m = Pattern.compile(
                "@PostMapping\\(\"/applications/\\{applicationId\\}\"\\)\\s*"
                        + "@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)\"\\)")
                .matcher(source);
        assertTrue(m.find(), "no guarded POST /applications/{applicationId} — did create move?");

        Set<String> roles = Pattern.compile("'([A-Z_]+)'").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toCollection(TreeSet::new));

        assertEquals(new TreeSet<>(MANAGE), roles,
                "a candidate must never be able to create their own offer");
    }

    @Test
    @DisplayName("A role on an endpoint but missing from the URL rule is the bug being guarded")
    void divergenceIsWhatBreaks() {
        Set<String> annotation = Set.of("ADMIN", "HR_MANAGER", "APPLICANT", "EMPLOYEE");
        Set<String> urlRule = Set.of("ADMIN", "HR_MANAGER", "APPLICANT");   // the old state

        Set<String> deniedInPractice = annotation.stream()
                .filter(r -> !urlRule.contains(r)).collect(Collectors.toSet());

        assertEquals(Set.of("EMPLOYEE"), deniedInPractice,
                "this is exactly what 403'd a hired employee viewing their own offer");
    }
}
