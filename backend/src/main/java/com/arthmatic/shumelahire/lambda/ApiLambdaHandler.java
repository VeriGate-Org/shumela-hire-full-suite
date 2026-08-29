package com.arthmatic.shumelahire.lambda;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.arthmatic.shumelahire.ShumelaHireApplication;
import com.arthmatic.shumelahire.service.ScheduledJobRegistry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Lambda entry point for the Spring Boot API.
 *
 * <p>Two kinds of event arrive here. API Gateway HTTP API v2 requests are adapted into servlet
 * requests by aws-serverless-java-container, as before. Scheduled EventBridge invocations are
 * recognised by {@link ScheduledInvocation} and dispatched straight to the job — see that class
 * for the production failure that made this necessary, which was every scheduled job in the
 * application never once running in a deployed environment.
 *
 * <p>HTTP API v2 (PayloadFormatVersion 2.0) does NOT support multiValueHeaders in the response.
 * The aws-serverless-java-container library always serializes this field via AwsProxyResponse,
 * causing API Gateway to return 502. We intercept the response and strip it before writing to the
 * output.
 */
public class ApiLambdaHandler implements RequestStreamHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiLambdaHandler.class);

    private static final SpringBootLambdaContainerHandler<HttpApiV2ProxyRequest, AwsProxyResponse> handler;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final ObjectWriter writer = mapper.writer();

    static {
        try {
            handler = SpringBootLambdaContainerHandler.getHttpApiV2ProxyHandler(ShumelaHireApplication.class);
        } catch (ContainerInitializationException e) {
            throw new RuntimeException("Failed to initialize Spring Boot in Lambda", e);
        }
    }

    @Override
    public void handleRequest(InputStream input, OutputStream output, Context context) throws IOException {
        // Read once: the stream is consumed by whichever path takes it, and deciding which path
        // that is requires looking at the payload first.
        byte[] payload = input.readAllBytes();

        JsonNode event = parse(payload);
        if (ScheduledInvocation.isScheduled(event)) {
            writer.writeValue(output, runScheduledJob(event));
            return;
        }

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        handler.proxyStream(new ByteArrayInputStream(payload), buffer, context);

        // Strip multiValueHeaders — not supported by HTTP API v2 PayloadFormatVersion 2.0
        byte[] raw = buffer.toByteArray();
        try {
            ObjectNode node = (ObjectNode) mapper.readTree(raw);
            node.remove("multiValueHeaders");
            writer.writeValue(output, node);
        } catch (Exception e) {
            // If parsing fails, pass through the original response
            output.write(raw);
        }
    }

    /**
     * Run the job this event names.
     *
     * <p>A failure is rethrown rather than answered with a body. EventBridge has no caller waiting
     * on a response, so the only way a broken job becomes visible is Lambda's own error metric and
     * log — which is precisely what did not happen while these invocations were failing to parse
     * for months. Two EventBridge retries follow; the sweep records each schedule's outcome as it
     * goes and re-reads what is still due, so a retry does not repeat work already done.
     */
    private ObjectNode runScheduledJob(JsonNode event) {
        String job = ScheduledInvocation.jobName(event).orElse("");
        try {
            SpringContextHolder.get().getBean(ScheduledJobRegistry.class).run(job);
            return mapper.createObjectNode().put("job", job).put("status", "completed");
        } catch (Exception e) {
            log.error("Scheduled job '{}' failed: {}", job, e.getMessage(), e);
            throw new IllegalStateException("Scheduled job '" + job + "' failed: " + e.getMessage(), e);
        }
    }

    private JsonNode parse(byte[] payload) {
        try {
            return mapper.readTree(payload);
        } catch (Exception e) {
            // Not JSON at all: leave it to the container handler to reject, as it did before.
            return null;
        }
    }
}
