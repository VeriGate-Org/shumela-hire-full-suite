package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Tenant;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Tenant entity.
 * <p>
 * Tenant is a special case — it is the top-level partition entity.
 * Its PK in DynamoDB is {@code TENANT#{tenantId}} and it is not nested
 * under another tenant.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaTenantDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoTenantRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 */
public interface TenantDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Tenant> findById(String id);

    Tenant save(Tenant entity);

    List<Tenant> saveAll(List<Tenant> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find a tenant by subdomain (unique constraint). */
    Optional<Tenant> findBySubdomain(String subdomain);

    /** Check whether a subdomain is already taken. */
    boolean existsBySubdomain(String subdomain);

    /**
     * Find a tenant directly by its ID without requiring TenantContext.
     * Useful during tenant resolution before the context is established.
     */
    Optional<Tenant> findTenantById(String tenantId);

    /** Return all tenants. */
    List<Tenant> findAll();

    /**
     * Every tenant with the given status, without needing a tenant context.
     *
     * <p>{@link #findAll()} cannot answer this. Tenant rows are their own partition
     * (PK = SK = TENANT#{id}), so the inherited findAll queries one partition — whichever tenant
     * happens to be in context — and a caller with no context gets an exception rather than a
     * list. Anything that has to work across tenants, such as a scheduled sweep, needs this.
     */
    List<Tenant> findByStatus(String status);

    /**
     * Every tenant, whatever its status, without needing a tenant context.
     *
     * <p>Distinct from {@link #findAll()}, which despite the name queries a single partition —
     * the one belonging to whichever tenant is in context.
     */
    List<Tenant> findAllTenants();
}
