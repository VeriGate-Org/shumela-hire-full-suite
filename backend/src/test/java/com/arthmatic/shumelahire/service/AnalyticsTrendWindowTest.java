package com.arthmatic.shumelahire.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the reach of the dashboard's trend series.
 *
 * <p>{@code getDashboardMetrics} built its trends from {@code date.minusDays(7)}. Recruitment
 * metrics are written per day and a vacancy runs for weeks, so on a tenant holding real history
 * the Application Volume and Monthly Hiring Trends charts each rendered a single bar — the data
 * was complete, the window was not. On the IDC tenant the application inflow ran 13 May to
 * 21 June 2026 and none of it was inside seven days of the dashboard being opened.</p>
 *
 * <p>The window is now {@code shumelahire.analytics.trend-window-days}, defaulting to 90.</p>
 */
class AnalyticsTrendWindowTest {

    private static final int DEFAULT_WINDOW_DAYS = 90;
    private static final LocalDate TODAY = LocalDate.of(2026, 8, 22);

    private LocalDate trendStart(LocalDate date, int windowDays) {
        return date.minusDays(windowDays);
    }

    private boolean covers(LocalDate metricDate, LocalDate today, int windowDays) {
        LocalDate start = trendStart(today, windowDays);
        return !metricDate.isBefore(start) && !metricDate.isAfter(today);
    }

    @Test
    @DisplayName("The default window spans a full hiring cycle")
    void defaultWindowIsNinetyDays() {
        assertEquals(90, ChronoUnit.DAYS.between(trendStart(TODAY, DEFAULT_WINDOW_DAYS), TODAY));
    }

    @Test
    @DisplayName("A seven-day window excludes the whole of a real hiring cycle")
    void sevenDayWindowMissesTheHistory() {
        LocalDate firstApplication = LocalDate.of(2026, 5, 13);
        LocalDate lastApplication = LocalDate.of(2026, 6, 21);

        assertFalse(covers(firstApplication, TODAY, 7),
                "this is why Application Volume Trend rendered one bar");
        assertFalse(covers(lastApplication, TODAY, 7));
    }

    @Test
    @DisplayName("The ninety-day window reaches the recorded inflow")
    void ninetyDayWindowReachesTheHistory() {
        assertTrue(covers(LocalDate.of(2026, 6, 21), TODAY, DEFAULT_WINDOW_DAYS));
        assertTrue(covers(LocalDate.of(2026, 5, 25), TODAY, DEFAULT_WINDOW_DAYS));
    }

    @Test
    @DisplayName("The boundary day is included, the day before it is not")
    void boundaryIsInclusive() {
        LocalDate boundary = trendStart(TODAY, DEFAULT_WINDOW_DAYS);
        assertTrue(covers(boundary, TODAY, DEFAULT_WINDOW_DAYS));
        assertFalse(covers(boundary.minusDays(1), TODAY, DEFAULT_WINDOW_DAYS));
    }

    @Test
    @DisplayName("Metrics dated after today are outside the window")
    void futureMetricsExcluded() {
        assertFalse(covers(TODAY.plusDays(1), TODAY, DEFAULT_WINDOW_DAYS));
        assertTrue(covers(TODAY, TODAY, DEFAULT_WINDOW_DAYS));
    }
}
