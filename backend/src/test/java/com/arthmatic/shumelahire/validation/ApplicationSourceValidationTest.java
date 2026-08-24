package com.arthmatic.shumelahire.validation;

import com.arthmatic.shumelahire.dto.ApplicationCreateRequest;
import com.arthmatic.shumelahire.entity.ApplicationSource;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The DTO's accepted set must be the enum's, not a copy of part of it.
 *
 * The regex this replaces admitted INTERNAL, EXTERNAL, REFERRAL, AGENCY and
 * JOB_BOARD only — so an application genuinely sourced from PNet, LinkedIn or
 * CareerJunction was rejected by the API of a product built to publish to those
 * boards, and CAREERS_PAGE, the largest channel in the seeded data, was
 * rejected too.
 */
class ApplicationSourceValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    private Set<ConstraintViolation<ApplicationCreateRequest>> validateSource(String source) {
        var request = new ApplicationCreateRequest();
        request.setApplicationSource(source);
        return validator.validateProperty(request, "applicationSource");
    }

    @ParameterizedTest
    @EnumSource(ApplicationSource.class)
    void acceptsEveryValueTheEnumDefines(ApplicationSource source) {
        assertTrue(validateSource(source.name()).isEmpty(),
                () -> source.name() + " is a defined source and must be accepted");
    }

    @ParameterizedTest
    @ValueSource(strings = {"PNET", "LINKEDIN", "CAREER_JUNCTION", "CAREERS_PAGE"})
    void acceptsTheValuesTheOldRegexRejected(String source) {
        assertTrue(validateSource(source).isEmpty());
    }

    @Test
    void rejectsAValueTheEnumDoesNotDefine() {
        var violations = validateSource("GITHUB");
        assertEquals(1, violations.size());
        // The message must name what is accepted; "Invalid application source"
        // alone gave a caller sending a legitimate value nothing to act on.
        String message = violations.iterator().next().getMessage();
        assertTrue(message.contains("GITHUB"), message);
        assertTrue(message.contains("PNET"), message);
    }

    @Test
    void treatsNullAndBlankAsAbsent() {
        assertTrue(validateSource(null).isEmpty());
        assertTrue(validateSource("   ").isEmpty());
    }

    @Test
    void resolvesStoredValuesRegardlessOfCase() {
        assertEquals(ApplicationSource.PNET, ApplicationSource.from("pnet").orElseThrow());
        assertEquals(ApplicationSource.CAREERS_PAGE,
                ApplicationSource.from("Careers_Page").orElseThrow());
    }

    @Test
    void doesNotThrowOnAnUnreadableStoredValue() {
        // applicationSource is a String on the entity, so anything may be in
        // there. Failing to read it must not stop an application displaying.
        assertTrue(ApplicationSource.from("SOMETHING_ELSE").isEmpty());
        assertTrue(ApplicationSource.from(null).isEmpty());
    }

    @Test
    void namesTheChannelsThatIdentifyNoParticularSource() {
        // What a named board attribution replaces.
        assertTrue(ApplicationSource.UNATTRIBUTED.contains(ApplicationSource.EXTERNAL));
        assertTrue(ApplicationSource.UNATTRIBUTED.contains(ApplicationSource.JOB_BOARD));
        assertTrue(ApplicationSource.UNATTRIBUTED.contains(ApplicationSource.CAREERS_PAGE));
        assertFalse(ApplicationSource.UNATTRIBUTED.contains(ApplicationSource.REFERRAL),
                "a referral names its channel and must never be overwritten");
        assertFalse(ApplicationSource.UNATTRIBUTED.contains(ApplicationSource.PNET));
    }
}
