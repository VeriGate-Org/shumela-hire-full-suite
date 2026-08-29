package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.PlatformFeatureDataRepository;
import com.arthmatic.shumelahire.repository.PlatformModuleDataRepository;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.repository.TenantFeatureEntitlementDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The platform tenant list — what "all tenants" has to mean.
 */
class PlatformAdminTenantListTest {

    private TenantDataRepository tenants;
    private PlatformAdminService service;

    @BeforeEach
    void setUp() {
        tenants = mock(TenantDataRepository.class);
        service = new PlatformAdminService(
                mock(PlatformFeatureDataRepository.class),
                mock(PlatformModuleDataRepository.class),
                mock(TenantFeatureEntitlementDataRepository.class),
                tenants);
    }

    private Tenant tenant(String id, String name, String status) {
        var t = new Tenant();
        t.setId(id);
        t.setName(name);
        t.setStatus(status);
        return t;
    }

    @Test
    @DisplayName("every tenant is listed, including one with an unexpected status")
    void listsEveryTenantWhateverItsStatus() {
        when(tenants.findAllTenants()).thenReturn(List.of(
                tenant("idc", "IDC", "ACTIVE"),
                tenant("old", "Old Co", "SUSPENDED"),
                // Status is a free-form String, so this is legal and a status-based listing would
                // have dropped it silently.
                tenant("pilot", "Pilot Co", "PILOT")));

        var page = service.listAllTenants(PageRequest.of(0, 20, Sort.by("name")));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).extracting(Tenant::getId)
                .containsExactly("idc", "old", "pilot");
    }

    @Test
    @DisplayName("findAll is never used, because on tenants it returns one partition")
    void neverUsesTheContextScopedFindAll() {
        when(tenants.findAllTenants()).thenReturn(List.of(tenant("idc", "IDC", "ACTIVE")));

        service.listAllTenants(PageRequest.of(0, 20));

        // findAll() queries PK = TENANT#{whoever is in context}. It does not throw here — a request
        // always has a context — it just answers a different question than the screen asks.
        verify(tenants, never()).findAll();
    }

    @Test
    @DisplayName("the list comes back sorted by name, which the controller has always asked for")
    void sortsByName() {
        when(tenants.findAllTenants()).thenReturn(List.of(
                tenant("z", "Zenith", "ACTIVE"),
                tenant("a", "acme", "ACTIVE"),
                tenant("m", "Midlands", "ACTIVE")));

        var page = service.listAllTenants(PageRequest.of(0, 20, Sort.by("name")));

        // Case-insensitive: "acme" before "Midlands", not after "Zenith".
        assertThat(page.getContent()).extracting(Tenant::getName)
                .containsExactly("acme", "Midlands", "Zenith");
    }

    @Test
    @DisplayName("paging past the end is empty rather than an exception")
    void handlesAPageBeyondTheEnd() {
        when(tenants.findAllTenants()).thenReturn(List.of(tenant("idc", "IDC", "ACTIVE")));

        var page = service.listAllTenants(PageRequest.of(3, 20));

        assertThat(page.getContent()).isEmpty();
        assertThat(page.getTotalElements()).isEqualTo(1);
    }
}
