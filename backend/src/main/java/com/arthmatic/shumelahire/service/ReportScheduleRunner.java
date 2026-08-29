package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ReportScheduleResponse;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.service.integration.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.concurrent.atomic.AtomicReference;
import java.util.ArrayList;
import java.util.List;

/**
 * Runs report schedules that have fallen due, and records what happened to each.
 *
 * <p>{@link ReportScheduleService} deliberately sends nothing — it is storage and rules. This is
 * the caller it left a seam for: a timer fires, this sweeps every tenant, and each due schedule
 * ends the sweep with a stored outcome. There is no third state. A schedule either delivered or
 * carries the reason it did not, because "nothing happened and nobody knows why" is the state the
 * Reports page was rebuilt to make impossible.
 *
 * <p><b>Delivery is attempted, never assumed.</b> {@code NoOpEmailService} — the bean in every
 * environment where SES is off — returns {@code true} from {@code sendEmail} and sends nothing,
 * which would have recorded a clean success for a report no one received. So the runner asks
 * {@link EmailService#isDeliveryConfigured()} first and records a truthful failure when the answer
 * is no. That is why prod will show these schedules failing until SES is configured: they are
 * failing, and were before anything ran.
 */
@Service
public class ReportScheduleRunner {

    private static final Logger log = LoggerFactory.getLogger(ReportScheduleRunner.class);

    private final TenantSweep sweep;
    private final ReportScheduleService schedules;
    private final ReportTemplateService templates;
    private final EmailService email;
    private final String appUrl;

    public ReportScheduleRunner(TenantSweep sweep,
                                ReportScheduleService schedules,
                                ReportTemplateService templates,
                                EmailService email,
                                @Value("${APP_URL:}") String appUrl) {
        this.sweep = sweep;
        this.schedules = schedules;
        this.templates = templates;
        this.email = email;
        this.appUrl = appUrl;
    }

    /** What a sweep did. Returned for the log and for tests; nothing downstream reads it. */
    public record Summary(int tenants, int delivered, int failed, int tenantErrors) {
        Summary plus(Summary other) {
            return new Summary(tenants + other.tenants, delivered + other.delivered,
                    failed + other.failed, tenantErrors + other.tenantErrors);
        }

        @Override
        public String toString() {
            return tenants + " tenant(s), " + delivered + " delivered, " + failed + " failed"
                    + (tenantErrors > 0 ? ", " + tenantErrors + " tenant(s) errored" : "");
        }
    }

    /**
     * Sweep every live tenant.
     *
     * <p>The per-tenant mechanics — setting the context, restoring it afterwards, carrying on past
     * a tenant that fails — live in {@link TenantSweep}, because every other scheduled job needs
     * exactly the same thing and the first version of them all shared a bug rather than code.
     */
    public Summary sweep() {
        AtomicReference<Summary> perTenant = new AtomicReference<>(new Summary(0, 0, 0, 0));

        TenantSweep.Result result = sweep.forEachLiveTenant("Report schedule sweep",
                tenant -> perTenant.updateAndGet(s -> s.plus(runDueForCurrentTenant(tenant))));

        // Tenant counts come from the sweep rather than the accumulator: a tenant whose work threw
        // never got to add itself, and reporting it as absent would hide it.
        Summary delivered = perTenant.get();
        Summary summary = new Summary(result.tenants(), delivered.delivered(), delivered.failed(),
                result.failed());
        log.info("Report schedules: {}", summary);
        return summary;
    }

    /** The due schedules of whichever tenant is in context. Public so a test can call it directly. */
    public Summary runDueForCurrentTenant(Tenant tenant) {
        int delivered = 0;
        int failed = 0;

        for (ReportScheduleResponse due : schedules.due()) {
            try {
                deliver(due, tenant);
                // Only after delivery: the saved report's run count is a record of reports that
                // reached someone, not of times a timer fired.
                templates.incrementRunCount(due.getReportId());
                schedules.recordRun(due.getId(), true, null);
                delivered++;
            } catch (Exception e) {
                String reason = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                schedules.recordRun(due.getId(), false, reason);
                failed++;
            }
        }

        return new Summary(1, delivered, failed, 0);
    }

    private void deliver(ReportScheduleResponse schedule, Tenant tenant) {
        List<String> recipients = schedule.getRecipients() == null ? List.of() : schedule.getRecipients();
        if (recipients.isEmpty()) {
            throw new IllegalStateException("Not sent: the schedule has no recipients");
        }
        if (!email.isDeliveryConfigured()) {
            throw new IllegalStateException(
                    "Not sent: this environment has no email channel configured (SES_ENABLED is false)");
        }

        // Plain ASCII, deliberately. The em dash this line used to carry forced the Subject header
        // to be UTF-8 encoded, and the recipient's SpamAssassin adds 2.5 points for exactly that
        // (X_UTF8_ENC_H 0.5 + X_BAYES_UTF8 2.0). It scored 6.9 against a threshold of 5 and went
        // to the spam folder with SPF, DKIM and DMARC all passing. The same message with an ASCII
        // subject reached the inbox. Punctuation is not worth the delivery.
        String subject = "Scheduled report: " + schedule.getReportName();
        String body = body(schedule, tenant);

        List<String> rejected = new ArrayList<>();
        for (String recipient : recipients) {
            if (!email.sendEmail(recipient, subject, body)) {
                rejected.add(recipient);
            }
        }
        if (!rejected.isEmpty()) {
            throw new IllegalStateException("Delivery failed for " + String.join(", ", rejected));
        }
    }

    /**
     * The message body.
     *
     * <p>It links to the report rather than attaching it. Rendering a saved template to a file is
     * not implemented — {@code ReportingService.generateCustomReport} works from a fixed
     * {@code reportType} vocabulary that saved templates do not carry — and an email that attaches
     * a plausible-looking wrong file is worse than one that points at the real thing.
     */
    private String body(ReportScheduleResponse schedule, Tenant tenant) {
        String url = reportsUrl(tenant);
        StringBuilder html = new StringBuilder()
                .append("<p>Your ").append(schedule.getFrequency() == null
                        ? "scheduled" : schedule.getFrequency().toLowerCase())
                .append(" report <strong>").append(schedule.getReportName())
                .append("</strong> is ready.</p>");
        if (url != null) {
            html.append("<p><a href=\"").append(url).append("\">Open it in ShumelaHire</a></p>");
        }
        html.append("<p style=\"color:#617188;font-size:13px\">You are receiving this because you are a ")
                .append("recipient of this schedule. Change or pause it on the Reports page.</p>");
        return html.toString();
    }

    /**
     * Where the recipient should go to read it.
     *
     * <p>Built from the tenant's own subdomain, not from {@code APP_URL} alone: {@code APP_URL} is
     * the bare domain, and sending every tenant to the same host would land them on someone else's
     * front door. Returns null rather than guessing when the base URL is unset or unparseable — no
     * link at all beats a link that 404s.
     */
    private String reportsUrl(Tenant tenant) {
        if (appUrl == null || appUrl.isBlank()) {
            return null;
        }
        try {
            URI base = URI.create(appUrl.trim());
            String host = base.getHost();
            String scheme = base.getScheme();
            if (host == null || scheme == null) {
                return null;
            }
            String subdomain = tenant == null ? null : tenant.getSubdomain();
            String target = (subdomain == null || subdomain.isBlank() || host.startsWith(subdomain + "."))
                    ? host
                    : subdomain + "." + host;
            return scheme + "://" + target + "/reports";
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
