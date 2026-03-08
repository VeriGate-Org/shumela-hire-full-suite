package com.arthmatic.shumelahire.repository.mobile;

import com.arthmatic.shumelahire.entity.mobile.DevicePlatform;
import com.arthmatic.shumelahire.entity.mobile.DeviceRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, Long> {

    List<DeviceRegistration> findByEmployeeIdAndIsActiveOrderByRegisteredAtDesc(Long employeeId, Boolean isActive);

    List<DeviceRegistration> findByEmployeeIdOrderByRegisteredAtDesc(Long employeeId);

    Optional<DeviceRegistration> findByDeviceToken(String deviceToken);

    List<DeviceRegistration> findByTenantIdAndIsActiveOrderByRegisteredAtDesc(String tenantId, Boolean isActive);

    List<DeviceRegistration> findByTenantIdAndPlatformAndIsActive(String tenantId, DevicePlatform platform, Boolean isActive);

    void deleteByDeviceToken(String deviceToken);
}
