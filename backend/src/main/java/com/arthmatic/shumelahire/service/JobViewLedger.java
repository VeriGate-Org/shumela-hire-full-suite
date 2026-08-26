package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

/**
 * Decides whether a page view has already been counted.
 *
 * <p><b>The problem.</b> {@code viewsCount} was incremented on every load of a posting, with a
 * standing {@code TODO} admitting it, so one candidate refreshing five times was five views. That
 * figure sits under a heading about interest in a role, where it reads as an audience.
 *
 * <p><b>The approach.</b> A marker per (posting, viewer, window) is written to the single table
 * with a conditional put — {@code attribute_not_exists(PK)} — and the counter is incremented only
 * when that put succeeds. The marker carries a {@code ttl}, which the table already has enabled,
 * so it removes itself and nothing needs sweeping.
 *
 * <p>This runs on Lambda, which is why the marker is persisted rather than held in memory: a warm
 * container would deduplicate only its own traffic, and which requests share a container is
 * arbitrary. Persisting makes the window mean the same thing for everyone.
 *
 * <p><b>The viewer is a hash, never an address.</b> An IP address is personal data, and keeping a
 * log of who looked at which vacancy is not something a view counter needs or should acquire. The
 * marker holds a SHA-256 of address and user agent, salted per posting so the same person is not
 * correlatable across roles.
 *
 * <p><b>Known imprecision, stated rather than hidden.</b> DynamoDB deletes expired items lazily —
 * typically within 48 hours, not on the second. A marker that outlives its window means a repeat
 * view goes uncounted slightly longer than intended, so the error is always toward undercounting.
 * For a figure whose defect was inflation, erring downward is the right direction.
 */
@Component
public class JobViewLedger {

    private static final Logger logger = LoggerFactory.getLogger(JobViewLedger.class);

    private final DynamoDbClient dynamoDbClient;
    private final String tableName;

    /** How long one viewer's view of one posting counts once. */
    @Value("${shumelahire.views.dedup-window-hours:24}")
    private int windowHours = 24;

    public JobViewLedger(DynamoDbClient dynamoDbClient, String dynamoDbTableName) {
        this.dynamoDbClient = dynamoDbClient;
        this.tableName = dynamoDbTableName;
    }

    /**
     * Claim this view for counting.
     *
     * @return true when this viewer has not been counted for this posting inside the window, and
     *         the caller should therefore increment. False when it is a repeat.
     */
    public boolean claim(String jobPostingId, String clientIp, String userAgent) {
        if (jobPostingId == null || jobPostingId.isBlank() || tableName == null || tableName.isBlank()) {
            return false;
        }

        String fingerprint = fingerprint(jobPostingId, clientIp, userAgent);
        long expiresAt = Instant.now().plusSeconds(Math.max(1, windowHours) * 3600L).getEpochSecond();

        try {
            dynamoDbClient.putItem(PutItemRequest.builder()
                    .tableName(tableName)
                    .item(Map.of(
                            "PK", AttributeValue.fromS(tenantPk()),
                            "SK", AttributeValue.fromS("JOBVIEW#" + jobPostingId + "#" + fingerprint),
                            "ttl", AttributeValue.fromN(Long.toString(expiresAt))))
                    // The whole mechanism is this line: the write fails when the marker is already
                    // there, and a failure is what "already counted" means.
                    .conditionExpression("attribute_not_exists(PK)")
                    .build());
            return true;
        } catch (ConditionalCheckFailedException alreadyCounted) {
            return false;
        } catch (Exception e) {
            // A counter is not worth failing a page load for. Declining to count is the safe
            // outcome: the figure stays low rather than the candidate seeing an error.
            logger.warn("Could not record a view for posting {}: {}", jobPostingId, e.getMessage());
            return false;
        }
    }

    private String tenantPk() {
        String tenantId = TenantContext.getCurrentTenant();
        return "TENANT#" + (tenantId == null || tenantId.isBlank() ? "public" : tenantId);
    }

    /**
     * A stable, non-reversible handle for one viewer of one posting.
     *
     * <p>Salted with the posting id so the same visitor produces a different handle per role: the
     * markers cannot be joined up into a browsing history for a person.
     */
    private String fingerprint(String jobPostingId, String clientIp, String userAgent) {
        String material = jobPostingId + "|" + (clientIp == null ? "" : clientIp)
                + "|" + (userAgent == null ? "" : userAgent);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(material.getBytes(StandardCharsets.UTF_8));
            // 16 bytes is ample to keep collisions negligible at this volume, and a collision only
            // ever costs one uncounted view.
            return HexFormat.of().formatHex(hash, 0, 16);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is required of every JVM; if it is genuinely missing, do not fall back to
            // storing the address in clear.
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
