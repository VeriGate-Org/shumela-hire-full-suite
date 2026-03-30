package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.TenantFeatureEntitlement;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the TenantFeatureEntitlement entity.
 * <p>
 * TenantFeatureEntitlement has a {@code tenantId} field but does NOT extend
 * {@code TenantAwareEntity}. It tracks which platform features are enabled
 * for each tenant.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaTenantFeatureEntitlementDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoTenantFeatureEntitlementRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 */
public interface TenantFeatureEntitlementDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<TenantFeatureEntitlement> findById(String id);

    TenantFeatureEntitlement save(TenantFeatureEntitlement entity);

    List<TenantFeatureEntitlement> saveAll(List<TenantFeatureEntitlement> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Find an entitlement by tenant and feature combination. */
    Optional<TenantFeatureEntitlement> findByTenantIdAndFeatureId(String tenantId, String featureId);

    /** All entitlements for a given tenant. */
    List<TenantFeatureEntitlement> findByTenantId(String tenantId);

    /** All entitlements for a given feature (across tenants). */
    List<TenantFeatureEntitlement> findByFeatureId(String featureId);

    /** Delete the entitlement for a specific tenant+feature combination. */
    void deleteByTenantIdAndFeatureId(String tenantId, String featureId);
}
