package com.arthmatic.shumelahire.service.integration.sso;

import com.arthmatic.shumelahire.dto.integration.SsoGroupMapping;
import com.arthmatic.shumelahire.entity.integration.SsoConfiguration;
import com.arthmatic.shumelahire.repository.SsoConfigurationDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class SsoGroupMappingService {

    private static final Logger logger = LoggerFactory.getLogger(SsoGroupMappingService.class);

    @Autowired
    private SsoConfigurationDataRepository ssoConfigurationRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parse group mappings JSON from an SsoConfiguration entity.
     */
    @Transactional(readOnly = true)
    public List<SsoGroupMapping> getGroupMappings(Long configId) {
        SsoConfiguration config = ssoConfigurationRepository.findById(String.valueOf(configId))
                .orElseThrow(() -> new RuntimeException("SSO configuration not found with id: " + configId));

        return parseGroupMappings(config.getGroupMappings());
    }

    /**
     * Get group mappings from the first available SSO configuration.
     */
    @Transactional(readOnly = true)
    public List<SsoGroupMapping> getGroupMappingsForTenant() {
        List<SsoConfiguration> configs = ssoConfigurationRepository.findAll();
        if (configs.isEmpty()) {
            return new ArrayList<>();
        }
        return parseGroupMappings(configs.get(0).getGroupMappings());
    }

    /**
     * Update group mappings for a specific SSO configuration.
     */
    public List<SsoGroupMapping> updateGroupMappings(Long configId, List<SsoGroupMapping> mappings) {
        SsoConfiguration config = ssoConfigurationRepository.findById(String.valueOf(configId))
                .orElseThrow(() -> new RuntimeException("SSO configuration not found with id: " + configId));

        String mappingsJson = serializeGroupMappings(mappings);
        config.setGroupMappings(mappingsJson);
        ssoConfigurationRepository.save(config);

        auditLogService.logSystemAction("UPDATE", "SSO_GROUP_MAPPINGS",
                "Updated group mappings for SSO config: " + config.getDisplayName()
                        + " (id=" + configId + ", mappingCount=" + mappings.size() + ")");
        logger.info("Updated {} group mappings for SSO config: {} (id={})",
                mappings.size(), config.getDisplayName(), configId);

        return mappings;
    }

    /**
     * Update group mappings for the first available SSO configuration.
     */
    public List<SsoGroupMapping> updateGroupMappingsForTenant(List<SsoGroupMapping> mappings) {
        List<SsoConfiguration> configs = ssoConfigurationRepository.findAll();
        if (configs.isEmpty()) {
            throw new RuntimeException("No SSO configuration found for tenant. Please create an SSO configuration first.");
        }
        return updateGroupMappings(configs.get(0).getId(), mappings);
    }

    /**
     * Parse JSON string into a list of SsoGroupMapping objects.
     */
    private List<SsoGroupMapping> parseGroupMappings(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<SsoGroupMapping>>() {});
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse group mappings JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Serialize a list of SsoGroupMapping objects into JSON string.
     */
    private String serializeGroupMappings(List<SsoGroupMapping> mappings) {
        if (mappings == null || mappings.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(mappings);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize group mappings: {}", e.getMessage());
            throw new RuntimeException("Failed to serialize group mappings", e);
        }
    }
}
