package com.arthmatic.shumelahire.repository.integration;

import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageConnectorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SageConnectorConfigRepository extends JpaRepository<SageConnectorConfig, Long> {

    List<SageConnectorConfig> findByIsActiveTrue();

    List<SageConnectorConfig> findByConnectorType(SageConnectorType connectorType);
}
