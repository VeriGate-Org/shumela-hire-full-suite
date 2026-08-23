package com.arthmatic.shumelahire.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Every role named in a {@code @PreAuthorize} must be a role this system actually has.
 *
 * <p>{@code BackgroundCheckController} gated all nine of its endpoints on
 * {@code hasAnyRole('ADMIN', 'RECRUITER', 'TA_MANAGER')}. There is no TA_MANAGER. The expression
 * still compiled, still ran, and still returned 403 — it simply admitted two roles instead of the
 * three it appeared to name, and nothing anywhere reported that one third of the rule was dead.</p>
 *
 * <p>A misspelled role fails closed, which is the safe direction and exactly why it survives: no
 * error, no log line, just a role quietly locked out. Here it locked out HR_MANAGER and the hiring
 * manager who owns the vacancy, so verification results were invisible to the people who needed
 * them — discovered only by loading the screen as her.</p>
 *
 * <p>Deliberately a text scan rather than a Spring test: the defect is a string inside an
 * annotation, and no amount of context loading will notice that the string is fictional.</p>
 */
class RoleVocabularyTest {

    private static final Path CONTROLLERS =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller");
    /** The Role enum is nested inside User, not a file of its own. */
    private static final Path USER_ROLE =
            Path.of("src/main/java/com/arthmatic/shumelahire/entity/User.java");

    private static final Pattern HAS_ROLE = Pattern.compile("hasAnyRole\\(([^)]*)\\)|hasRole\\(([^)]*)\\)");
    private static final Pattern QUOTED = Pattern.compile("'([A-Z_]{3,})'");

    /** The role vocabulary, read from the enum rather than restated here. */
    private Set<String> knownRoles() throws IOException {
        String src = Files.readString(USER_ROLE);
        int at = src.indexOf("public enum Role {");
        if (at < 0) return Set.of();
        String block = src.substring(at, src.indexOf(";", at) + 1);

        Set<String> roles = new LinkedHashSet<>();
        Matcher m = Pattern.compile("([A-Z][A-Z_]{2,})\\s*\\(").matcher(block);
        while (m.find()) roles.add(m.group(1));
        return roles;
    }

    @Test
    @DisplayName("No @PreAuthorize names a role that does not exist")
    void everyGatedRoleExists() throws IOException {
        Set<String> known = knownRoles();
        assertTrue(known.size() >= 5,
                "expected to parse the role enum but found " + known + " — the pattern has drifted");

        List<String> offences = new ArrayList<>();
        try (Stream<Path> files = Files.walk(CONTROLLERS)) {
            for (Path p : files.filter(Files::isRegularFile)
                    .filter(f -> f.toString().endsWith(".java")).toList()) {
                // Strip comments first: this file's own notes quote the broken expression, and a
                // guard that flags documentation of a defect is a guard nobody keeps.
                String src = Files.readString(p)
                        .replaceAll("(?s)/\\*.*?\\*/", "")
                        .replaceAll("(?m)//.*$", "");
                Matcher m = HAS_ROLE.matcher(src);
                while (m.find()) {
                    String args = m.group(1) != null ? m.group(1) : m.group(2);
                    Matcher q = QUOTED.matcher(args);
                    while (q.find()) {
                        String role = q.group(1);
                        if (!known.contains(role)) {
                            offences.add(p.getFileName() + " → " + role);
                        }
                    }
                }
            }
        }

        assertTrue(offences.isEmpty(),
                "These @PreAuthorize expressions name roles that do not exist, so they fail closed "
                        + "and silently lock out whoever was meant to be admitted: " + offences
                        + ". Known roles: " + known);
    }
}
