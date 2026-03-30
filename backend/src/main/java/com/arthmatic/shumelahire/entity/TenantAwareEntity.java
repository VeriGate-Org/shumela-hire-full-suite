package com.arthmatic.shumelahire.entity;

import com.arthmatic.shumelahire.config.tenant.TenantContext;

public abstract class TenantAwareEntity {

    private String tenantId;

    protected void prePersistTenant() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.requireCurrentTenant();
        }
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
