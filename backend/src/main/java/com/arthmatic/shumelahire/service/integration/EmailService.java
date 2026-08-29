package com.arthmatic.shumelahire.service.integration;

public interface EmailService {

    boolean sendEmail(String to, String subject, String htmlBody);

    boolean sendTemplatedEmail(String to, String template, java.util.Map<String, String> data);

    /**
     * Whether this implementation can actually put mail in front of a person.
     *
     * <p>Deliberately has no default. {@link NoOpEmailService} returns {@code true} from
     * {@code sendEmail} while sending nothing, so a caller that trusts the return value records a
     * clean success for a message nobody received — which is how a report schedule would have
     * reported itself delivered in an environment with no SES. A default here would hand that trap
     * to the next implementation too; answering it is the price of implementing the interface.
     */
    boolean isDeliveryConfigured();
}
