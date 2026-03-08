package com.arthmatic.shumelahire.controller.mobile;

import com.arthmatic.shumelahire.entity.mobile.DeviceRegistration;
import com.arthmatic.shumelahire.service.mobile.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/devices")
@PreAuthorize("isAuthenticated()")
public class DeviceRegistrationController {

    @Autowired
    private PushNotificationService pushNotificationService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerDevice(@RequestBody Map<String, Object> request) {
        Long employeeId = Long.valueOf(request.get("employeeId").toString());
        String deviceToken = (String) request.get("deviceToken");
        String platform = (String) request.get("platform");
        String deviceName = (String) request.getOrDefault("deviceName", "Unknown Device");

        DeviceRegistration registration = pushNotificationService.registerDevice(
                employeeId, deviceToken, platform, deviceName);

        return ResponseEntity.ok(mapRegistration(registration));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> unregisterDevice(@PathVariable Long id) {
        pushNotificationService.unregisterDevice(id);
        return ResponseEntity.ok(Map.of("message", "Device unregistered successfully"));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> getMyDevices(
            @RequestParam Long employeeId) {
        List<DeviceRegistration> devices = pushNotificationService.getMyDevices(employeeId);
        List<Map<String, Object>> response = devices.stream()
                .map(this::mapRegistration)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/push")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> sendPush(@RequestBody Map<String, Object> request) {
        Long employeeId = Long.valueOf(request.get("employeeId").toString());
        String title = (String) request.get("title");
        String body = (String) request.get("body");

        @SuppressWarnings("unchecked")
        Map<String, String> data = request.containsKey("data")
                ? (Map<String, String>) request.get("data")
                : Collections.emptyMap();

        Map<String, Object> result = pushNotificationService.sendPush(employeeId, title, body, data);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/push/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> broadcastPush(@RequestBody Map<String, Object> request) {
        String title = (String) request.get("title");
        String body = (String) request.get("body");
        Map<String, Object> result = pushNotificationService.broadcastPush(title, body);
        return ResponseEntity.ok(result);
    }

    // ==================== Mapping Helper ====================

    private Map<String, Object> mapRegistration(DeviceRegistration reg) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", reg.getId());
        map.put("employeeId", reg.getEmployee() != null ? reg.getEmployee().getId() : null);
        map.put("employeeName", reg.getEmployee() != null
                ? reg.getEmployee().getFirstName() + " " + reg.getEmployee().getLastName()
                : null);
        map.put("deviceToken", maskToken(reg.getDeviceToken()));
        map.put("platform", reg.getPlatform().name());
        map.put("deviceName", reg.getDeviceName());
        map.put("isActive", reg.getIsActive());
        map.put("lastUsedAt", reg.getLastUsedAt() != null ? reg.getLastUsedAt().toString() : null);
        map.put("registeredAt", reg.getRegisteredAt() != null ? reg.getRegisteredAt().toString() : null);
        return map;
    }

    private String maskToken(String token) {
        if (token == null || token.length() <= 8) return "****";
        return token.substring(0, 4) + "****" + token.substring(token.length() - 4);
    }
}
