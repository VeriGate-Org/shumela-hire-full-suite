package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.integration.LmsConnectorConfig;

import java.util.List;
import java.util.Optional;

public interface LmsConnectorConfigDataRepository {
    Optional<LmsConnectorConfig> findById(String id);
    LmsConnectorConfig save(LmsConnectorConfig entity);
    List<LmsConnectorConfig> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<LmsConnectorConfig> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<LmsConnectorConfig> findByTenantIdAndIsActiveOrderByNameAsc(String tenantId, Boolean isActive);
}
