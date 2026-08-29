package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.ReportScheduleResponse;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.service.integration.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
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

    private final TenantDataRepository tenants;
    private final ReportScheduleService schedules;
    private final ReportTemplateService templates;
    private final EmailService email;
    private final String appUrl;

    public ReportScheduleRunner(TenantDataRepository tenants,
                                ReportScheduleService schedules,
                                ReportTemplateService templates,
                                EmailService email,
                                @Value("${APP_URL:}") String appUrl) {
        this.tenants = tenants;
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
     * Sweep every active tenant.
     *
     * <p>Schedules are tenant-scoped, so the sweep sets the tenant context itself. Note what that
     * means for the other scheduled jobs in this application: several of them call tenant-scoped
     * repositories with no context set and fail with "Tenant context is not set" — visible in the
     * production log today, from the {@code @Scheduled} path. Setting it per tenant is the whole
     * job here, not an incidental detail.
     *
     * <p>One tenant's failure does not end the sweep. A single bad tenant must not stop every
     * other tenant's reports, which is exactly what an uncaught exception would do.
     */
    public Summary sweep() {
        Summary total = new Summary(0, 0, 0, 0);
        String previous = TenantContext.getCurrentTenant();

        try {
            for (Tenant tenant : tenants.findAll()) {
                if (tenant.getStatus() != null && !"ACTIVE".equalsIgnoreCase(tenant.getStatus())) {
                    continue;
                }
                try {
                    TenantContext.setCurrentTenant(tenant.getId());
                    total = total.plus(runDueForCurrentTenant(tenant));
                } catch (Exception e) {
                    log.error("Report schedule sweep failed for tenant {}: {}",
                            tenant.getId(), e.getMessage(), e);
                    total = total.plus(new Summary(1, 0, 0, 1));
                }
            }
        } finally {
            // Restore rather than clear: in Lambda this thread is reused by the next request, and
            // leaving another tenant's id behind would be a cross-tenant data leak.
            if (previous == null) {
                TenantContext.clear();
            } else {
                TenantContext.setCurrentTenant(previous);
            }
        }

        log.info("Report schedule sweep: {}", total);
        return total;
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

        String subject = schedule.getReportName() + " — scheduled report";
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
