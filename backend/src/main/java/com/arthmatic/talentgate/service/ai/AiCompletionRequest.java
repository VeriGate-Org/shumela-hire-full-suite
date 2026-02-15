package com.arthmatic.talentgate.service.ai;

public class AiCompletionRequest {

    private String systemPrompt;
    private String userPrompt;
    private double temperature;
    private int maxTokens;

    public AiCompletionRequest() {
        this.temperature = 0.7;
        this.maxTokens = 2048;
    }

    public AiCompletionRequest(String systemPrompt, String userPrompt) {
        this();
        this.systemPrompt = systemPrompt;
        this.userPrompt = userPrompt;
    }

    public AiCompletionRequest(String systemPrompt, String userPrompt, double temperature, int maxTokens) {
        this.systemPrompt = systemPrompt;
        this.userPrompt = userPrompt;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
    }

    public String getSystemPrompt() { return systemPrompt; }
    public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }

    public String getUserPrompt() { return userPrompt; }
    public void setUserPrompt(String userPrompt) { this.userPrompt = userPrompt; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public int getMaxTokens() { return maxTokens; }
    public void setMaxTokens(int maxTokens) { this.maxTokens = maxTokens; }
}
