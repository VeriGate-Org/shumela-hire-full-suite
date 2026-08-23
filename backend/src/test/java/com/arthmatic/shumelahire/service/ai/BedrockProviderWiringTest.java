package com.arthmatic.shumelahire.service.ai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the details of the Bedrock wiring that are easy to "simplify" into an outage.
 *
 * <p>Two of these are region-specific and will look wrong to anyone reading the AWS documentation
 * for us-east-1:</p>
 *
 * <ul>
 *   <li><b>Cross-region inference profile ids.</b> af-south-1 rejects on-demand invocation of a
 *       bare foundation-model id. The {@code global.anthropic.*} profile is what resolves. Someone
 *       tidying this to {@code anthropic.claude-sonnet-...} would produce a runtime failure that
 *       reads like a permissions problem.</li>
 *   <li><b>Both ARN forms in the IAM policy.</b> Granting only the foundation-model ARN yields an
 *       AccessDenied on the profile ARN, which looks like the model id is wrong rather than the
 *       grant being incomplete. TextGate hit this in production; the pattern here is the one that
 *       works.</li>
 * </ul>
 *
 * <p>Also asserts the mock provider stands aside. It is {@code @ConditionalOnMissingBean} over the
 * real providers, and omitting Bedrock from that list would leave a stack configured for Bedrock
 * quietly serving canned answers — the exact failure that made "AI CV Screening" look implemented
 * for months.</p>
 */
class BedrockProviderWiringTest {

    private static final Path PROVIDER =
            Path.of("src/main/java/com/arthmatic/shumelahire/service/ai/BedrockAiProvider.java");
    private static final Path MOCK =
            Path.of("src/main/java/com/arthmatic/shumelahire/service/ai/MockAiProvider.java");
    private static final Path CONFIG = Path.of("src/main/resources/application.yml");
    private static final Path POM = Path.of("pom.xml");
    private static final Path CDK = Path.of("../infra/cdk/ShumelaHireServerlessStack.cs");

    private String read(Path p) throws IOException { return Files.readString(p); }

    @Test
    @DisplayName("The model id is a cross-region inference profile, not a bare model id")
    void usesInferenceProfile() throws IOException {
        String s = read(PROVIDER);
        assertTrue(s.contains("global.anthropic."),
                "af-south-1 rejects on-demand invocation of bare foundation-model ids");
        assertTrue(s.contains("af-south-1"), "the default region should be explicit");
    }

    @Test
    @DisplayName("The provider is selected by ai.provider=bedrock")
    void selectedByProperty() throws IOException {
        assertTrue(read(PROVIDER).contains("havingValue = \"bedrock\""));
    }

    @Test
    @DisplayName("The mock provider steps aside when Bedrock is present")
    void mockDefersToBedrock() throws IOException {
        String s = read(MOCK);
        assertTrue(s.contains("BedrockAiProvider.class"),
                "otherwise a stack configured for Bedrock would silently serve canned answers");
    }

    @Test
    @DisplayName("Throttling is retried rather than surfaced as a failed screening")
    void throttlingIsRetried() throws IOException {
        String s = read(PROVIDER);
        assertTrue(s.contains("ThrottlingException"));
        assertTrue(s.contains("MAX_ATTEMPTS"));
    }

    @Test
    @DisplayName("The interrupt flag is restored if a backoff is interrupted")
    void interruptRestored() throws IOException {
        assertTrue(read(PROVIDER).contains("Thread.currentThread().interrupt()"),
                "swallowing an interrupt in a Lambda leaves the container in a confusing state");
    }

    @Test
    @DisplayName("The Bedrock SDK is a declared dependency")
    void sdkDeclared() throws IOException {
        assertTrue(read(POM).contains("bedrockruntime"));
    }

    @Test
    @DisplayName("application.yml documents the provider options")
    void configDocumented() throws IOException {
        String s = read(CONFIG);
        assertTrue(s.contains("bedrock"));
        assertTrue(s.contains("BEDROCK_MODEL"));
    }

    @Test
    @DisplayName("IAM grants BOTH the foundation-model and inference-profile ARNs")
    void iamGrantsBothArnForms() throws IOException {
        String s = read(CDK);
        assertTrue(s.contains("bedrock:InvokeModel"), "the Lambda cannot call Bedrock without it");
        assertTrue(s.contains("foundation-model/anthropic.*"), "direct model ARN");
        assertTrue(s.contains("inference-profile/global.anthropic.*"),
                "the profile ARN is the one actually used in af-south-1");
    }

    @Test
    @DisplayName("Marketplace subscription checks are granted")
    void marketplaceGranted() throws IOException {
        String s = read(CDK);
        assertTrue(s.contains("aws-marketplace:ViewSubscriptions"),
                "Bedrock verifies model subscription on first invocation");
    }

    @Test
    @DisplayName("Availability is not claimed on the strength of a config string")
    void availabilityIsHonest() throws IOException {
        String s = read(PROVIDER);
        int at = s.indexOf("public boolean isAvailable()");
        assertTrue(at > 0);
        String body = s.substring(at, Math.min(s.length(), at + 400));
        assertFalse(body.contains("apiKey"),
                "there is no key to check — reporting availability from config is how mock came to look real");
    }
}
