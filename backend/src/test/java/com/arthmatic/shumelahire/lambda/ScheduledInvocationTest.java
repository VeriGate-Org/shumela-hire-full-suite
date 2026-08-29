package com.arthmatic.shumelahire.lambda;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The decision that was wrong in production: what counts as a scheduled invocation.
 *
 * <p>The payloads below are copied from live infrastructure — the EventBridge rule input from
 * {@code aws events list-targets-by-rule --rule shumelahire-sagesync}, and the HTTP API v2 envelope
 * the API Gateway integration sends.
 */
class ScheduledInvocationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private JsonNode json(String raw) {
        try {
            return mapper.readTree(raw);
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    /** Exactly what the deployed rules sent while nothing ran. */
    private static final String LEGACY_RULE_INPUT = """
            {"source":"scheduled","detail-type":"SageSync","httpMethod":"POST",
             "path":"/api/internal/scheduled/sagesync"}
            """;

    /** What the rules send after this change. */
    private static final String RULE_INPUT = """
            {"source":"scheduled","job":"reportschedules","detail-type":"ReportSchedules"}
            """;

    /** An HTTP API v2 request, trimmed to the fields that identify it. */
    private static final String HTTP_REQUEST = """
            {"version":"2.0","routeKey":"ANY /api/{proxy+}","rawPath":"/api/reports/scheduled",
             "headers":{"authorization":"Bearer x"},
             "requestContext":{"http":{"method":"GET","path":"/api/reports/scheduled"}}}
            """;

    @Test
    @DisplayName("the payload the deployed rules actually send is recognised as scheduled")
    void recognisesTheLiveRulePayload() {
        assertThat(ScheduledInvocation.isScheduled(json(RULE_INPUT))).isTrue();
        assertThat(ScheduledInvocation.jobName(json(RULE_INPUT))).contains("reportschedules");
    }

    @Test
    @DisplayName("the old rule payload still routes, so a deploy window cannot drop a firing")
    void stillReadsTheLegacyPayload() {
        assertThat(ScheduledInvocation.isScheduled(json(LEGACY_RULE_INPUT))).isTrue();
        // Read off the tail of the path it used to POST to.
        assertThat(ScheduledInvocation.jobName(json(LEGACY_RULE_INPUT))).contains("sagesync");
    }

    @Test
    @DisplayName("an HTTP request is never treated as a job, whatever else it carries")
    void neverDivertsAnHttpRequest() {
        assertThat(ScheduledInvocation.isScheduled(json(HTTP_REQUEST))).isFalse();

        // The guard is requestContext, not the absence of a job field: a request carrying a
        // "job" query-ish field must still be served as a request.
        String withStrayField = """
                {"version":"2.0","rawPath":"/api/reports","job":"reportschedules",
                 "requestContext":{"http":{"method":"GET","path":"/api/reports"}}}
                """;
        assertThat(ScheduledInvocation.isScheduled(json(withStrayField))).isFalse();
    }

    @Test
    @DisplayName("a bare {\\\"job\\\"} runs by hand, so a job can be triggered without an envelope")
    void acceptsAManualInvoke() {
        assertThat(ScheduledInvocation.isScheduled(json("{\"job\":\"ReportSchedules\"}"))).isTrue();
        assertThat(ScheduledInvocation.jobName(json("{\"job\":\"ReportSchedules\"}")))
                .contains("reportschedules");
    }

    @Test
    @DisplayName("nothing to name means empty, not a guess")
    void namelessEventsYieldNothing() {
        assertThat(ScheduledInvocation.jobName(json("{\"source\":\"scheduled\"}"))).isEmpty();
        assertThat(ScheduledInvocation.jobName(json("{\"job\":\"  \"}"))).isEmpty();
        assertThat(ScheduledInvocation.isScheduled(null)).isFalse();
        assertThat(ScheduledInvocation.isScheduled(json("[]"))).isFalse();
    }
}
