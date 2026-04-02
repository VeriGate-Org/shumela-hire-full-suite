package com.arthmatic.shumelahire.lambda;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.arthmatic.shumelahire.ShumelaHireApplication;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Lambda entry point for the Spring Boot API.
 * Uses aws-serverless-java-container to adapt API Gateway HTTP API v2
 * requests into Spring Boot servlet requests.
 */
public class ApiLambdaHandler implements RequestStreamHandler {

    private static final SpringBootLambdaContainerHandler<HttpApiV2ProxyRequest, AwsProxyResponse> handler;

    static {
        try {
            handler = SpringBootLambdaContainerHandler.getHttpApiV2ProxyHandler(ShumelaHireApplication.class);
        } catch (ContainerInitializationException e) {
            throw new RuntimeException("Failed to initialize Spring Boot in Lambda", e);
        }
    }

    @Override
    public void handleRequest(InputStream input, OutputStream output, Context context) throws IOException {
        handler.proxyStream(input, output, context);
    }
}
