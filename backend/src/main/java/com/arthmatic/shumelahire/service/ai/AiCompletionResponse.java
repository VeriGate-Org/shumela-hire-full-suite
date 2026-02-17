package com.arthmatic.shumelahire.service.ai;

public class AiCompletionResponse {

    private String content;
    private String model;
    private int inputTokens;
    private int outputTokens;
    private String provider;

    public AiCompletionResponse() {}

    public AiCompletionResponse(String content, String model, int inputTokens, int outputTokens, String provider) {
        this.content = content;
        this.model = model;
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        this.provider = provider;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getInputTokens() { return inputTokens; }
    public void setInputTokens(int inputTokens) { this.inputTokens = inputTokens; }

    public int getOutputTokens() { return outputTokens; }
    public void setOutputTokens(int outputTokens) { this.outputTokens = outputTokens; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
}
