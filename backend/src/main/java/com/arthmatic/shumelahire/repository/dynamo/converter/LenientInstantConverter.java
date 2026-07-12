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
 * Lenient Instant converter for DynamoDB Enhanced Client.
 * Handles both ISO-8601 instant format ("2026-07-12T19:30:00Z") and
 * local date-time format without timezone ("2026-07-12T19:30:00").
 */
public class LenientInstantConverter implements AttributeConverter<Instant> {

    @Override
    public AttributeValue transformFrom(Instant input) {
        return AttributeValue.builder().s(input.toString()).build();
    }

    @Override
    public Instant transformTo(AttributeValue input) {
        String s = input.s();
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(s);
        } catch (DateTimeParseException e) {
            // Fallback: parse as LocalDateTime and convert to Instant (UTC)
            return LocalDateTime.parse(s).toInstant(ZoneOffset.UTC);
        }
    }

    @Override
    public EnhancedType<Instant> type() {
        return EnhancedType.of(Instant.class);
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.S;
    }
}
