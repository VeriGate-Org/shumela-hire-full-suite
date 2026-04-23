package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.PlatformFeature;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.entity.TenantFeatureEntitlement;
import com.arthmatic.shumelahire.repository.PlatformFeatureDataRepository;
import com.arthmatic.shumelahire.repository.TenantFeatureEntitlementDataRepository;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlatformAdminService {

    private static final Logger logger = LoggerFactory.getLogger(PlatformAdminService.class);

    private final PlatformFeatureDataRepository featureRepository;
    private final TenantFeatureEntitlementDataRepository entitlementRepository;
    private final TenantDataRepository tenantRepository;

    public PlatformAdminService(PlatformFeatureDataRepository featureRepository,
                                 TenantFeatureEntitlementDataRepository entitlementRepository,
                                 TenantDataRepository tenantRepository) {
        this.featureRepository = featureRepository;
        this.entitlementRepository = entitlementRepository;
        this.tenantRepository = tenantRepository;
    }

    // --- Feature CRUD ---

    public List<PlatformFeature> getAllFeatures() {
        return featureRepository.findAll();
    }

    public PlatformFeature createFeature(CreateFeatureRequest request) {
        if (featureRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Feature code already exists: " + request.code());
        }

        PlatformFeature feature = new PlatformFeature();
        feature.setCode(request.code());
        feature.setName(request.name());
        feature.setDescription(request.description());
        feature.setCategory(request.category());
        feature.setIncludedPlans(request.includedPlans());
        feature.setActive(request.isActive() != null ? request.isActive() : true);

        return featureRepository.save(feature);
    }

    public PlatformFeature updateFeature(String id, UpdateFeatureRequest request) {
        PlatformFeature feature = featureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feature not found: " + id));

        if (request.name() != null) feature.setName(request.name());
        if (request.description() != null) feature.setDescription(request.description());
        if (request.category() != null) feature.setCategory(request.category());
        if (request.includedPlans() != null) feature.setIncludedPlans(request.includedPlans());
        if (request.isActive() != null) feature.setActive(request.isActive());

        return featureRepository.save(feature);
    }

    public void deleteFeature(String id) {
        if (!featureRepository.existsById(id)) {
            throw new IllegalArgumentException("Feature not found: " + id);
        }
        featureRepository.deleteById(id);
    }

    // --- Tenant Management ---

    public Page<Tenant> listAllTenants(Pageable pageable) {
        // TenantDataRepository only exposes findAll(); paginate in-memory
        List<Tenant> all = tenantRepository.findAll();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<Tenant> pageContent = start >= all.size() ? List.of() : all.subList(start, end);
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    public Tenant getTenant(String tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));
    }

    public List<TenantFeatureSummary> getTenantFeatureSummary(String tenantId) {
        Tenant tenant = getTenant(tenantId);
        List<PlatformFeature> allFeatures = featureRepository.findByIsActiveTrue();
        List<TenantFeatureEntitlement> overrides = entitlementRepository.findByTenantId(tenantId);

        return allFeatures.stream().map(feature -> {
            TenantFeatureEntitlement override = overrides.stream()
                    .filter(o -> o.getFeatureId().equals(feature.getId()))
                    .findFirst()
                    .orElse(null);

            boolean planDefault = feature.isIncludedInPlan(tenant.getPlan());
            boolean enabled;
            String source;

            if (override != null && !override.isExpired()) {
                enabled = override.isEnabled();
                source = "OVERRIDE";
            } else {
                enabled = planDefault;
                source = "PLAN_DEFAULT";
            }

            return new TenantFeatureSummary(
                    feature.getId(),
                    feature.getCode(),
                    feature.getName(),
                    feature.getCategory(),
                    enabled,
                    source,
                    planDefault,
                    override != null ? override.getReason() : null,
                    override != null ? override.getExpiresAt() : null
            );
        }).collect(Collectors.toList());
    }

    // --- Entitlements ---

    @Transactional
    public TenantFeatureEntitlement setEntitlement(String tenantId, String featureId,
                                                    SetEntitlementRequest request) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new IllegalArgumentException("Tenant not found: " + tenantId);
        }
        if (!featureRepository.existsById(featureId)) {
            throw new IllegalArgumentException("Feature not found: " + featureId);
        }

        TenantFeatureEntitlement entitlement = entitlementRepository
                .findByTenantIdAndFeatureId(tenantId, featureId)
                .orElseGet(() -> {
                    TenantFeatureEntitlement e = new TenantFeatureEntitlement();
                    e.setTenantId(tenantId);
                    e.setFeatureId(featureId);
                    return e;
                });

        entitlement.setEnabled(request.enabled());
        entitlement.setReason(request.reason());
        entitlement.setGrantedBy(request.grantedBy());
        entitlement.setExpiresAt(request.expiresAt());

        logger.info("Setting feature entitlement: tenant={}, featureId={}, enabled={}, reason={}",
                tenantId, featureId, request.enabled(), request.reason());

        return entitlementRepository.save(entitlement);
    }

    @Transactional
    public void removeEntitlement(String tenantId, String featureId) {
        entitlementRepository.deleteByTenantIdAndFeatureId(tenantId, featureId);
        logger.info("Removed feature entitlement override: tenant={}, featureId={}", tenantId, featureId);
    }

    // --- DTOs ---

    public record CreateFeatureRequest(
            String code, String name, String description,
            String category, String includedPlans, Boolean isActive) {}

    public record UpdateFeatureRequest(
            String name, String description,
            String category, String includedPlans, Boolean isActive) {}

    public record SetEntitlementRequest(
            boolean enabled, String reason, String grantedBy, LocalDateTime expiresAt) {}

    public record TenantFeatureSummary(
            String featureId, String code, String name, String category,
            boolean enabled, String source, boolean planDefault,
            String reason, LocalDateTime expiresAt) {}
}
