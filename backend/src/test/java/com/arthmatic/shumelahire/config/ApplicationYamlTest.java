package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The configuration file has to survive being merged.
 *
 * <p><b>This exists because of a near miss.</b> Two branches each appended a top-level
 * {@code shumelahire:} block to the end of {@code application.yml} — one for approval thresholds,
 * one for talent pool retention. Each was correct alone, and each passed CI alone. Merged, the file
 * carries the same top-level key twice, and YAML does not merge those: one block wins and the other
 * silently disappears, taking its defaults with it.
 *
 * <p>That failure mode is invisible in review (both diffs look like additions to the end of a file),
 * invisible in a per-branch build, and shows up in production as a property that quietly reverted
 * to its fallback. For approval thresholds that would mean the rand figure deciding who signs off
 * on a salary reverting without anyone touching it.
 *
 * <p>Deliberately a text check rather than a YAML parse: SnakeYAML's behaviour on duplicate keys
 * depends on the version and settings, and the point is to catch the duplication before anything
 * has to decide what to do about it.
 */
class ApplicationYamlTest {

    private static final List<Path> CONFIGS = List.of(
            Path.of("src/main/resources/application.yml"),
            Path.of("src/main/resources/application-dev.yml"),
            Path.of("src/main/resources/application-prod.yml"),
            Path.of("src/main/resources/application-cloud.yml"),
            Path.of("src/main/resources/application-lambda.yml"));

    /**
     * Top-level keys in one document, in order.
     *
     * <p>A top-level key is a line starting at column zero that ends in a colon. Comments, blank
     * lines, list items and anything indented are skipped. {@code ---} starts a new document, where
     * repeating a key is legal, so counting restarts.
     */
    private List<String> topLevelKeys(String source) {
        List<String> keys = new ArrayList<>();
        for (String line : source.split("\n", -1)) {
            if (line.startsWith("---")) {
                keys.clear();
                continue;
            }
            if (line.isBlank() || line.startsWith("#") || line.startsWith(" ")
                    || line.startsWith("\t") || line.startsWith("-")) {
                continue;
            }
            int colon = line.indexOf(':');
            if (colon > 0) {
                keys.add(line.substring(0, colon).trim());
            }
        }
        return keys;
    }

    @Test
    @DisplayName("No configuration file declares the same top-level key twice")
    void noDuplicateTopLevelKeys() throws IOException {
        for (Path config : CONFIGS) {
            if (!Files.exists(config)) {
                continue;
            }
            List<String> keys = topLevelKeys(Files.readString(config));
            Set<String> unique = new LinkedHashSet<>(keys);

            List<String> duplicated = new ArrayList<>(keys);
            unique.forEach(duplicated::remove);

            assertEquals(List.of(), duplicated,
                    config.getFileName() + " declares these top-level keys more than once. YAML "
                            + "does not merge duplicate keys — one block wins and the other is "
                            + "silently discarded. Merge them into a single block.");
        }
    }

    @Test
    @DisplayName("The key check can actually see the keys it is checking")
    void thePartitionIsNotVacuous() throws IOException {
        // Without this, a parsing mistake that found no keys at all would report a clean file
        // forever. These two are the ones this test was written to protect.
        List<String> keys = topLevelKeys(Files.readString(CONFIGS.get(0)));

        assertTrue(keys.size() > 3, "found almost no top-level keys: " + keys);
        assertTrue(keys.contains("shumelahire"),
                "the shumelahire block is missing from application.yml: " + keys);
    }
}
