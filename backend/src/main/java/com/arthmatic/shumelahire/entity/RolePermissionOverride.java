package com.arthmatic.shumelahire.entity;

import java.time.LocalDateTime;

/**
 * One deliberate deviation from a role's default permissions.
 *
 * <p>Only the <b>differences</b> are stored, never a copy of the whole set. The defaults live in one
 * place — {@code src/config/permissions.ts}, which is what actually gates the interface — and
 * duplicating those forty-five ids across two languages is precisely the drift that produced the
 * problem this fixes: the product already carried two disconnected permission vocabularies, one
 * enforcing and one merely displayed.
 *
 * <p>Storing differences also means a permission added to a role's defaults later reaches every
 * tenant, instead of being masked by a stale snapshot taken the day an administrator first opened
 * the page.
 */
public class RolePermissionOverride {

    private String id;
    private String tenantId;
    /** The role this applies to, as the {@link User.Role} name. */
    private String role;
    /** The permission id, from the catalogue the interface gates on. */
    private String permissionId;
    /** True grants a permission the role does not have by default; false revokes one it does. */
    private Boolean granted;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public RolePermissionOverride() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPermissionId() { return permissionId; }
    public void setPermissionId(String permissionId) { this.permissionId = permissionId; }

    public Boolean getGranted() { return granted; }
    public void setGranted(Boolean granted) { this.granted = granted; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
