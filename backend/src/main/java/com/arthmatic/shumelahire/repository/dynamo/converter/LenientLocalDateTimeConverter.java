package com.arthmatic.shumelahire.repository.dynamo.converter;

import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;

/**
 * Lenient LocalDateTime converter for DynamoDB Enhanced Client.
 * Handles both local date-time format ("2026-07-12T19:30:00") and
 * ISO-8601 instant format with Z suffix ("2026-07-12T19:30:00Z").
 */
public class LenientLocalDateTimeConverter implements AttributeConverter<LocalDateTime> {

    @Override
    public AttributeValue transformFrom(LocalDateTime input) {
        return AttributeValue.builder().s(input.toString()).build();
    }

    @Override
    public LocalDateTime transformTo(AttributeValue input) {
        String s = input.s();
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(s);
        } catch (DateTimeParseException e) {
            // Fallback: parse as Instant and convert to LocalDateTime (UTC)
            return LocalDateTime.ofInstant(Instant.parse(s), ZoneOffset.UTC);
        }
    }

    @Override
    public EnhancedType<LocalDateTime> type() {
        return EnhancedType.of(LocalDateTime.class);
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.S;
    }
}
