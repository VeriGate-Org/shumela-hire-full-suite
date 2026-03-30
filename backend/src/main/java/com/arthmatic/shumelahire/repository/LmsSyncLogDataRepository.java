package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.integration.LmsSyncLog;

import java.util.List;
import java.util.Optional;

public interface LmsSyncLogDataRepository {
    Optional<LmsSyncLog> findById(String id);
    LmsSyncLog save(LmsSyncLog entity);
    List<LmsSyncLog> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LmsSyncLog> findByConnectorIdOrderByStartedAtDesc(String connectorId);
    List<LmsSyncLog> findByTenantIdOrderByStartedAtDesc(String tenantId);
}
