package com.arthmatic.shumelahire.controller.attendance;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.attendance.Geofence;
import com.arthmatic.shumelahire.service.attendance.GeofenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geofences")
@FeatureGate("GEOFENCING")
@PreAuthorize("hasRole('ADMIN')")
public class GeofenceController {

    @Autowired
    private GeofenceService geofenceService;

    @GetMapping
    public ResponseEntity<List<Geofence>> getAll() {
        return ResponseEntity.ok(geofenceService.getAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Geofence geofence = geofenceService.create(
                    (String) body.get("name"),
                    ((Number) body.get("latitude")).doubleValue(),
                    ((Number) body.get("longitude")).doubleValue(),
                    body.get("radiusMeters") != null ? ((Number) body.get("radiusMeters")).intValue() : 100,
                    (String) body.get("address"),
                    "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(geofence);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            geofenceService.delete(id, "SYSTEM");
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Boolean>> validateLocation(@RequestParam Double latitude,
                                                                  @RequestParam Double longitude) {
        boolean valid = geofenceService.isWithinAnyGeofence(latitude, longitude);
        return ResponseEntity.ok(Map.of("withinGeofence", valid));
    }
}
