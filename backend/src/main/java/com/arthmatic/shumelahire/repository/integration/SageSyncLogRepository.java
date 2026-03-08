package com.arthmatic.shumelahire.repository.integration;

import com.arthmatic.shumelahire.entity.integration.SageSyncLog;
import com.arthmatic.shumelahire.entity.integration.SyncStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SageSyncLogRepository extends JpaRepository<SageSyncLog, Long> {

    Page<SageSyncLog> findByConnectorIdOrderByStartedAtDesc(Long connectorId, Pageable pageable);

    List<SageSyncLog> findByStatusOrderByStartedAtDesc(SyncStatus status);
}
