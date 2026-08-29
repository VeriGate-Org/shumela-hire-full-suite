package com.arthmatic.shumelahire.service.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.ses.SesClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * The recipient guard.
 *
 * <p>It exists because the IDC tenant carries 58 seeded applicants at invented gmail, outlook and
 * yahoo addresses. Emailing them is not a privacy problem, it is a deliverability one: hard bounces
 * at Gmail are the fastest way to have SES pause sending on a domain verified an hour earlier.
 */
class SesEmailServiceTest {

    private SesEmailService serviceAllowing(String domains) {
        var service = new SesEmailService(mock(SesClient.class));
        ReflectionTestUtils.setField(service, "allowedRecipientDomains", domains);
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@shumelahire.co.za");
        ReflectionTestUtils.setField(service, "fromName", "ShumelaHire");
        return service;
    }

    @Test
    @DisplayName("an empty list allows everywhere, so the guard is opt-in")
    void emptyMeansEverywhere() {
        var service = serviceAllowing("");

        assertThat(service.isAllowed("anyone@gmail.com")).isTrue();
        assertThat(service.isAllowed("hr@idc.shumelahire.co.za")).isTrue();
    }

    @Test
    @DisplayName("the listed domain and its subdomains are allowed; a lookalike is not")
    void matchesTheDomainAndItsSubdomains() {
        var service = serviceAllowing("arthmatic.co.za");

        assertThat(service.isAllowed("info@arthmatic.co.za")).isTrue();
        assertThat(service.isAllowed("hr@mail.arthmatic.co.za")).isTrue();
        assertThat(service.isAllowed("INFO@Arthmatic.co.za")).isTrue();
        // Suffix matching without the dot would have let this through.
        assertThat(service.isAllowed("attacker@notarthmatic.co.za")).isFalse();
        assertThat(service.isAllowed("someone@gmail.com")).isFalse();
    }

    @Test
    @DisplayName("a blocked address is reported as a failure, not swallowed")
    void blockedRecipientsFailRatherThanLookSent() {
        var client = mock(SesClient.class);
        var service = new SesEmailService(client);
        ReflectionTestUtils.setField(service, "allowedRecipientDomains", "arthmatic.co.za");
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@shumelahire.co.za");
        ReflectionTestUtils.setField(service, "fromName", "ShumelaHire");

        boolean sent = service.sendEmail("candidate@gmail.com", "Interview", "<p>hi</p>");

        // false, so the caller records the truth. Returning true here would recreate exactly the
        // NoOpEmailService trap this guard was added alongside.
        assertThat(sent).isFalse();
        verify(client, never()).sendEmail(any(software.amazon.awssdk.services.ses.model.SendEmailRequest.class));
    }

    @Test
    @DisplayName("nonsense in the recipient field is refused rather than handed to SES")
    void refusesMalformedAddresses() {
        var service = serviceAllowing("arthmatic.co.za");

        assertThat(service.isAllowed(null)).isFalse();
        assertThat(service.isAllowed("not-an-address")).isFalse();
    }

    @Test
    @DisplayName("SES is a real channel, so it says it can deliver")
    void reportsItselfConfigured() {
        assertThat(serviceAllowing("").isDeliveryConfigured()).isTrue();
    }
}
