package com.arthmatic.shumelahire;

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
 * Every feature code the UI gates on must exist in the platform catalogue seed.
 *
 * <p>This exists because two AI panels shipped invisible. {@code AiAssistPanel} wraps its children
 * in {@code <FeatureGate feature={code}>}, and FeatureGate treats an <b>unknown</b> code exactly
 * like a disabled one — it renders nothing and says nothing. So a typo in a feature code is not a
 * crash, a failed build, or a red test; it is a control that silently does not exist.</p>
 *
 * <p>What made it worse is how well it hides. The component compiled, the endpoint worked, the
 * bundle contained the code, {@code tsc} was clean and every unit test passed. The only way to see
 * it was to load the page as a user on a tenant whose plan included the feature. Two of three
 * placements were wrong — {@code AI_SMART_SEARCH} where the catalogue says {@code AI_SEARCH}, and
 * {@code AI_INTERVIEW_QUESTIONS} which had no catalogue row at all — and the third worked, which is
 * precisely what made it look like the placements were fine.</p>
 *
 * <p>Deliberately a text comparison across the two files rather than a Spring test: the failure is a
 * mismatch between a TypeScript literal and a Python seed list, and nothing that boots a context
 * would notice it.</p>
 */
class FeatureCatalogueCoverageTest {

    private static final Path UI_ROOT = Path.of("../src");
    private static final Path SEED = Path.of("../scripts/seed-platform-features-dynamodb.py");

    /** feature="SOME_CODE" or feature={"SOME_CODE"} in a .tsx file. */
    private static final Pattern USED = Pattern.compile("feature=[{\"]+([A-Z][A-Z0-9_]{3,})");

    /** ('SOME_CODE', 'Display name', ... in the seed's tuple list. */
    private static final Pattern SEEDED = Pattern.compile("\\(\\s*'([A-Z][A-Z0-9_]{3,})'\\s*,");

    private Set<String> codesUsedInUi() throws IOException {
        Set<String> found = new LinkedHashSet<>();
        try (Stream<Path> files = Files.walk(UI_ROOT)) {
            List<Path> tsx = files.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".tsx"))
                    .toList();
            for (Path p : tsx) {
                Matcher m = USED.matcher(Files.readString(p));
                while (m.find()) found.add(m.group(1));
            }
        }
        return found;
    }

    private Set<String> codesInSeed() throws IOException {
        Set<String> found = new LinkedHashSet<>();
        Matcher m = SEEDED.matcher(Files.readString(SEED));
        while (m.find()) found.add(m.group(1));
        return found;
    }

    @Test
    @DisplayName("Every feature code gated in the UI exists in the platform catalogue")
    void everyGatedCodeIsSeeded() throws IOException {
        Set<String> used = codesUsedInUi();
        Set<String> seeded = codesInSeed();

        // A guard that guards nothing is worse than none — if the patterns stop matching, say so
        // rather than passing an empty comparison.
        assertTrue(used.size() >= 10,
                "expected to find feature codes in the UI but found " + used.size()
                        + " — the extraction pattern has probably drifted");
        assertTrue(seeded.size() >= 20,
                "expected a populated seed catalogue but found " + seeded.size()
                        + " — the extraction pattern has probably drifted");

        List<String> missing = new ArrayList<>(used);
        missing.removeAll(seeded);

        assertTrue(missing.isEmpty(),
                "These feature codes are gated in the UI but absent from the catalogue seed, so the "
                        + "controls they wrap render nothing and report no error: " + missing
                        + ". Either correct the code to an existing one or add it to "
                        + "scripts/seed-platform-features-dynamodb.py.");
    }
}
