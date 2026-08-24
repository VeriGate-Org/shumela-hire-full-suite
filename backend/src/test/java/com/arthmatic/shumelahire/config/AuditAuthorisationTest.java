package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the URL rules for the audit endpoints to the roles the controller intends.
 *
 * <p>The same shape as {@code ShortlistingAuthorisationTest} and issue #191, and it had already
 * happened again here: {@code /api/audit/**} was restricted to ADMIN and HR_MANAGER while
 * {@code AuditLogController.getAuditLogsByEntity} declared ADMIN, HR_MANAGER, RECRUITER and
 * HIRING_MANAGER. The URL rule is evaluated first, so the annotation was decoration and the audit
 * trail on a requisition returned 403 to exactly the people who work requisitions. The proof was
 * {@code /api/audit/health}, which carries no {@code @PreAuthorize} at all and still returned 403 to
 * a hiring manager on production.</p>
 *
 * <p>Two properties are guarded, and the second is the load-bearing one:</p>
 * <ol>
 *   <li>the entity rule names the same roles as the annotation; and</li>
 *   <li>it appears <em>before</em> the broad {@code /api/audit/**} rule. Spring takes the first
 *       matching rule, so an entity rule placed after the broad one is inert — it would look
 *       correct in review and change nothing at runtime.</li>
 * </ol>
 *
 * <p>Read from source rather than from a running security context, because the failure guarded
 * against is a divergence between three files. A runtime test of one endpoint would pass while the
 * others quietly disagreed.</p>
 */
class AuditAuthorisationTest {

    private static final Set<String> ENTITY_READERS =
            Set.of("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER");

    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/AuditLogController.java");
    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/java/com/arthmatic/shumelahire/config/SecurityConfig.java"),
            Path.of("src/main/java/com/arthmatic/shumelahire/config/CognitoSecurityConfig.java"));

    private String read(Path p) throws IOException {
        return Files.readString(p);
    }

    /** Character offset of a requestMatchers rule for the given path, or -1. */
    private int ruleIndex(String source, String path) {
        Matcher m = Pattern.compile("requestMatchers\\(new AntPathRequestMatcher\\(\"" + Pattern.quote(path) + "\"")
                .matcher(source);
        return m.find() ? m.start() : -1;
    }

    /** Roles named on the rule for the given path. */
    private Set<String> ruleRoles(String source, String path) {
        int at = ruleIndex(source, path);
        assertTrue(at >= 0, "no rule found for " + path + " — did the path change?");
        String window = source.substring(at, Math.min(source.length(), at + 400));
        Matcher m = Pattern.compile("hasAnyRole\\(([^)]*)\\)").matcher(window);
        assertTrue(m.find(), "rule for " + path + " does not use hasAnyRole");
        return Pattern.compile("\"([A-Z_]+)\"").matcher(m.group(1)).results()
                .map(r -> r.group(1)).collect(Collectors.toSet());
    }

    /** Roles named on the @PreAuthorize immediately above getAuditLogsByEntity. */
    private Set<String> entityEndpointAnnotationRoles(String controller) {
        int at = controller.indexOf("getAuditLogsByEntity");
        assertTrue(at >= 0, "getAuditLogsByEntity not found — did the endpoint move?");
        String before = controller.substring(Math.max(0, at - 400), at);
        Matcher m = Pattern.compile("@PreAuthorize\\(\"hasAnyRole\\(([^)]*)\\)\"\\)").matcher(before);
        String last = null;
        while (m.find()) {
            last = m.group(1);
        }
        assertTrue(last != null, "no @PreAuthorize found on the entity endpoint");
        return Pattern.compile("'([A-Z_]+)'").matcher(last).results()
                .map(r -> r.group(1)).collect(Collectors.toSet());
    }

    @Test
    @DisplayName("The entity audit rule grants the same roles the controller declares")
    void entityRuleMatchesTheAnnotation() throws IOException {
        Set<String> annotation = entityEndpointAnnotationRoles(read(CONTROLLER));
        assertEquals(ENTITY_READERS, annotation,
                "the entity endpoint's @PreAuthorize changed; update this test deliberately");

        for (Path p : CONFIGS) {
            assertEquals(annotation, ruleRoles(read(p), "/api/audit/entity/**"),
                    p.getFileName() + " grants different roles than the controller declares, so the "
                            + "annotation is decoration and the caller gets a 403 it cannot explain");
        }
    }

    @Test
    @DisplayName("The entity rule precedes the broad audit rule, or it never applies")
    void entityRuleIsEvaluatedFirst() throws IOException {
        for (Path p : CONFIGS) {
            String source = read(p);
            int entity = ruleIndex(source, "/api/audit/entity/**");
            int broad = ruleIndex(source, "/api/audit/**");

            assertTrue(entity >= 0, p.getFileName() + " has no /api/audit/entity/** rule");
            assertTrue(broad >= 0, p.getFileName() + " has no /api/audit/** rule");
            assertTrue(entity < broad,
                    p.getFileName() + " declares the entity rule after the broad one. Spring takes the "
                            + "first match, so the entity rule is dead and hiring managers still get 403.");
        }
    }

    @Test
    @DisplayName("Widening the entity lookup does not widen the whole audit log")
    void broadAuditRuleStaysAdministrative() throws IOException {
        for (Path p : CONFIGS) {
            Set<String> broad = ruleRoles(read(p), "/api/audit/**");
            assertEquals(Set.of("ADMIN", "HR_MANAGER"), broad,
                    p.getFileName() + ": /api/audit/all, /user, /action and /range expose the whole "
                            + "tenant's trail and must stay administrative");
            assertFalse(broad.contains("RECRUITER") || broad.contains("HIRING_MANAGER"),
                    "a recruiter must not be able to read every audit entry in the tenant");
        }
    }

    @Test
    @DisplayName("The entity rule is confined to GET")
    void entityRuleIsReadOnly() throws IOException {
        for (Path p : CONFIGS) {
            String source = read(p);
            int at = ruleIndex(source, "/api/audit/entity/**");
            String window = source.substring(at, Math.min(source.length(), at + 200));
            assertTrue(window.contains("\"GET\""),
                    p.getFileName() + ": the widened rule must cover the read only");
        }
    }
}
