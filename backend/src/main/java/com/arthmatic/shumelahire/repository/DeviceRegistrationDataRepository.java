package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.mobile.DevicePlatform;
import com.arthmatic.shumelahire.entity.mobile.DeviceRegistration;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the DeviceRegistration entity.
 * <p>
 * DeviceRegistration extends {@link com.arthmatic.shumelahire.entity.TenantAwareEntity}
 * and resides in the {@code entity.mobile} package.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaDeviceRegistrationDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoDeviceRegistrationRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 * Employee references use {@code String employeeId} in this interface.
 */
public interface DeviceRegistrationDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<DeviceRegistration> findById(String id);

    DeviceRegistration save(DeviceRegistration entity);

    List<DeviceRegistration> saveAll(List<DeviceRegistration> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /**
     * Find active/inactive device registrations for an employee, ordered by registeredAt descending.
     *
     * @param employeeId the employee ID as a String
     * @param isActive   whether to filter by active or inactive registrations
     */
    List<DeviceRegistration> findByEmployeeIdAndIsActiveOrderByRegisteredAtDesc(String employeeId, Boolean isActive);

    /**
     * Find all device registrations for an employee, ordered by registeredAt descending.
     *
     * @param employeeId the employee ID as a String
     */
    List<DeviceRegistration> findByEmployeeIdOrderByRegisteredAtDesc(String employeeId);

    /** Find a device registration by its unique device token. */
    Optional<DeviceRegistration> findByDeviceToken(String deviceToken);

    /** Find active/inactive device registrations for a tenant, ordered by registeredAt descending. */
    List<DeviceRegistration> findByTenantIdAndIsActiveOrderByRegisteredAtDesc(String tenantId, Boolean isActive);

    /** Find device registrations by tenant, platform, and active status. */
    List<DeviceRegistration> findByTenantIdAndPlatformAndIsActive(String tenantId, DevicePlatform platform, Boolean isActive);

    /** Delete a device registration by its unique device token. */
    void deleteByDeviceToken(String deviceToken);
}
