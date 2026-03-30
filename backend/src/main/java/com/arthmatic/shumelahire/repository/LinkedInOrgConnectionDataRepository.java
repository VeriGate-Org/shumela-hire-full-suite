package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.LinkedInOrgConnection;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the LinkedInOrgConnection entity.
 * <p>
 * LinkedInOrgConnection extends {@link com.arthmatic.shumelahire.entity.TenantAwareEntity}
 * and is effectively one-per-tenant (a tenant's LinkedIn organisation integration).
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaLinkedInOrgConnectionDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoLinkedInOrgConnectionRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface LinkedInOrgConnectionDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<LinkedInOrgConnection> findById(String id);

    LinkedInOrgConnection save(LinkedInOrgConnection entity);

    List<LinkedInOrgConnection> saveAll(List<LinkedInOrgConnection> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find the LinkedIn org connection for a specific tenant. */
    Optional<LinkedInOrgConnection> findByTenantId(String tenantId);

    /** Delete the LinkedIn org connection for a specific tenant. */
    void deleteByTenantId(String tenantId);
}
