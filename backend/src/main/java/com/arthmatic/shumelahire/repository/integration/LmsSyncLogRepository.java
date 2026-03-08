package com.arthmatic.shumelahire.repository.integration;

import com.arthmatic.shumelahire.entity.integration.LmsSyncLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LmsSyncLogRepository extends JpaRepository<LmsSyncLog, Long> {

    Page<LmsSyncLog> findByTenantIdOrderByStartedAtDesc(String tenantId, Pageable pageable);

    Page<LmsSyncLog> findByConnectorIdOrderByStartedAtDesc(Long connectorId, Pageable pageable);

    List<LmsSyncLog> findByConnectorIdOrderByStartedAtDesc(Long connectorId);
}
