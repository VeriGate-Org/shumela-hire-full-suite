package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.integration.SageSyncLog;
import com.arthmatic.shumelahire.entity.integration.SyncStatus;

import java.util.List;
import java.util.Optional;

public interface SageSyncLogDataRepository {
    Optional<SageSyncLog> findById(String id);
    SageSyncLog save(SageSyncLog entity);
    List<SageSyncLog> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SageSyncLog> findByConnectorIdOrderByStartedAtDesc(String connectorId);
    List<SageSyncLog> findByStatusOrderByStartedAtDesc(SyncStatus status);
}
