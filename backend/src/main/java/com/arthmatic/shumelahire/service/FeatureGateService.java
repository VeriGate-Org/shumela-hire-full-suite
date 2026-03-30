package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.PlatformFeature;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.entity.TenantFeatureEntitlement;
import com.arthmatic.shumelahire.exception.FeatureNotEnabledException;
import com.arthmatic.shumelahire.repository.PlatformFeatureDataRepository;
import com.arthmatic.shumelahire.repository.TenantFeatureEntitlementDataRepository;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FeatureGateService {

    private static final Logger logger = LoggerFactory.getLogger(FeatureGateService.class);
    private static final String PLATFORM_TENANT = "platform";

    private final PlatformFeatureDataRepository featureRepository;
    private final TenantFeatureEntitlementDataRepository entitlementRepository;
    private final TenantDataRepository tenantRepository;

    public FeatureGateService(PlatformFeatureDataRepository featureRepository,
                              TenantFeatureEntitlementDataRepository entitlementRepository,
                              TenantDataRepository tenantRepository) {
        this.featureRepository = featureRepository;
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
                entitlementRepository.findByTenantIdAndFeatureId(tenantId, String.valueOf(feature.getId()));

        if (overrideOpt.isPresent()) {
            TenantFeatureEntitlement override = overrideOpt.get();
            // Expired overrides fall back to plan default
            if (!override.isExpired()) {
                return override.isEnabled();
            }
        }

        // Fall back to plan default
        String tenantPlan = getTenantPlan(tenantId);
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

        String tenantPlan = getTenantPlan(tenantId);
        List<TenantFeatureEntitlement> overrides = entitlementRepository.findByTenantId(tenantId);

        return activeFeatures.stream()
                .filter(feature -> isFeatureEnabledForTenant(feature, tenantPlan, overrides))
                .map(PlatformFeature::getCode)
                .collect(Collectors.toList());
    }

    private boolean isFeatureEnabledForTenant(PlatformFeature feature, String plan,
                                               List<TenantFeatureEntitlement> overrides) {
        Optional<TenantFeatureEntitlement> override = overrides.stream()
                .filter(o -> o.getFeatureId().equals(feature.getId()))
                .findFirst();

        if (override.isPresent() && !override.get().isExpired()) {
            return override.get().isEnabled();
        }

        return feature.isIncludedInPlan(plan);
    }

    private String getTenantPlan(String tenantId) {
        return tenantRepository.findById(tenantId)
                .map(Tenant::getPlan)
                .orElse("TRIAL");
    }
}
