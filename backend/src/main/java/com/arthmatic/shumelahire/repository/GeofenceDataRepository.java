package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.attendance.Geofence;

import java.util.List;
import java.util.Optional;

public interface GeofenceDataRepository {
    Optional<Geofence> findById(String id);
    Geofence save(Geofence entity);
    List<Geofence> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Geofence> findByIsActiveTrue();
}
