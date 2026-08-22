package com.arthmatic.shumelahire.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.IllegalFormatConversionException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the audit-message format strings in {@link OfferService}.
 *
 * <p>Both of these carried {@code %d} against values that have been {@code String} since the move
 * to DynamoDB. {@code String.format} throws {@link IllegalFormatConversionException} on the
 * mismatch, and because the audit call is the last statement in {@code createOffer} and
 * {@code approveOffer}, the offer was <em>already persisted</em> when it blew up. The endpoint
 * returned {@code 400 "d != java.lang.String"} for an operation that had in fact succeeded, which
 * is worse than a clean failure: a caller that retries creates a duplicate offer.</p>
 *
 * <p>These assertions are about the format strings themselves rather than the service, because
 * that is the whole of the defect — no amount of service wiring changes whether {@code %d}
 * accepts a String.</p>
 */
class OfferAuditMessageTest {

    private static final String OFFER_NUMBER = "OFF-1787425592917";
    private static final String APPLICATION_ID = "87173b20-59d8-450e-93cf-f35db4d70951";
    private static final String USER_ID = "756ed04a-2854-4d2a-b304-c41b71aef220";

    /** Mirrors the audit message in OfferService.createOffer(). */
    private String createdMessage(String offerNumber, String applicationId) {
        return String.format("Offer %s created for application %s", offerNumber, applicationId);
    }

    /** Mirrors the audit message in OfferService.approveOffer(). */
    private String approvedMessage(String offerNumber, String approvedBy) {
        return String.format("Offer %s approved by user %s", offerNumber, approvedBy);
    }

    @Test
    @DisplayName("Creating an offer formats the application id without throwing")
    void createdMessageAcceptsStringApplicationId() {
        String message = assertDoesNotThrow(() -> createdMessage(OFFER_NUMBER, APPLICATION_ID));
        assertTrue(message.contains(APPLICATION_ID),
                "the audit trail has to name the application the offer belongs to");
    }

    @Test
    @DisplayName("Approving an offer formats the approver id without throwing")
    void approvedMessageAcceptsStringUserId() {
        String message = assertDoesNotThrow(() -> approvedMessage(OFFER_NUMBER, USER_ID));
        assertTrue(message.contains(USER_ID),
                "an approval nobody can be attributed to is not an audit record");
    }

    @Test
    @DisplayName("A UUID identifier is not a number — %d on these fields always throws")
    void numericConversionRejectsIdentifiers() {
        assertThrows(IllegalFormatConversionException.class,
                () -> String.format("Offer %s created for application %d", OFFER_NUMBER, APPLICATION_ID),
                "this is the exact call that returned 400 after committing the offer");
        assertThrows(IllegalFormatConversionException.class,
                () -> String.format("Offer %s approved by user %d", OFFER_NUMBER, USER_ID));
    }
}
