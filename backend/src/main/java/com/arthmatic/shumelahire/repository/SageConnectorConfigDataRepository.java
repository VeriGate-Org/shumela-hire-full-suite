package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageConnectorType;

import java.util.List;
import java.util.Optional;

public interface SageConnectorConfigDataRepository {
    Optional<SageConnectorConfig> findById(String id);
    SageConnectorConfig save(SageConnectorConfig entity);
    List<SageConnectorConfig> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SageConnectorConfig> findByIsActiveTrue();
    List<SageConnectorConfig> findByConnectorType(SageConnectorType connectorType);
}
