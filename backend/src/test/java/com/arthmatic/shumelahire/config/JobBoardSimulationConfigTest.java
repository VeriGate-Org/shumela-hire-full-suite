package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JobBoardSimulationConfigTest {

    @Test
    void unsetMeansNobody() {
        assertEquals(Set.of(), JobBoardSimulationConfig.parseTenants(null));
        assertEquals(Set.of(), JobBoardSimulationConfig.parseTenants(""));
        assertEquals(Set.of(), JobBoardSimulationConfig.parseTenants("   "));
    }

    @Test
    void readsASingleTenant() {
        assertEquals(Set.of("idc"), JobBoardSimulationConfig.parseTenants("idc"));
    }

    @Test
    void readsSeveralAndIgnoresSpacingAndEmptyEntries() {
        assertEquals(Set.of("idc", "demo"),
                JobBoardSimulationConfig.parseTenants(" idc , demo ,, "));
    }

    @Test
    void isCaseSensitive() {
        // Tenant ids are matched exactly against TenantContext, so a
        // near-miss must not quietly enable simulation for a real tenant.
        assertFalse(JobBoardSimulationConfig.parseTenants("IDC").contains("idc"));
    }
}
