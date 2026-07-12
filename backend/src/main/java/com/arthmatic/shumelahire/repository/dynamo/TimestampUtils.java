package com.arthmatic.shumelahire.repository.dynamo;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Utility for lenient timestamp parsing in DynamoDB repositories.
 * Handles both ISO-8601 local date-time format ("2026-07-12T19:30:00")
 * and instant format with Z suffix ("2026-07-12T19:30:00Z").
 */
public final class TimestampUtils {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private TimestampUtils() {}

    /**
     * Parse a timestamp string leniently into a LocalDateTime.
     * Handles both "2026-07-12T19:30:00" and "2026-07-12T19:30:00Z" formats.
     */
    public static LocalDateTime parseTimestamp(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDateTime.parse(s, ISO_FMT);
        } catch (DateTimeParseException e) {
            return LocalDateTime.ofInstant(Instant.parse(s), ZoneOffset.UTC);
        }
    }

    /**
     * Format a LocalDateTime to ISO-8601 local date-time string (without Z).
     */
    public static String formatTimestamp(LocalDateTime ldt) {
        return ldt != null ? ldt.format(ISO_FMT) : null;
    }
}
