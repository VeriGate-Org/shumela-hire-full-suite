package com.arthmatic.shumelahire.service.integration.sage;

import com.arthmatic.shumelahire.dto.integration.SageConnectionTestResult;
import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;

import java.util.List;
import java.util.Map;

public interface SageConnector {

    SageConnectionTestResult testConnection(String baseUrl, String credentials);

    List<Map<String, Object>> fetchEntities(SageSyncEntityType entityType, String baseUrl, String credentials);

    int pushEntities(SageSyncEntityType entityType, List<Map<String, Object>> data, String baseUrl, String credentials);
}
