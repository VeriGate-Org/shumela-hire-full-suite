package com.arthmatic.talentgate.dto.ai;

import java.util.List;
import java.util.Map;

public class SmartSearchDto {

    public static class SmartSearchRequest {
        private String query;

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
    }

    public static class SmartSearchResult {
        private String interpretedQuery;
        private Map<String, Object> parsedFilters;
        private List<Map<String, Object>> results;
        private int totalResults;

        public String getInterpretedQuery() { return interpretedQuery; }
        public void setInterpretedQuery(String interpretedQuery) { this.interpretedQuery = interpretedQuery; }
        public Map<String, Object> getParsedFilters() { return parsedFilters; }
        public void setParsedFilters(Map<String, Object> parsedFilters) { this.parsedFilters = parsedFilters; }
        public List<Map<String, Object>> getResults() { return results; }
        public void setResults(List<Map<String, Object>> results) { this.results = results; }
        public int getTotalResults() { return totalResults; }
        public void setTotalResults(int totalResults) { this.totalResults = totalResults; }
    }
}
