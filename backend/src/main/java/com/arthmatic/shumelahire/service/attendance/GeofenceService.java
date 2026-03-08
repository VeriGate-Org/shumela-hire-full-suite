package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.attendance.Geofence;
import com.arthmatic.shumelahire.repository.attendance.GeofenceRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GeofenceService {

    private static final Logger logger = LoggerFactory.getLogger(GeofenceService.class);

    @Autowired
    private GeofenceRepository geofenceRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Geofence create(String name, Double latitude, Double longitude, Integer radiusMeters, String address, String userId) {
        Geofence geofence = new Geofence();
        geofence.setName(name);
        geofence.setLatitude(latitude);
        geofence.setLongitude(longitude);
        geofence.setRadiusMeters(radiusMeters != null ? radiusMeters : 100);
        geofence.setAddress(address);
        geofence = geofenceRepository.save(geofence);

        auditLogService.saveLog(userId, "CREATE", "GEOFENCE", geofence.getId().toString(), "Created geofence: " + name);
        logger.info("Geofence created: {} at ({}, {})", name, latitude, longitude);
        return geofence;
    }

    @Transactional(readOnly = true)
    public List<Geofence> getAll() {
        return geofenceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Geofence> getActive() {
        return geofenceRepository.findByIsActiveTrue();
    }

    public boolean isWithinAnyGeofence(double latitude, double longitude) {
        return geofenceRepository.findByIsActiveTrue().stream()
                .anyMatch(g -> g.isWithinRadius(latitude, longitude));
    }

    public void delete(Long id, String userId) {
        Geofence geofence = geofenceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Geofence not found: " + id));
        geofenceRepository.delete(geofence);
        auditLogService.saveLog(userId, "DELETE", "GEOFENCE", id.toString(), "Deleted geofence: " + geofence.getName());
    }
}
