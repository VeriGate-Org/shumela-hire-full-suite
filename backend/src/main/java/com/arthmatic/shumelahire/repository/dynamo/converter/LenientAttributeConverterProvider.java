package com.arthmatic.shumelahire.repository.dynamo.converter;

import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeConverterProvider;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Custom AttributeConverterProvider that provides lenient timestamp converters.
 * Handles both ISO-8601 instant format (with Z) and local date-time format (without Z)
 * for both Instant and LocalDateTime fields.
 *
 * Usage: @DynamoDbBean(converterProviders = {LenientAttributeConverterProvider.class, DefaultAttributeConverterProvider.class})
 */
public class LenientAttributeConverterProvider implements AttributeConverterProvider {

    private static final LenientInstantConverter INSTANT_CONVERTER = new LenientInstantConverter();
    private static final LenientLocalDateTimeConverter LOCAL_DATE_TIME_CONVERTER = new LenientLocalDateTimeConverter();

    public LenientAttributeConverterProvider() {
        // Required no-arg constructor for SDK instantiation
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> AttributeConverter<T> converterFor(EnhancedType<T> enhancedType) {
        if (enhancedType.rawClass().equals(Instant.class)) {
            return (AttributeConverter<T>) INSTANT_CONVERTER;
        }
        if (enhancedType.rawClass().equals(LocalDateTime.class)) {
            return (AttributeConverter<T>) LOCAL_DATE_TIME_CONVERTER;
        }
        // Return null to let the next provider in the chain handle it
        return null;
    }
}
