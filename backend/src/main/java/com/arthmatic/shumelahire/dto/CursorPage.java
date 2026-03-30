package com.arthmatic.shumelahire.dto;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

/**
 * Cursor-based pagination response for DynamoDB queries.
 * Compatible with both JPA page-based and DynamoDB cursor-based patterns.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CursorPage<T>(
    List<T> content,
    String nextCursor,
    boolean hasMore,
    int size,
    Long totalElements
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static <T> CursorPage<T> of(List<T> content, Map<String, AttributeValue> lastEvaluatedKey, int pageSize) {
        String cursor = encodeCursor(lastEvaluatedKey);
        boolean hasMore = lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty();
        return new CursorPage<>(content, cursor, hasMore, content.size(), null);
    }

    public static <T> CursorPage<T> of(List<T> content, Map<String, AttributeValue> lastEvaluatedKey, int pageSize, long totalElements) {
        String cursor = encodeCursor(lastEvaluatedKey);
        boolean hasMore = lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty();
        return new CursorPage<>(content, cursor, hasMore, content.size(), totalElements);
    }

    public static <T> CursorPage<T> empty() {
        return new CursorPage<>(List.of(), null, false, 0, 0L);
    }

    /**
     * Creates a CursorPage from a JPA Page for backwards compatibility during migration.
     */
    public static <T> CursorPage<T> fromJpaPage(org.springframework.data.domain.Page<T> page) {
        return new CursorPage<>(
            page.getContent(),
            page.hasNext() ? String.valueOf(page.getNumber() + 1) : null,
            page.hasNext(),
            page.getNumberOfElements(),
            page.getTotalElements()
        );
    }

    /**
     * Encodes DynamoDB LastEvaluatedKey to a Base64 cursor string.
     */
    public static String encodeCursor(Map<String, AttributeValue> lastEvaluatedKey) {
        if (lastEvaluatedKey == null || lastEvaluatedKey.isEmpty()) {
            return null;
        }
        try {
            // Convert AttributeValue map to simple string map for serialization
            var simpleMap = new java.util.HashMap<String, String>();
            lastEvaluatedKey.forEach((k, v) -> simpleMap.put(k, v.s()));
            String json = MAPPER.writeValueAsString(simpleMap);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to encode cursor", e);
        }
    }

    /**
     * Decodes a Base64 cursor string back to a DynamoDB ExclusiveStartKey.
     */
    public static Map<String, AttributeValue> decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            String json = new String(Base64.getUrlDecoder().decode(cursor));
            Map<String, String> simpleMap = MAPPER.readValue(json, new TypeReference<>() {});
            var attributeMap = new java.util.HashMap<String, AttributeValue>();
            simpleMap.forEach((k, v) -> attributeMap.put(k, AttributeValue.builder().s(v).build()));
            return attributeMap;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid cursor: " + cursor, e);
        }
    }
}
