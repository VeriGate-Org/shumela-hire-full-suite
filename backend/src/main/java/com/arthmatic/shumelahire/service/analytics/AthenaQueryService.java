package com.arthmatic.shumelahire.service.analytics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.athena.AthenaClient;
import software.amazon.awssdk.services.athena.model.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for executing SQL queries against AWS Athena.
 * Handles query submission, polling for completion, and result set extraction.
 */
@Service
@Profile({"cloud", "prod", "lambda"})
public class AthenaQueryService {

    private static final Logger log = LoggerFactory.getLogger(AthenaQueryService.class);
    private static final int MAX_POLL_ATTEMPTS = 60;  // 30 seconds at 500ms intervals
    private static final long POLL_INTERVAL_MS = 500;

    private final AthenaClient athenaClient;
    private final String workgroupName;
    private final String databaseName;

    public AthenaQueryService(AthenaClient athenaClient,
                               String athenaWorkgroupName,
                               String athenaDatabaseName) {
        this.athenaClient = athenaClient;
        this.workgroupName = athenaWorkgroupName;
        this.databaseName = athenaDatabaseName;
    }

    /**
     * Execute a SQL query against Athena and return results as a list of maps.
     * Each map represents a row with column names as keys.
     *
     * @param sql The SQL query to execute
     * @return List of row maps
     * @throws AthenaQueryException if the query fails or times out
     */
    public List<Map<String, String>> executeQuery(String sql) {
        log.debug("Executing Athena query: {}", sql);

        // Submit the query
        StartQueryExecutionRequest startRequest = StartQueryExecutionRequest.builder()
                .queryString(sql)
                .queryExecutionContext(QueryExecutionContext.builder()
                        .database(databaseName)
                        .build())
                .workGroup(workgroupName)
                .build();

        StartQueryExecutionResponse startResponse = athenaClient.startQueryExecution(startRequest);
        String queryExecutionId = startResponse.queryExecutionId();

        // Poll for completion
        QueryExecutionState state = waitForCompletion(queryExecutionId);

        if (state != QueryExecutionState.SUCCEEDED) {
            GetQueryExecutionResponse execResponse = athenaClient.getQueryExecution(
                    GetQueryExecutionRequest.builder()
                            .queryExecutionId(queryExecutionId)
                            .build());
            String reason = execResponse.queryExecution().status().stateChangeReason();
            throw new AthenaQueryException("Query failed with state " + state + ": " + reason);
        }

        // Fetch results
        return fetchResults(queryExecutionId);
    }

    /**
     * Execute a parameterized query by substituting placeholders.
     * Uses simple string replacement — for production, consider prepared statements.
     */
    public List<Map<String, String>> executeQuery(String sqlTemplate, Map<String, String> params) {
        String sql = sqlTemplate;
        for (Map.Entry<String, String> param : params.entrySet()) {
            // Escape single quotes to prevent SQL injection
            String safeValue = param.getValue().replace("'", "''");
            sql = sql.replace(":" + param.getKey(), "'" + safeValue + "'");
        }
        return executeQuery(sql);
    }

    private QueryExecutionState waitForCompletion(String queryExecutionId) {
        for (int i = 0; i < MAX_POLL_ATTEMPTS; i++) {
            GetQueryExecutionResponse response = athenaClient.getQueryExecution(
                    GetQueryExecutionRequest.builder()
                            .queryExecutionId(queryExecutionId)
                            .build());

            QueryExecutionState state = response.queryExecution().status().state();

            if (state == QueryExecutionState.SUCCEEDED ||
                    state == QueryExecutionState.FAILED ||
                    state == QueryExecutionState.CANCELLED) {
                return state;
            }

            try {
                Thread.sleep(POLL_INTERVAL_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AthenaQueryException("Query polling interrupted", e);
            }
        }

        // Cancel the query if it times out
        athenaClient.stopQueryExecution(StopQueryExecutionRequest.builder()
                .queryExecutionId(queryExecutionId)
                .build());
        throw new AthenaQueryException("Query timed out after " + (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000) + " seconds");
    }

    private List<Map<String, String>> fetchResults(String queryExecutionId) {
        List<Map<String, String>> results = new ArrayList<>();
        String nextToken = null;
        List<String> columnNames = null;

        do {
            GetQueryResultsRequest.Builder requestBuilder = GetQueryResultsRequest.builder()
                    .queryExecutionId(queryExecutionId)
                    .maxResults(1000);

            if (nextToken != null) {
                requestBuilder.nextToken(nextToken);
            }

            GetQueryResultsResponse response = athenaClient.getQueryResults(requestBuilder.build());

            // Extract column names from the first page
            if (columnNames == null) {
                columnNames = response.resultSet().resultSetMetadata().columnInfo().stream()
                        .map(ColumnInfo::name)
                        .toList();
            }

            List<Row> rows = response.resultSet().rows();
            // Skip header row on the first page
            int startIndex = (nextToken == null && !rows.isEmpty()) ? 1 : 0;

            for (int i = startIndex; i < rows.size(); i++) {
                Row row = rows.get(i);
                Map<String, String> rowMap = new LinkedHashMap<>();
                List<Datum> data = row.data();
                for (int j = 0; j < columnNames.size() && j < data.size(); j++) {
                    rowMap.put(columnNames.get(j), data.get(j).varCharValue());
                }
                results.add(rowMap);
            }

            nextToken = response.nextToken();
        } while (nextToken != null);

        log.debug("Athena query returned {} rows", results.size());
        return results;
    }

    /**
     * Exception for Athena query failures.
     */
    public static class AthenaQueryException extends RuntimeException {
        public AthenaQueryException(String message) {
            super(message);
        }

        public AthenaQueryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
