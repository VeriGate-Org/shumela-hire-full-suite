package com.arthmatic.shumelahire.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB Streams → S3 NDJSON processor for analytics pipeline.
 * <p>
 * Receives stream records from the single DynamoDB table, groups them by entity type
 * (derived from the SK prefix), converts to JSON, and writes to S3 as newline-delimited
 * JSON (NDJSON) partitioned by entity_type/year/month/day.
 * <p>
 * Athena reads NDJSON natively with {@code org.apache.hive.hcatalog.data.JsonSerDe}.
 */
public class StreamProcessorHandler implements RequestHandler<DynamodbEvent, String> {

    private final S3Client s3Client;
    private final String bucketName;

    public StreamProcessorHandler() {
        this.s3Client = S3Client.create();
        this.bucketName = System.getenv("ANALYTICS_BUCKET");
    }

    // Constructor for testing
    StreamProcessorHandler(S3Client s3Client, String bucketName) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    @Override
    public String handleRequest(DynamodbEvent event, Context context) {
        if (event.getRecords() == null || event.getRecords().isEmpty()) {
            return "No records to process";
        }

        // Group records by entity type (from SK prefix)
        Map<String, List<String>> groupedRecords = new LinkedHashMap<>();

        for (DynamodbEvent.DynamodbStreamRecord record : event.getRecords()) {
            if (record.getDynamodb() == null) continue;

            // Use NewImage for INSERT/MODIFY, OldImage for REMOVE
            Map<String, AttributeValue> image = record.getDynamodb().getNewImage();
            if (image == null) {
                image = record.getDynamodb().getOldImage();
            }
            if (image == null) continue;

            // Extract entity type from SK attribute (e.g., "EMPLOYEE#123" → "employees")
            String sk = getStringValue(image.get("SK"));
            if (sk == null) continue;

            String entityType = extractEntityType(sk);
            if (entityType == null) continue;

            // Convert DynamoDB image to a flat JSON string
            String json = toJson(image, record.getEventName());
            groupedRecords.computeIfAbsent(entityType, k -> new ArrayList<>()).add(json);
        }

        // Write each entity type group to S3
        ZonedDateTime now = Instant.now().atZone(ZoneOffset.UTC);
        int totalRecords = 0;

        for (Map.Entry<String, List<String>> entry : groupedRecords.entrySet()) {
            String entityType = entry.getKey();
            List<String> records = entry.getValue();
            String ndjson = String.join("\n", records);

            String key = String.format("%s/year=%04d/month=%02d/day=%02d/%s-%s.json",
                    entityType,
                    now.getYear(), now.getMonthValue(), now.getDayOfMonth(),
                    now.toInstant().toEpochMilli(),
                    UUID.randomUUID().toString().substring(0, 8));

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType("application/x-ndjson")
                            .build(),
                    RequestBody.fromString(ndjson)
            );

            totalRecords += records.size();
            context.getLogger().log(String.format("Wrote %d records for %s to s3://%s/%s",
                    records.size(), entityType, bucketName, key));
        }

        return String.format("Processed %d records across %d entity types",
                totalRecords, groupedRecords.size());
    }

    /**
     * Extract entity type from SK and normalize to plural lowercase for Athena table naming.
     */
    private String extractEntityType(String sk) {
        int hashIndex = sk.indexOf('#');
        if (hashIndex <= 0) return null;

        String prefix = sk.substring(0, hashIndex).toLowerCase();
        return switch (prefix) {
            case "employee" -> "employees";
            case "applicant" -> "applicants";
            case "application" -> "applications";
            case "offer" -> "offers";
            case "interview" -> "interviews";
            case "bgcheck" -> "background_checks";
            case "job_ad" -> "job_ads";
            case "job_posting" -> "job_postings";
            case "requisition" -> "requisitions";
            case "notification" -> "notifications";
            case "audit_log" -> "audit_logs";
            case "department" -> "departments";
            case "sap_payroll_transmission" -> "sap_payroll_transmissions";
            case "recruitment_metrics" -> "recruitment_metrics";
            case "pipeline_transition" -> "pipeline_transitions";
            case "talent_pool" -> "talent_pools";
            case "talent_pool_entry" -> "talent_pool_entries";
            case "workflow_execution" -> "workflow_executions";
            case "employment_event" -> "employment_events";
            default -> prefix + "s";
        };
    }

    /**
     * Convert a DynamoDB attribute map to a flat JSON string.
     */
    private String toJson(Map<String, AttributeValue> image, String eventName) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;

        // Add event metadata
        sb.append("\"_event\":\"").append(escapeJson(eventName)).append("\"");
        sb.append(",\"_timestamp\":\"").append(Instant.now().toString()).append("\"");
        first = false;

        for (Map.Entry<String, AttributeValue> attr : image.entrySet()) {
            String key = attr.getKey();
            // Skip DynamoDB key/index attributes from the NDJSON output
            if (key.startsWith("GSI") || key.equals("PK") || key.equals("SK")) continue;

            String value = getStringValue(attr.getValue());
            if (value == null) continue;

            if (!first) sb.append(",");
            sb.append("\"").append(escapeJson(key)).append("\":\"").append(escapeJson(value)).append("\"");
            first = false;
        }

        sb.append("}");
        return sb.toString();
    }

    private String getStringValue(AttributeValue attr) {
        if (attr == null) return null;
        if (attr.getS() != null) return attr.getS();
        if (attr.getN() != null) return attr.getN();
        if (attr.getBOOL() != null) return attr.getBOOL().toString();
        return null;
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
