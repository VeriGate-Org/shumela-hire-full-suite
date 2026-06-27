package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.PlatformFeature;
import com.arthmatic.shumelahire.entity.PlatformModule;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.entity.TenantFeatureEntitlement;
import com.arthmatic.shumelahire.exception.FeatureNotEnabledException;
import com.arthmatic.shumelahire.repository.PlatformFeatureDataRepository;
import com.arthmatic.shumelahire.repository.PlatformModuleDataRepository;
import com.arthmatic.shumelahire.repository.TenantFeatureEntitlementDataRepository;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FeatureGateService {

    private static final Logger logger = LoggerFactory.getLogger(FeatureGateService.class);
    private static final String PLATFORM_TENANT = "platform";

    private final PlatformFeatureDataRepository featureRepository;
    private final PlatformModuleDataRepository moduleRepository;
    private final TenantFeatureEntitlementDataRepository entitlementRepository;
    private final TenantDataRepository tenantRepository;

    public FeatureGateService(PlatformFeatureDataRepository featureRepository,
                              PlatformModuleDataRepository moduleRepository,
                              TenantFeatureEntitlementDataRepository entitlementRepository,
                              TenantDataRepository tenantRepository) {
        this.featureRepository = featureRepository;
        this.moduleRepository = moduleRepository;
        this.entitlementRepository = entitlementRepository;
        this.tenantRepository = tenantRepository;
    }

    public boolean isFeatureEnabled(String code) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            logger.warn("No tenant context when checking feature: {}", code);
            return false;
        }

        // Platform tenant always has access to all features
        if (PLATFORM_TENANT.equals(tenantId)) {
            return true;
        }

        Optional<PlatformFeature> featureOpt = featureRepository.findByCode(code);
        if (featureOpt.isEmpty() || !featureOpt.get().isActive()) {
            return false;
        }

        PlatformFeature feature = featureOpt.get();

        // Check for tenant-specific override
        Optional<TenantFeatureEntitlement> overrideOpt =
                entitlementRepository.findByTenantIdAndFeatureId(tenantId, feature.getId());

        if (overrideOpt.isPresent()) {
            TenantFeatureEntitlement override = overrideOpt.get();
            // Expired overrides fall back to module/plan default
            if (!override.isExpired()) {
                return override.isEnabled();
            }
        }

        // Check module-based resolution
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        String tenantModules = tenant != null ? tenant.getModules() : null;

        if (tenantModules != null && !tenantModules.isBlank()) {
            return isFeatureInModules(code, tenantModules);
        }

        // Fall back to plan default
        String tenantPlan = tenant != null ? tenant.getPlan() : "TRIAL";
        return feature.isIncludedInPlan(tenantPlan);
    }

    public void requireFeature(String code) {
        if (!isFeatureEnabled(code)) {
            throw new FeatureNotEnabledException(code);
        }
    }

    public List<String> getEnabledFeatures() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return List.of();
        }

        List<PlatformFeature> activeFeatures = featureRepository.findByIsActiveTrue();

        if (PLATFORM_TENANT.equals(tenantId)) {
            return activeFeatures.stream()
                    .map(PlatformFeature::getCode)
                    .collect(Collectors.toList());
        }

        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        String tenantPlan = tenant != null ? tenant.getPlan() : "TRIAL";
        String tenantModules = tenant != null ? tenant.getModules() : null;
        List<TenantFeatureEntitlement> overrides = entitlementRepository.findByTenantId(tenantId);

        return activeFeatures.stream()
                .filter(feature -> isFeatureEnabledForTenant(feature, tenantPlan, tenantModules, overrides))
                .map(PlatformFeature::getCode)
                .collect(Collectors.toList());
    }

    private boolean isFeatureEnabledForTenant(PlatformFeature feature, String plan,
                                               String tenantModules,
                                               List<TenantFeatureEntitlement> overrides) {
        // 1. Override (highest priority)
        Optional<TenantFeatureEntitlement> override = overrides.stream()
                .filter(o -> o.getFeatureId().equals(feature.getId()))
                .findFirst();

        if (override.isPresent() && !override.get().isExpired()) {
            return override.get().isEnabled();
        }

        // 2. Module-based resolution (if tenant has modules set)
        if (tenantModules != null && !tenantModules.isBlank()) {
            return isFeatureInModules(feature.getCode(), tenantModules);
        }

        // 3. Plan-based fallback
        return feature.isIncludedInPlan(plan);
    }

    /**
     * Check if a feature code is included in any of the tenant's assigned modules.
     */
    private boolean isFeatureInModules(String featureCode, String tenantModules) {
        List<String> moduleCodes = Arrays.asList(tenantModules.split(","));
        List<PlatformModule> activeModules = moduleRepository.findByIsActiveTrue();

        return activeModules.stream()
                .filter(m -> moduleCodes.contains(m.getCode()))
                .anyMatch(m -> m.containsFeature(featureCode));
    }

    private String getTenantPlan(String tenantId) {
        return tenantRepository.findById(tenantId)
                .map(Tenant::getPlan)
                .orElse("TRIAL");
    }
}
