package com.arthmatic.shumelahire.service.mobile;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.mobile.DevicePlatform;
import com.arthmatic.shumelahire.entity.mobile.DeviceRegistration;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.DeviceRegistrationDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PushNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);

    @Autowired
    private DeviceRegistrationDataRepository deviceRegistrationRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Register a device for push notifications.
     */
    public DeviceRegistration registerDevice(Long employeeId, String deviceToken, String platform, String deviceName) {
        logger.info("Registering device for employee: {} platform: {}", employeeId, platform);

        // Check if device token already registered
        Optional<DeviceRegistration> existing = deviceRegistrationRepository.findByDeviceToken(deviceToken);
        if (existing.isPresent()) {
            DeviceRegistration reg = existing.get();
            reg.setIsActive(true);
            reg.setLastUsedAt(LocalDateTime.now());
            reg.setDeviceName(deviceName);
            logger.info("Reactivated existing device registration: {}", reg.getId());
            return deviceRegistrationRepository.save(reg);
        }

        Employee employee = employeeRepository.findById(String.valueOf(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        DeviceRegistration registration = new DeviceRegistration();
        registration.setEmployee(employee);
        registration.setDeviceToken(deviceToken);
        registration.setPlatform(DevicePlatform.valueOf(platform.toUpperCase()));
        registration.setDeviceName(deviceName);
        registration.setIsActive(true);
        registration.setLastUsedAt(LocalDateTime.now());

        DeviceRegistration saved = deviceRegistrationRepository.save(registration);

        auditLogService.logSystemAction("REGISTER", "DEVICE",
                "Registered " + platform + " device for employee: " + employeeId);

        return saved;
    }

    /**
     * Unregister a device (soft deactivate).
     */
    public void unregisterDevice(Long deviceId) {
        DeviceRegistration registration = deviceRegistrationRepository.findById(String.valueOf(deviceId))
                .orElseThrow(() -> new RuntimeException("Device registration not found: " + deviceId));

        registration.setIsActive(false);
        deviceRegistrationRepository.save(registration);

        auditLogService.logSystemAction("UNREGISTER", "DEVICE",
                "Unregistered device: " + deviceId);

        logger.info("Device unregistered: {}", deviceId);
    }

    /**
     * Get all active devices for an employee.
     */
    @Transactional(readOnly = true)
    public List<DeviceRegistration> getMyDevices(Long employeeId) {
        return deviceRegistrationRepository.findByEmployeeIdOrderByRegisteredAtDesc(String.valueOf(employeeId));
    }

    /**
     * Send a push notification to a specific employee (mock implementation).
     * In production, this would integrate with APNs (iOS), FCM (Android), or Web Push API.
     */
    public Map<String, Object> sendPush(Long employeeId, String title, String body, Map<String, String> data) {
        logger.info("Sending push notification to employee: {} - title: {}", employeeId, title);

        List<DeviceRegistration> activeDevices = deviceRegistrationRepository
                .findByEmployeeIdAndIsActiveOrderByRegisteredAtDesc(String.valueOf(employeeId), true);

        if (activeDevices.isEmpty()) {
            logger.warn("No active devices found for employee: {}", employeeId);
            return Map.of(
                    "success", false,
                    "message", "No active devices registered for this employee",
                    "devicesTargeted", 0
            );
        }

        int sent = 0;
        List<String> platforms = new ArrayList<>();

        for (DeviceRegistration device : activeDevices) {
            // Mock sending - in production, this would call APNs/FCM/Web Push
            logger.info("Mock push to {} device (token: {}...): {} - {}",
                    device.getPlatform(),
                    device.getDeviceToken().substring(0, Math.min(8, device.getDeviceToken().length())),
                    title, body);

            // Update last used timestamp
            device.setLastUsedAt(LocalDateTime.now());
            deviceRegistrationRepository.save(device);

            platforms.add(device.getPlatform().name());
            sent++;
        }

        auditLogService.logSystemAction("PUSH_SENT", "NOTIFICATION",
                "Push notification sent to employee " + employeeId + " on " + sent + " device(s)");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Push notification sent successfully");
        result.put("devicesTargeted", sent);
        result.put("platforms", platforms);
        result.put("title", title);
        result.put("sentAt", LocalDateTime.now().toString());
        return result;
    }

    /**
     * Send a push notification to all active devices in the tenant (broadcast).
     * Mock implementation.
     */
    public Map<String, Object> broadcastPush(String title, String body) {
        String tenantId = TenantContext.requireCurrentTenant();
        logger.info("Broadcasting push notification for tenant: {} - title: {}", tenantId, title);

        List<DeviceRegistration> activeDevices = deviceRegistrationRepository
                .findByTenantIdAndIsActiveOrderByRegisteredAtDesc(tenantId, true);

        int targetCount = activeDevices.size();
        Set<String> uniqueEmployees = activeDevices.stream()
                .map(d -> d.getEmployee().getId().toString())
                .collect(Collectors.toSet());

        logger.info("Mock broadcast push to {} devices across {} employees",
                targetCount, uniqueEmployees.size());

        auditLogService.logSystemAction("PUSH_BROADCAST", "NOTIFICATION",
                "Broadcast push to " + targetCount + " devices (" + uniqueEmployees.size() + " employees)");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Broadcast push notification queued");
        result.put("devicesTargeted", targetCount);
        result.put("employeesTargeted", uniqueEmployees.size());
        result.put("title", title);
        result.put("sentAt", LocalDateTime.now().toString());
        return result;
    }
}
