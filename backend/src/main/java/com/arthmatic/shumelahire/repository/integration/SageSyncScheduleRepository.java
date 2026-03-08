package com.arthmatic.shumelahire.repository.integration;

import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SageSyncScheduleRepository extends JpaRepository<SageSyncSchedule, Long> {

    List<SageSyncSchedule> findByConnectorId(Long connectorId);

    List<SageSyncSchedule> findByIsActiveTrueAndNextRunAtBefore(LocalDateTime dateTime);
}
