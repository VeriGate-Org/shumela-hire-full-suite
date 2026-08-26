package com.arthmatic.shumelahire.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A view is counted once per viewer per window, and never fails the page.
 *
 * <p>{@code viewsCount} was incremented on every load with a standing {@code TODO} admitting it,
 * so one candidate refreshing five times read as five people interested in the role.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JobViewLedgerTest {

    @Mock private DynamoDbClient dynamoDbClient;

    private JobViewLedger ledger;

    @BeforeEach
    void setUp() {
        ledger = new JobViewLedger(dynamoDbClient, "shumelahire-data");
    }

    private void putSucceeds() {
        when(dynamoDbClient.putItem(any(PutItemRequest.class)))
                .thenReturn(PutItemResponse.builder().build());
    }

    private PutItemRequest capturePut() {
        ArgumentCaptor<PutItemRequest> captor = ArgumentCaptor.forClass(PutItemRequest.class);
        verify(dynamoDbClient).putItem(captor.capture());
        return captor.getValue();
    }

    @Test
    void aFirstViewIsCounted() {
        putSucceeds();

        assertTrue(ledger.claim("posting-1", "197.0.0.1", "Firefox"));
    }

    @Test
    void aRepeatViewIsNotCounted() {
        // The marker is already there, so the conditional put fails — and that failure is exactly
        // what "already counted" means.
        when(dynamoDbClient.putItem(any(PutItemRequest.class)))
                .thenThrow(ConditionalCheckFailedException.builder().build());

        assertFalse(ledger.claim("posting-1", "197.0.0.1", "Firefox"));
    }

    @Test
    void theMarkerIsConditionalSoTwoSimultaneousViewsCannotBothCount() {
        putSucceeds();
        ledger.claim("posting-1", "197.0.0.1", "Firefox");

        assertEquals("attribute_not_exists(PK)", capturePut().conditionExpression());
    }

    @Test
    void theMarkerExpiresByItself() {
        putSucceeds();
        ledger.claim("posting-1", "197.0.0.1", "Firefox");

        // The table has TTL enabled on this attribute, so nothing has to sweep these up.
        PutItemRequest request = capturePut();
        assertTrue(request.item().containsKey("ttl"), "the marker must expire on its own");
        assertTrue(Long.parseLong(request.item().get("ttl").n()) > 0);
    }

    @Test
    void theAddressIsNeverStored() {
        putSucceeds();
        String address = "197.0.0.1";
        ledger.claim("posting-1", address, "Firefox");

        // An IP address is personal data, and a record of who read which vacancy is not something
        // a view counter should acquire.
        String written = capturePut().item().toString();
        assertFalse(written.contains(address), "the raw address must not reach the table");
    }

    /** The trailing hash of each marker written, in order. */
    private java.util.List<String> capturedHashes(int expectedCalls) {
        ArgumentCaptor<PutItemRequest> captor = ArgumentCaptor.forClass(PutItemRequest.class);
        verify(dynamoDbClient, times(expectedCalls)).putItem(captor.capture());
        return captor.getAllValues().stream()
                .map(request -> request.item().get("SK").s())
                .map(sk -> sk.substring(sk.lastIndexOf('#') + 1))
                .toList();
    }

    @Test
    void theSameVisitorLooksDifferentOnADifferentPosting() {
        putSucceeds();

        ledger.claim("posting-1", "197.0.0.1", "Firefox");
        ledger.claim("posting-2", "197.0.0.1", "Firefox");

        // Salted per posting, so the markers cannot be joined into a browsing history for a person.
        java.util.List<String> hashes = capturedHashes(2);
        assertNotEquals(hashes.get(0), hashes.get(1));
    }

    @Test
    void differentViewersAreToldApart() {
        putSucceeds();

        ledger.claim("posting-1", "197.0.0.1", "Firefox");
        ledger.claim("posting-1", "197.0.0.9", "Firefox");

        java.util.List<String> hashes = capturedHashes(2);
        assertNotEquals(hashes.get(0), hashes.get(1));
    }

    @Test
    void aFailureToRecordNeverFailsThePage() {
        // Somebody reading a vacancy must not see an error because a statistic could not be
        // written. Declining to count is the safe outcome.
        when(dynamoDbClient.putItem(any(PutItemRequest.class)))
                .thenThrow(new RuntimeException("dynamo unavailable"));

        assertFalse(ledger.claim("posting-1", "197.0.0.1", "Firefox"));
    }

    @Test
    void nothingIsClaimedWithoutAPostingOrATable() {
        assertFalse(ledger.claim(null, "197.0.0.1", "Firefox"));
        assertFalse(ledger.claim("", "197.0.0.1", "Firefox"));
        assertFalse(new JobViewLedger(dynamoDbClient, "").claim("posting-1", "197.0.0.1", "Firefox"));
    }
}
