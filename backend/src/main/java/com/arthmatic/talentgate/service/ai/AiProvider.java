package com.arthmatic.talentgate.service.ai;

public interface AiProvider {

    AiCompletionResponse complete(AiCompletionRequest request);

    String getProviderName();

    boolean isAvailable();
}
