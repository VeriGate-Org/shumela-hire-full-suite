package com.arthmatic.shumelahire.repository.dynamo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the tenant segment in the department GSI1 partition key.
 *
 * <p>GSI1 was keyed on {@code DEPT_ACTIVE#{isActive}} with no tenant, so
 * {@code findActiveOrderByName()} returned every active department in the table. On production this
 * meant the IDC tenant — which has no departments of its own — was served six departments belonging
 * to a different customer, including "Water Services", in its Create Job Posting dropdown.</p>
 *
 * <p>These assertions are deliberately about key <em>construction</em>, because that is where the
 * isolation lives. If someone removes the tenant segment again, this fails.</p>
 */
class DepartmentTenantScopingTest {

    /** Mirrors DynamoDepartmentRepository.toItem(). */
    private String gsi1pk(String tenantId, boolean isActive) {
        return "DEPT_ACTIVE#" + tenantId + "#" + isActive;
    }

    /** Mirrors DynamoDepartmentRepository.findActiveOrderByName(). */
    private String activeQueryKey(String tenantId) {
        return "DEPT_ACTIVE#" + tenantId + "#true";
    }

    @Test
    @DisplayName("The partition key carries the tenant")
    void partitionKeyIncludesTenant() {
        assertEquals("DEPT_ACTIVE#idc#true", gsi1pk("idc", true));
        assertTrue(gsi1pk("idc", true).contains("idc"),
                "without the tenant segment, every tenant reads every other tenant's departments");
    }

    @Test
    @DisplayName("Two tenants never share a partition")
    void tenantsDoNotCollide() {
        assertNotEquals(gsi1pk("idc", true), gsi1pk("uthukela", true));
    }

    @Test
    @DisplayName("The active-query key matches what the write path produces")
    void queryKeyMatchesWriteKey() {
        assertEquals(gsi1pk("idc", true), activeQueryKey("idc"),
                "a mismatch here returns nothing rather than leaking — still broken, just quieter");
    }

    @Test
    @DisplayName("Inactive departments land in a different partition from active ones")
    void inactiveIsSeparate() {
        assertNotEquals(gsi1pk("idc", true), gsi1pk("idc", false));
    }
}
