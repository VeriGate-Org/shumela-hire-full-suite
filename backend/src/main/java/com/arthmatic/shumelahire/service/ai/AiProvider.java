package com.arthmatic.shumelahire.service.ai;

public interface AiProvider {

    AiCompletionResponse complete(AiCompletionRequest request);

    String getProviderName();

    boolean isAvailable();
}
