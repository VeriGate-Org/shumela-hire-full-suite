package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The mechanics every scheduled job depends on. Each test is a way a job could go quietly wrong.
 */
class TenantSweepTest {

    private TenantDataRepository tenants;
    private TenantSweep sweep;

    @BeforeEach
    void setUp() {
        tenants = mock(TenantDataRepository.class);
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of());
        when(tenants.findByStatus("TRIAL")).thenReturn(List.of());
        sweep = new TenantSweep(tenants);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Tenant tenant(String id) {
        var t = new Tenant();
        t.setId(id);
        return t;
    }

    @Test
    @DisplayName("the work runs once per tenant, with that tenant's context set")
    void setsTheContextPerTenant() {
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of(tenant("idc"), tenant("acme")));
        List<String> seen = new ArrayList<>();

        var result = sweep.forEachLiveTenant("test", t -> seen.add(TenantContext.getCurrentTenant()));

        assertThat(seen).containsExactly("idc", "acme");
        assertThat(result.tenants()).isEqualTo(2);
        assertThat(result.failed()).isZero();
    }

    @Test
    @DisplayName("a trial tenant is swept too, because a trial that goes quiet does not convert")
    void includesTrialTenants() {
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of(tenant("idc")));
        when(tenants.findByStatus("TRIAL")).thenReturn(List.of(tenant("newco")));
        List<String> seen = new ArrayList<>();

        sweep.forEachLiveTenant("test", t -> seen.add(t.getId()));

        assertThat(seen).containsExactly("idc", "newco");
    }

    @Test
    @DisplayName("a tenant listed under two statuses is swept once, not twice")
    void deduplicatesByTenantId() {
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of(tenant("idc")));
        when(tenants.findByStatus("TRIAL")).thenReturn(List.of(tenant("idc")));
        List<String> seen = new ArrayList<>();

        sweep.forEachLiveTenant("test", t -> seen.add(t.getId()));

        assertThat(seen).containsExactly("idc");
    }

    @Test
    @DisplayName("one tenant failing does not stop the tenants after it")
    void carriesOnPastAFailure() {
        when(tenants.findByStatus("ACTIVE"))
                .thenReturn(List.of(tenant("broken"), tenant("idc"), tenant("acme")));
        List<String> seen = new ArrayList<>();

        var result = sweep.forEachLiveTenant("test", t -> {
            if ("broken".equals(t.getId())) {
                throw new IllegalStateException("table unavailable");
            }
            seen.add(t.getId());
        });

        // The two after the failure are the point: without this they would be skipped and look
        // exactly like tenants that had nothing to do.
        assertThat(seen).containsExactly("idc", "acme");
        assertThat(result.tenants()).isEqualTo(3);
        assertThat(result.failed()).isEqualTo(1);
    }

    @Test
    @DisplayName("the caller's context survives the sweep")
    void restoresAnExistingContext() {
        TenantContext.setCurrentTenant("caller");
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of(tenant("idc")));

        sweep.forEachLiveTenant("test", t -> {});

        assertThat(TenantContext.getCurrentTenant()).isEqualTo("caller");
    }

    @Test
    @DisplayName("no context before means no context after, on a thread Lambda will reuse")
    void leavesNoContextBehind() {
        when(tenants.findByStatus("ACTIVE")).thenReturn(List.of(tenant("idc")));

        sweep.forEachLiveTenant("test", t -> {});

        // Leaving "idc" set here would hand the next request on this thread another tenant's data.
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    @DisplayName("tenants are queried by status, never listed with findAll")
    void neverCallsFindAll() {
        sweep.forEachLiveTenant("test", t -> {});

        // findAll() queries PK = TENANT#{whoever is in context} and throws when there is none.
        verify(tenants, never()).findAll();
    }
}
