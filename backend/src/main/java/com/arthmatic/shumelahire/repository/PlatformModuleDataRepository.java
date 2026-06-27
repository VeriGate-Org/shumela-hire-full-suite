package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.PlatformModule;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the PlatformModule entity.
 * <p>
 * PlatformModule is a global (non-tenant-scoped) entity — it represents
 * product modules (bundles of features) available on the platform.
 */
public interface PlatformModuleDataRepository {

    // -- CRUD --

    Optional<PlatformModule> findById(String id);

    PlatformModule save(PlatformModule entity);

    List<PlatformModule> saveAll(List<PlatformModule> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries --

    /** Find a module by its unique code. */
    Optional<PlatformModule> findByCode(String code);

    /** All active modules. */
    List<PlatformModule> findByIsActiveTrue();

    /** Check whether a module with the given code already exists. */
    boolean existsByCode(String code);

    /** Return all platform modules. */
    List<PlatformModule> findAll();
}
