package com.arthmatic.shumelahire.lambda;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.arthmatic.shumelahire.ShumelaHireApplication;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Lambda entry point for the Spring Boot API.
 * Uses aws-serverless-java-container to adapt API Gateway HTTP API v2
 * requests into Spring Boot servlet requests.
 *
 * HTTP API v2 (PayloadFormatVersion 2.0) does NOT support multiValueHeaders
 * in the response. The aws-serverless-java-container library always serializes
 * this field via AwsProxyResponse, causing API Gateway to return 502.
 * We intercept the response and strip it before writing to the output.
 */
public class ApiLambdaHandler implements RequestStreamHandler {

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
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        handler.proxyStream(input, buffer, context);

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
}
