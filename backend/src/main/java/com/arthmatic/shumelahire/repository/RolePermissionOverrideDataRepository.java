package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.RolePermissionOverride;

import java.util.List;
import java.util.Optional;

public interface RolePermissionOverrideDataRepository {

    Optional<RolePermissionOverride> findById(String id);

    RolePermissionOverride save(RolePermissionOverride entity);

    void deleteById(String id);

    List<RolePermissionOverride> findAll();

    /** The stored deviation for one role/permission pair, if an administrator has set one. */
    Optional<RolePermissionOverride> findByRoleAndPermission(String role, String permissionId);
}
