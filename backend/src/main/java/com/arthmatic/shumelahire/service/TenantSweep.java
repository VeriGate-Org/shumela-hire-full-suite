package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Runs a piece of work once per live tenant, with that tenant's context set.
 *
 * <p>Every scheduled job in this application reaches tenant-scoped repositories, and a scheduled
 * invocation arrives with no tenant context at all — there is no request to have set one. Without
 * this the work either throws ("Tenant context is not set") or, worse, quietly operates on
 * whichever tenant a reused Lambda thread happened to leave behind.
 *
 * <p>Three properties the callers depend on:
 *
 * <ul>
 *   <li><b>One tenant's failure does not end the sweep.</b> A job that stops at the first bad
 *       tenant silently skips every tenant after it, and the ones it skipped look identical to the
 *       ones that had nothing to do.</li>
 *   <li><b>The context is restored, not cleared.</b> Lambda reuses threads. Leaving a tenant id
 *       behind is a cross-tenant data leak, and clearing a context the caller had set is a bug in
 *       the other direction.</li>
 *   <li><b>TRIAL counts as live.</b> {@code Tenant.isActive()} treats ACTIVE and TRIAL alike, and a
 *       trial tenant whose reports and reminders silently stop is a trial that does not convert.</li>
 * </ul>
 */
@Service
public class TenantSweep {

    private static final Logger log = LoggerFactory.getLogger(TenantSweep.class);

    /** The statuses that mean "this tenant is using the product". Mirrors {@link Tenant#isActive()}. */
    static final List<String> LIVE_STATUSES = List.of("ACTIVE", "TRIAL");

    private final TenantDataRepository tenants;

    public TenantSweep(TenantDataRepository tenants) {
        this.tenants = tenants;
    }

    /** What a sweep did. Returned for the log and for tests. */
    public record Result(int tenants, int failed) {
        @Override
        public String toString() {
            return tenants + " tenant(s)" + (failed > 0 ? ", " + failed + " failed" : "");
        }
    }

    /**
     * Run {@code work} for each live tenant.
     *
     * @param jobLabel what to call this in the log — the job name, so a failure can be traced back
     *                 to the rule that triggered it
     */
    public Result forEachLiveTenant(String jobLabel, Consumer<Tenant> work) {
        String previous = TenantContext.getCurrentTenant();
        int count = 0;
        int failed = 0;

        try {
            for (Tenant tenant : liveTenants()) {
                count++;
                try {
                    TenantContext.setCurrentTenant(tenant.getId());
                    work.accept(tenant);
                } catch (Exception e) {
                    failed++;
                    log.error("{} failed for tenant {}: {}", jobLabel, tenant.getId(), e.getMessage(), e);
                }
            }
        } finally {
            if (previous == null) {
                TenantContext.clear();
            } else {
                TenantContext.setCurrentTenant(previous);
            }
        }

        var result = new Result(count, failed);
        log.info("{}: {}", jobLabel, result);
        return result;
    }

    /**
     * The tenants worth sweeping.
     *
     * <p>Queried by status rather than listed. {@code findAll()} cannot answer this: tenant rows
     * are their own partition (PK = SK = TENANT#{id}), so it queries whichever tenant is in context
     * and throws when there is none — which is exactly how the report sweep failed the first time
     * it ran for real.
     *
     * <p>Deduplicated by id, because a status query per status would otherwise double-count a
     * tenant if the same status were ever listed twice.
     */
    private List<Tenant> liveTenants() {
        Map<String, Tenant> byId = new LinkedHashMap<>();
        for (String status : LIVE_STATUSES) {
            for (Tenant tenant : tenants.findByStatus(status)) {
                byId.putIfAbsent(tenant.getId(), tenant);
            }
        }
        return new ArrayList<>(byId.values());
    }
}
