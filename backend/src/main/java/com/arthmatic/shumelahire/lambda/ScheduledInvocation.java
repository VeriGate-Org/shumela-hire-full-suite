package com.arthmatic.shumelahire.lambda;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Optional;

/**
 * Tells a scheduled EventBridge payload apart from an HTTP request, and names the job it asks for.
 *
 * <p><b>Why this is a class of its own.</b> {@link ApiLambdaHandler} boots Spring in a static
 * initialiser, so merely referencing it starts an application context. The decision below is the
 * part worth testing and it is pure, so it lives where a test can reach it.
 *
 * <p><b>What went wrong.</b> Every scheduled rule posted a body shaped like an API Gateway v1
 * request — {@code {"source":"scheduled","detail-type":"SageSync","httpMethod":"POST","path":"…"}}
 * — into a handler built for {@code HttpApiV2ProxyRequest}. Jackson refused it on the first field:
 *
 * <pre>
 *   UnrecognizedPropertyException: Unrecognized field "source"
 *       (class com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest)
 * </pre>
 *
 * <p>That is from the production log group on 29 Aug 2026, and it repeats on every firing of every
 * rule. No scheduled job has ever run in a deployed environment. The synthetic path could not have
 * worked even had it parsed: the security chain ends {@code anyRequest().denyAll()} and no rule
 * permits {@code /api/internal/scheduled/**}, so a well-formed request would have been answered
 * 403 by Spring Security before reaching the controller.
 *
 * <p>So a scheduled invocation is no longer dressed up as an HTTP request. It is recognised here
 * and dispatched straight to the job, in process — no servlet, no filter chain, and no endpoint
 * that has to be reachable from the internet for a timer to work.
 */
public final class ScheduledInvocation {

    /** What the EventBridge rules set, and what the dispatcher keys on. */
    static final String SOURCE = "scheduled";

    private ScheduledInvocation() {}

    /**
     * True when this payload is a scheduled invocation rather than an HTTP request.
     *
     * <p>Presence of {@code requestContext} is what makes something an HTTP API v2 request. A
     * payload carrying one is never treated as scheduled, however it is otherwise labelled, so a
     * real request can never be diverted into a job by a stray field.
     */
    public static boolean isScheduled(JsonNode event) {
        if (event == null || !event.isObject() || event.hasNonNull("requestContext")) {
            return false;
        }
        return SOURCE.equals(event.path("source").asText())
                // A bare {"job":"…"} is accepted too, so `aws lambda invoke` can run one by hand
                // without anyone having to hand-assemble an event envelope.
                || event.hasNonNull("job");
    }

    /**
     * The job this invocation asks for, lower-cased.
     *
     * <p>{@code job} is what the rules send. {@code path} and {@code detail-type} are read as
     * fallbacks purely for the window during a deploy when an old rule may still fire at a new
     * function version; neither is worth keeping beyond that.
     */
    public static Optional<String> jobName(JsonNode event) {
        if (event == null || !event.isObject()) {
            return Optional.empty();
        }
        String job = text(event, "job");
        if (job == null) {
            String path = text(event, "path");
            if (path != null) {
                int slash = path.lastIndexOf('/');
                job = slash >= 0 ? path.substring(slash + 1) : path;
            }
        }
        if (job == null) {
            job = text(event, "detail-type");
        }
        return job == null || job.isBlank()
                ? Optional.empty()
                : Optional.of(job.trim().toLowerCase());
    }

    private static String text(JsonNode event, String field) {
        JsonNode node = event.get(field);
        if (node == null || node.isNull() || !node.isTextual()) {
            return null;
        }
        String value = node.asText();
        return value.isBlank() ? null : value;
    }
}
