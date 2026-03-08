package com.arthmatic.shumelahire.repository.integration;

import com.arthmatic.shumelahire.entity.integration.LmsConnectorConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LmsConnectorConfigRepository extends JpaRepository<LmsConnectorConfig, Long> {

    List<LmsConnectorConfig> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<LmsConnectorConfig> findByTenantIdAndIsActiveOrderByNameAsc(String tenantId, Boolean isActive);
}
