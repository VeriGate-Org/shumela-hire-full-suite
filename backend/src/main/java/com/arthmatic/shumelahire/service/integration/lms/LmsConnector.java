package com.arthmatic.shumelahire.service.integration.lms;

import java.util.List;
import java.util.Map;

/**
 * Interface for LMS connectors. Each LMS provider (Moodle, Canvas, Blackboard, etc.)
 * implements this interface to provide standardized access to LMS operations.
 */
public interface LmsConnector {

    /**
     * Test the connection to the LMS platform.
     *
     * @param baseUrl the base URL of the LMS
     * @param apiKey  the API key for authentication
     * @return true if the connection is successful
     */
    boolean testConnection(String baseUrl, String apiKey);

    /**
     * Sync courses from the LMS platform.
     *
     * @param baseUrl the base URL of the LMS
     * @param apiKey  the API key for authentication
     * @return list of course data maps
     */
    List<Map<String, Object>> syncCourses(String baseUrl, String apiKey);

    /**
     * Sync enrollments from the LMS platform.
     *
     * @param baseUrl the base URL of the LMS
     * @param apiKey  the API key for authentication
     * @return list of enrollment data maps
     */
    List<Map<String, Object>> syncEnrollments(String baseUrl, String apiKey);
}
