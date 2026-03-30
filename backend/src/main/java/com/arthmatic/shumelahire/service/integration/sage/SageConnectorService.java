package com.arthmatic.shumelahire.service.integration.sage;

import com.arthmatic.shumelahire.dto.integration.SageConnectionTestResult;
import com.arthmatic.shumelahire.dto.integration.SageConnectorConfigRequest;
import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageConnectorType;
import com.arthmatic.shumelahire.repository.SageConnectorConfigDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SageConnectorService {

    private static final Logger logger = LoggerFactory.getLogger(SageConnectorService.class);

    @Autowired
    private SageConnectorConfigDataRepository connectorConfigRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private MockSage300PeopleConnector sage300PeopleConnector;

    @Autowired(required = false)
    private MockSageEvolutionConnector sageEvolutionConnector;

    @Transactional(readOnly = true)
    public List<SageConnectorConfig> getAllConnectors() {
        return connectorConfigRepository.findAll();
    }

    @Transactional(readOnly = true)
    public SageConnectorConfig getConnectorById(Long id) {
        return connectorConfigRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Sage connector config not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<SageConnectorConfig> getActiveConnectors() {
        return connectorConfigRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<SageConnectorConfig> getConnectorsByType(SageConnectorType type) {
        return connectorConfigRepository.findByConnectorType(type);
    }

    public SageConnectorConfig createConnector(SageConnectorConfigRequest request) {
        SageConnectorConfig config = new SageConnectorConfig();
        config.setName(request.getName());
        config.setConnectorType(request.getConnectorType());
        config.setAuthMethod(request.getAuthMethod());
        config.setBaseUrl(request.getBaseUrl());
        config.setCredentials(request.getCredentials());
        config.setIsActive(false);

        SageConnectorConfig saved = connectorConfigRepository.save(config);
        auditLogService.logSystemAction("CREATE", "SAGE_CONNECTOR",
                "Created Sage connector: " + saved.getName() + " (id=" + saved.getId() + ", type=" + saved.getConnectorType() + ")");
        logger.info("Created Sage connector config: {} (type={})", saved.getName(), saved.getConnectorType());
        return saved;
    }

    public SageConnectorConfig updateConnector(Long id, SageConnectorConfigRequest request) {
        SageConnectorConfig config = connectorConfigRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Sage connector config not found with id: " + id));

        config.setName(request.getName());
        config.setConnectorType(request.getConnectorType());
        config.setAuthMethod(request.getAuthMethod());
        config.setBaseUrl(request.getBaseUrl());

        // Only update credentials if a new value is provided (not masked)
        if (request.getCredentials() != null && !request.getCredentials().equals("********")) {
            config.setCredentials(request.getCredentials());
        }

        SageConnectorConfig saved = connectorConfigRepository.save(config);
        auditLogService.logSystemAction("UPDATE", "SAGE_CONNECTOR",
                "Updated Sage connector: " + saved.getName() + " (id=" + saved.getId() + ")");
        logger.info("Updated Sage connector config: {} (id={})", saved.getName(), saved.getId());
        return saved;
    }

    public void deleteConnector(Long id) {
        SageConnectorConfig config = connectorConfigRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Sage connector config not found with id: " + id));

        String name = config.getName();
        connectorConfigRepository.deleteById(String.valueOf(config.getId()));
        auditLogService.logSystemAction("DELETE", "SAGE_CONNECTOR",
                "Deleted Sage connector: " + name + " (id=" + id + ")");
        logger.info("Deleted Sage connector config: {} (id={})", name, id);
    }

    public SageConnectionTestResult testConnection(Long connectorId) {
        SageConnectorConfig config = connectorConfigRepository.findById(String.valueOf(connectorId))
                .orElseThrow(() -> new RuntimeException("Sage connector config not found with id: " + connectorId));

        SageConnector connector = resolveConnector(config.getConnectorType());
        if (connector == null) {
            SageConnectionTestResult failResult = new SageConnectionTestResult(
                    false,
                    "No connector implementation available for type: " + config.getConnectorType(),
                    LocalDateTime.now()
            );
            config.setLastTestedAt(failResult.getTestedAt());
            config.setLastTestSuccess(false);
            connectorConfigRepository.save(config);
            return failResult;
        }

        SageConnectionTestResult result = connector.testConnection(config.getBaseUrl(), config.getCredentials());

        config.setLastTestedAt(result.getTestedAt());
        config.setLastTestSuccess(result.isSuccess());

        // If test succeeds, activate the connector
        if (result.isSuccess()) {
            config.setIsActive(true);
        }

        connectorConfigRepository.save(config);

        auditLogService.logSystemAction("TEST_CONNECTION", "SAGE_CONNECTOR",
                "Tested Sage connector: " + config.getName() + " (id=" + connectorId + ", success=" + result.isSuccess() + ")");
        logger.info("Tested Sage connector: {} (id={}, success={})", config.getName(), connectorId, result.isSuccess());
        return result;
    }

    /**
     * Resolve the appropriate SageConnector implementation based on the connector type.
     */
    public SageConnector resolveConnector(SageConnectorType type) {
        switch (type) {
            case SAGE_300_PEOPLE:
                return sage300PeopleConnector;
            case SAGE_EVOLUTION:
                return sageEvolutionConnector;
            case SAGE_BUSINESS_CLOUD:
                // Could be added later
                logger.warn("No connector implementation for SAGE_BUSINESS_CLOUD");
                return null;
            default:
                logger.warn("Unknown connector type: {}", type);
                return null;
        }
    }
}
