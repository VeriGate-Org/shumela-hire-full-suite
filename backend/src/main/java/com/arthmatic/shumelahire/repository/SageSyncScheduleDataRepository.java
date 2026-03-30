package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SageSyncScheduleDataRepository {
    Optional<SageSyncSchedule> findById(String id);
    SageSyncSchedule save(SageSyncSchedule entity);
    List<SageSyncSchedule> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SageSyncSchedule> findByConnectorId(String connectorId);
    List<SageSyncSchedule> findByIsActiveTrueAndNextRunAtBefore(LocalDateTime dateTime);
}
